import { expect, it } from 'vitest'
import { parseSql } from './parseSql'
// AST Tests based on: https://codeschool.github.io/sqlite-parser/demo/
const sDistinct = `select distinct parent_id FROM Connnections`

it('parse basic select', () => {
  expect(parseSql('select * from Users;')).toEqual({
    "type": "statement",
    "variant": "select",
    "result": [
      {
        "type": "identifier",
        "variant": "star",
        "name": "*"
      }
    ],
    "from": {
      "type": "identifier",
      "variant": "table",
      "name": "users"
    }
  })
})

it('Args where slug', () => {
  expect(parseSql(`select id, avatar from Users where slug='sameoldlab'`)).toEqual({
    "type": "statement",
    "variant": "select",
    "result": [
      {
        "type": "identifier",
        "variant": "column",
        "name": "id"
      },
      {
        "type": "identifier",
        "variant": "column",
        "name": "avatar"
      }
    ],
    "from": {
      "type": "identifier",
      "variant": "table",
      "name": "users"
    },
    "where": {
      "type": "expression",
      "format": "binary",
      "variant": "operation",
      "operation": "=",
      "left": {
        "type": "identifier",
        "variant": "column",
        "name": "slug"
      },
      "right": {
        "type": "literal",
        "variant": "text",
        "value": "sameoldlab"
      }
    }
  })
})

it('parse math as alias ordered by with limit', () => {
  expect(parseSql(`
  SELECT published_at-created_at AS halflife
  FROM Blocks 
  ORDER BY created_at DESC, slug
  LIMIT 5
`)).toEqual({
    "type": "statement",
    "variant": "select",
    "result": [
      {
        "type": "expression",
        "format": "binary",
        "variant": "operation",
        "operation": "-",
        "left": {
          "type": "identifier",
          "variant": "column",
          "name": "published_at"
        },
        "right": {
          "type": "identifier",
          "variant": "column",
          "name": "created_at"
        },
        "alias": "halflife"
      }
    ],
    "from": {
      "type": "identifier",
      "variant": "table",
      "name": "blocks"
    },
    "order": [
      {
        "type": "expression",
        "variant": "order",
        "expression": {
          "type": "identifier",
          "variant": "column",
          "name": "created_at"
        },
        "direction": "desc"
      },
      {
        "type": "identifier",
        "variant": "column",
        "name": "slug"
      }
    ],
    "limit": {
      "type": "expression",
      "variant": "limit",
      "start": {
        "type": "literal",
        "variant": "decimal",
        "value": "5"
      }
    }
  })
})

// -- group by
// -- window
it('parse kitchen sink', () => {
  expect(parseSql(`
  select distinct head as hd 
  FROM Users u 
  WHERE u.id='dfadfdfds3432' AND b.legs = 6
  order by u.id desc
  limit 1;
`)).toEqual({
    "type": "statement",
    "variant": "select",
    "result": [
      {
        "type": "identifier",
        "variant": "column",
        "name": "head",
        "alias": "hd"
      }
    ],
    "distinct": true,
    "from": {
      "type": "identifier",
      "variant": "table",
      "name": "users",
      "alias": "u"
    },
    "where": {
      "type": "expression",
      "format": "binary",
      "variant": "operation",
      "operation": "and",
      "left": {
        "type": "expression",
        "format": "binary",
        "variant": "operation",
        "operation": "=",
        "left": {
          "type": "identifier",
          "variant": "column",
          "name": "u.id"
        },
        "right": {
          "type": "literal",
          "variant": "text",
          "value": "dfadfdfds3432"
        }
      },
      "right": {
        "type": "expression",
        "format": "binary",
        "variant": "operation",
        "operation": "=",
        "left": {
          "type": "identifier",
          "variant": "column",
          "name": "b.legs"
        },
        "right": {
          "type": "literal",
          "variant": "decimal",
          "value": "6"
        }
      }
    }
    ,
    "order": [
      {
        "type": "expression",
        "variant": "order",
        "expression": {
          "type": "identifier",
          "variant": "column",
          "name": "u.id"
        },
        "direction": "desc"
      }
    ],
    "limit": {
      "type": "expression",
      "variant": "limit",
      "start": {
        "type": "literal",
        "variant": "decimal",
        "value": "1"
      }
    }
  })
})
