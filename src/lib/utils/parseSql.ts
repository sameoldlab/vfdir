type LiteralNode = {
  type: 'literal'
  variant: 'decimal' | 'text'
  value: string
}
type FromNode = {
  type: 'table' | 'identifier'
  variant: 'table'
  name: string
}
type ExpressionNode = {
  type: 'expression'
  variant: 'operation'
  format: 'binary'
  operation: string
  left: ExpressionNode | ColumnNode
  right: ExpressionNode | ColumnNode | LiteralNode
}
type ResultNode = {
  type: 'identifier'
  name: string
  alias?: string
}
type LimitNode = {
  type: 'expression'
  variant: 'limit'
  start: LiteralNode
}
type ColumnNode = {
  type: 'identifier'
  variant: 'column'
  name: string
}
type OrderNode = {
  type: 'expression'
  variant: 'order'
  direction: 'desc' | 'asc'
  expression: ColumnNode
  // TODO: Collate
}
type SelectNode = {
  type: 'statement'
  variant: 'select'
  distinct?: boolean
  result: ResultNode[]
  from: FromNode
  where?: ExpressionNode[]
  limit?: LimitNode
  order?: (OrderNode | ColumnNode)[]
}
const last = <T>(arr: T[]) => arr[arr.length - 1]

export const parseSql = (sql: string) => {
  sql = sql.trim().toLowerCase()
  if (!sql.includes('select')) throw Error('only select statements supported')
  if (sql.endsWith(';')) sql = sql.split(';')[0]

  let section: 'select' | 'from' | 'result' | 'where' | 'limit' | 'order' = 'select'
  /** token tracker. resets at the start of each section */
  let t = 0
  return sql
    .split(/\s+/g)
    .reduce((a, c, i, s) => {
      /** next token */
      const n = s[Math.min(i + 1, s.length - 1)]
      switch (c) {
        case 'select':
          a.variant = 'select'
          a.type = 'statement'
          t = 0
          section = 'result'
          break
        case 'distinct':
          a.distinct = true
          t = 0
          section = 'result'
          break
        case 'from':
          t = 0
          section = 'from'
          break
        case 'where':
          a.where = [{ format: {}, left: {}, right: {} }]
          t = 0
          section = 'where'
          break
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
            if (c.includes(',')) {
              c.split(',').forEach((r) => {
                r = r.trim()
                if (r === '') return
                a.result.push({
                  name: r,
                  type: 'identifier',
                  variant: 'column'
                })
              })
            } else if (c === '*') {
              a.result.push({
                name: '*',
                type: 'identifier',
                variant: 'star'
              })
            } else if (c === 'as') {
              a.result[a.result.length - 1].alias = null
            } else if (last(a.result)?.alias === null) {
              last(a.result).alias = c
            } else {
              parseExpr(a.result, c)
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
          case "where":
            parseExpr(a.where, c)
            //string = `${a.where.string ?? ''}` + c
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

const OPERATORS = ['<', '=', '>', '-', '+', '/', '*']
function parseExpr(n: (ColumnNode | ResultNode | ExpressionNode)[], c: string) {
  let op: ExpressionNode['operation'] = OPERATORS.find((v) => c.includes(v))
  const ln = last(n)
  if (op) {
    if (c.length === 1) {
      n[n.length - 1] = {
        left: ln,
        operation: op,
        type: 'expression',
        variant: 'operation',
        format: 'binary',
      }
    } else if (c.length > 1) {
      console.log(c.split(op))
      const split = c.split(op);
      [split[0], op, split[1]].forEach((x) => parseExpr(n, x))
    }
  } else if (ln?.type === 'expression' && typeof ln.operation === 'string') {
    // process right
    const match = c.match(/\'([^\']*)\'/);
    if (match) {
      ln.right = {
        value: match[1],
        type: 'literal',
        variant: 'text'
      }
    } else if (isNaN(Number.parseFloat(c))) {
      ln.right = {
        name: c,
        type: 'identifier',
        variant: 'column'
      }
    } else {
      ln.right = {
        value: c,
        type: 'literal',
        variant: 'decimal'
      }
    }
  } else {
    n.push({
      name: c,
      type: 'identifier',
      variant: 'column'
    })
  }
}

function parseOrder(a: SelectNode, c: string) {
  c = c.trim()
  if (c === '') return

  if (c === ',') {
    a.order.push({ name: '', type: 'identifier', variant: 'column' })
  } else if (c.endsWith(',')) {
    [c.split(',')[0], ','].forEach((x) => parseOrder(a, x))
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
