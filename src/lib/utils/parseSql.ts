type LiteralNode = {
  type: 'literal'
  variant: 'decimal' | 'text'
  value: string
}

type ExpressionNode = {
  type: 'expression'
  variant: 'operation'
  format: 'binary'
  operation: string
  left: ExpressionNode | ColumnNode
  right: ExpressionNode | ColumnNode | LiteralNode
}
type OrderNode = {
  type: 'expression'
  variant: 'order'
  direction: 'desc' | 'asc'
  expression: ColumnNode
  // TODO: Collate
}
type LimitNode = {
  type: 'expression'
  variant: 'limit'
  start: LiteralNode
}
type IdentifierNode<V extends string> = {
  type: 'identifier'
  variant: V
  alias?: string
  name: string
}
type ColumnNode = IdentifierNode<'column'>
type TableNode = IdentifierNode<'table'>
type SelectNode = {
  type: 'statement'
  variant: 'select'
  distinct?: boolean
  result: (IdentifierNode<'column' | 'star'> | ExpressionNode | LiteralNode)[]
  from: TableNode
  where?: ExpressionNode | LiteralNode | ColumnNode
  limit?: LimitNode
  order?: (OrderNode | ColumnNode)[]
}
const last = <T>(arr: T[]) => arr[arr.length - 1]
const ORDER = ['order', 'by']
const LIMIT = ['limit']
const WHERE_TERMINAL = [...ORDER, ...LIMIT]
export const parseSql = (sql: string) => {
  sql = sql.trim().toLowerCase()
  if (!sql.includes('select')) throw Error('only select statements supported')
  if (sql.endsWith(';')) sql = sql.split(';')[0]

  let section: 'select' | 'from' | 'result' | 'where' | 'limit' | 'order' = 'select'
  /** token tracker. resets at the start of each section */
  let t = 0
  return sql
    .split(/\s+|(?=[,()])|(?<=[,()])/g)
    .reduce((a, c, i, s) => {
      /** next token */
      const n = s[Math.min(i + 1, s.length - 1)]
      switch (c) {
        case 'distinct':
          a.distinct = true
        case 'select':
          a.variant = 'select'
          a.type = 'statement'
          t = 0
          section = 'result'
          break
        case 'from':
          t = 0
          section = 'from'
          break
        case 'where': {
          section = 'where'
          const tokens: string[] = []
          while (i + 1 < s.length && !WHERE_TERMINAL.includes(s[i + 1])) {
            i++
            tokens.push(s[i])
          }
          a.where = parseExpr(tokens)
          return a
        }
        case 'order':
        case 'by':
          t = 0
          a.order = [({ name: '', type: 'identifier', variant: 'column' })]
          section = 'order'
          break
        case 'limit':
          a.limit = { start: {} }
          t = 0
          section = 'limit'
          break
      }

      if (t !== 0)
        switch (section) {
          case "result":
            if (c === '*') {
              a.result.push({
                name: '*',
                type: 'identifier',
                variant: 'star'
              })
            } else if (c === 'as') {
              a.result[a.result.length - 1].alias = null
            } else if (last(a.result)?.alias === null) {
              last(a.result).alias = c
            } else if (c !== ',') {
              a.result.push(parseExpr([c]))
            }
            break;
          case "from":
            if (a.from.name !== undefined) {
              a.from.alias = c
            } else {
              a.from.name = c
              a.from.type = 'identifier'
              a.from.variant = 'table'
            }
            break;
          case "order":
            parseOrder(a, c)
            break;
          case "limit":
            a.limit.type = 'expression'
            a.limit.variant = 'limit'
            a.limit.start.type = 'literal'
            a.limit.start.value = c
            a.limit.start.variant = 'decimal'
            break;
        }

      t++
      return a
    }, {
      result: [],
      from: {}
    } as SelectNode)
}

const BINARY_OPERATORS = ['<', '=', 'in', 'like', '<=', '>=', '<>', '>', '!=', '-', '+', '/', '*', 'and', 'or']
const PRECEDENCE = {
  'or': 1,
  'and': 2,
  '=': 3, '<>': 3, '!=': 3, '<': 3, '<=': 3, '>': 3, '>=': 3, 'in': 3, 'like': 3,
  '+': 4, '-': 4,
  '*': 5, '/': 5
}

function parseExpr(s: string[]): ColumnNode | ExpressionNode | LiteralNode {
  let nodes: (ColumnNode | LiteralNode | ExpressionNode)[] = []
  const ops: string[] = []

  const applyOps = () => {
    const operation = ops.pop()
    const right = nodes.pop()
    const left = nodes.pop()
    nodes.push({
      type: 'expression',
      variant: 'operation',
      format: "binary",
      operation,
      left,
      right
    } as ExpressionNode)
  }

  s.forEach((c) => {
    let op: ExpressionNode['operation'] = BINARY_OPERATORS.find((v) => c.includes(v))
    if (op && c === op) {
      while (ops.length > 0 && PRECEDENCE[ops[ops.length - 1]] >= PRECEDENCE[c])
        applyOps()
      ops.push(c)
    } else if (op) {
      const split = c.split(op);
      nodes.push(parseExpr([split[0], op, split[1]]))
    } else {
      nodes.push(parseToken(c))
    }
  })
  while (ops.length > 0) applyOps()

  return nodes[0]
}

function parseToken(c: string): ColumnNode | LiteralNode {
  const match = c.match(/\'([^\']*)\'/);
  if (match) {
    return {
      value: match[1],
      type: 'literal',
      variant: 'text'
    }
  } else if (isNaN(Number.parseFloat(c))) {
    return {
      name: c,
      type: 'identifier',
      variant: 'column'
    }
  } else {
    return {
      value: c,
      type: 'literal',
      variant: 'decimal'
    }
  }
}

function parseOrder(a: SelectNode, c: string) {
  if (c === ',') {
    a.order.push({ name: '', type: 'identifier', variant: 'column' })
  } else if (c === 'desc' || c === 'asc') {
    a.order[a.order.length - 1] = {
      direction: c,
      expression: last(a.order) as ColumnNode,
      type: 'expression',
      variant: 'order',
    }
  } else {
    last(a.order).name = c
  }
}
