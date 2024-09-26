import type { DB } from "@vlcn.io/crsqlite-wasm"

export const useQuery = <T extends {} & { rowId: bigint }>(db: DB, sql: string) => {
  const results = $state<T[]>([])

  const run = (tables: string[], { type, dbName, tblName, rowId }: { type: number, dbName: string, tblName: string, rowId: bigint }) => {
    console.log(`${rowId} changed in ${dbName} ${tblName}, TYPE: ${type}`);
    // console.log(arguments)
    db.execO<T>(sql).then((res) => {
      res.forEach((v) => {
        results.push(v)
      })
    }).then(() => null)//console.log(results))

    sql = sql.replace(";", "").toLowerCase()
    let cols = ""
    let clause = ""
    let inSection: "cols" | "clause" | "none" = "none"
    for (let word of sql.split(" ")) {
      switch (word) {
        case "from":
          inSection = "none";
          break;
        case "select":
          inSection = "cols";
          break;
        case "where":
          inSection = "clause";
          break;
        default:
          if (inSection === "clause") clause += word + " ";
          else if (inSection === "cols") cols += word;
          break;
      }
    }
    // console.table({cols, clause})
    // db.onUpdate((type, dbName, table, row) => {
    if (rowId == undefined && rowId !== BigInt(0)) return;
    if (!tables.includes(tblName)) return;

    db.execO<T>(
      `select ${cols} from ${tables[0]} ${clause === "" ? "where" : "and"} rowId = ${rowId};`,
    ).then((res) => {
      if (type === 18) {
        res.forEach((r) => {
          // results.set(row, r);
        });
      } else if (type === 23) {
        res.forEach((r) => {
          // results.set(row, r);
        });
      } else {
        // results.delete(row);
      }
    })
    // })
  }

  console.log(`SQL: ${sql}`)
  db.tablesUsedStmt.all(null, sql).then((res) => {
    const tables = res[0]
    db.onUpdate((type, dbName, tblName, rowId) => {
      if (tables.includes(tblName))
        run(tables, { type, dbName, tblName, rowId })
    })
  })

  return {
    get val() { return results },
    destroy() {
      return
    }
  }
}
