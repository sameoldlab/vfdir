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

export const parseSql = (sql: string) => {
  sql = sql.trim().toLowerCase()
  if (!sql.includes('select')) throw Error('only select statements supported')
  if (sql.endsWith(';')) sql = sql.split(';')[0]

  let section: 'select' | 'from' | 'result' | 'where' = 'select'
  /** token tracker. resets at the start of each section */
  let t = 0
  return sql
    .trim()
    .toLowerCase()
    .replace('\n', ' ')
    .split(' ')
    .reduce((a, c, i, s) => {
      switch (c) {
        case 'select':
          a.variant = 'select'
          a.type = 'statement'
          t = 0
          section = s[i + 1] && ['distinct', 'all'].includes(s[i + 1]) ? 'select'
            : 'result'
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
          a.where = {}
          t = 0
          section = 'where'
          break
      }

      if (t !== 0)
        switch (section) {
          case "select":
            break;
          case "result":
            if (c.includes(',')) {
              c.split(',').forEach((r) => {
                if (r.trim() === '') return
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
            } else {
              a.result.push({
                name: c,
                type: 'identifier',
                variant: 'column'
              })
            }
            break;
          case "from":
            a.from.name = c
            a.from.type = 'identifier'
            a.from.variant = 'table'
            break;
          case "where":
            break;
        }

      t++
      return a
    }, {
      result: [],
      from: {}
    } as SelectNode)
}
