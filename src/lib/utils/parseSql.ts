interface BaseNode {
  type: string
  variant: 'column' | 'text' | 'operation' | 'select' | string
  alias?: string
  name?: string
}
interface FromNode extends BaseNode {
  type: 'table' | 'identifier'
  variant: 'table'
  name: string
}
interface WhereOperationNode extends BaseNode {
  type: 'expression' | 'identifier'
  variant: 'operation'
  format: 'binary'
  operation: 'text' | string
  left: BaseNode
  right: BaseNode
}
interface ColumnNode extends BaseNode {
  type: 'identifier'
  variant: 'column'
  name: string
}
interface ResultNode extends BaseNode {
  type: 'identifier'
  name: string
  alias?: string
}
interface StartNode extends BaseNode {
  type: 'literal'
  variant: 'decimal'
  value: string
}
interface LimitNode extends BaseNode {
  type: 'expression'
  variant: 'limit'
  start: StartNode
}
interface ColumnNode extends BaseNode {
  type: 'identifier'
  variant: 'column'
  name: string
}
interface OrderNode extends BaseNode {
  type: 'expression'
  variant: 'order'
  direction: 'desc' | 'asc'
  expression: ColumnNode
  // TODO: Collate
}
interface SelectNode extends BaseNode {
  type: 'statement'
  variant: 'select'
  distinct?: boolean
  result: ResultNode[]
  from: FromNode
  where?: (ColumnNode | WhereOperationNode)[]
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
              a.result.push({
                name: c,
                type: 'identifier',
                variant: 'column'
              })
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
            a.where
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
