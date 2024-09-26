interface BaseNode {
  type: string
  variant: 'column' | string
  alias?: string
}
interface FromNode extends BaseNode {
  type: 'table' | 'identifier'
  name: string
}
interface WhereNode extends BaseNode {
  type: 'expression' | 'identifier'
  format: 'binary'
  variant: 'operation'
  operation: string
  name?: string
  left?: WhereNode
  right?: WhereNode
}
interface ResultNode extends BaseNode {
  type: 'identifier'
  name: string
  alias?: string
}
interface SelectNode extends BaseNode {
  type: 'statement'
  variant: 'select'
  distinct?: boolean
  result: ResultNode[]
  from: FromNode
  where?: WhereNode[]
}

