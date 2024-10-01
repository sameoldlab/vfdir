import initWasm, { DB, SQLite3 } from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

type DELETE = 9
type INSERT = 18
type UPDATE = 23
type UpdateType = DELETE | INSERT | UPDATE
type UpdateEvent = [type: UpdateType, db: string, table: string, rowid: bigint]
type Data<V extends { rowid: bigint }, K = V['rowid']> = Map<K, V>
type Query<V extends { rowid: bigint }> = {
	sql: string
	data: Data<V>
}

export class DbPool {
	#maxConnections: number
	#connections = new SvelteSet<DB>()
	#sqlite: SQLite3
	dbName: string
	status = $state<'available' | 'loading' | 'error'>('loading')
	error = $state()
	#queries = $state(new SvelteMap<string, Query<object>[]>())
	constructor(
		args: { maxConnections: number | undefined, dbName: string | undefined }
	) {
		this.#maxConnections = args?.maxConnections || 5
		this.dbName = args?.dbName || 'vfdir.db'
		this.#initSql().then(sqlite => {
			this.#sqlite = sqlite
		})
	}

	async #connect() {
		this.#sqlite = this.#sqlite || await this.#initSql()

		if (this.#connections.size < this.#maxConnections) {
			let connection: DB | undefined
			try {
				connection = await this.#sqlite.open(this.dbName)
			} catch (err) {
				console.error(err)
			}
			connection.onUpdate((...args) => {
				this.#subscribe(...args)
			})
			this.#connections.add(connection)
			return connection
		}
		return [...this.#connections.values()][0]
	}
	async #initSql() {
		try {
			const sqlite = await initWasm(() => wasmUrl)
			this.status = 'available'
			return sqlite
		} catch (e) {
			this.status = 'error'
			this.error = e
		}
	}
	#subscribe(...[type, db, table, rowid]: UpdateEvent) {
		// console.log(type, rowid, db, table)
		let q = this.#queries.get(table)
		if (q) console.log(q)
		else return
		console.log('tracking insert...')
		let process = (map, newValue) => null
		switch (type) {
			case 18: {
				console.log(`Row ${rowid} inserted in ${db}:${table}`)
				process = (map, nv) => {
					if (!map.has(nv.rowid)) map.set(nv.rowid, nv)
				}
				break
			}
			case 9: {
				console.log(`Row ${rowid} deleted in ${db}:${table}`)
				break
			}
			case 23: {
				console.log(`Row ${rowid} updated in ${db}:${table}`)
				break
			}
		}
		this.exec(async (db) => {
			q.forEach(async ({ data, sql }) => {
				console.log(newD)
				(await db.execO(sql)).map((v) => {
					process(data, v)
			})
		})
	}


	async #close(connection: DB) {
		const res = await connection.close()
		this.#connections.delete(connection)
		return res
	}

	async closeAll() {
		for (const connection of this.#connections) {
			await connection.close()
		}
		this.#connections.clear()
	}

	query<O extends object>(sql: string, process: (rows: Data<O>) => Data<O> = (r) => r) {
		let value = $state<Data<O>>(new SvelteMap())
		console.log(sql)
		let db: DB
		this.#connect()
			.then(async (_db) => {
				db = _db
				let tables = (await db.tablesUsedStmt.all(null, sql))[0]
				tables.forEach((t) => {
					let q = this.#queries.get(t)
					if (q === undefined) {
						this.#queries.set(t, [])
						q = this.#queries.get(t)
						q.push({ sql, data: value })
					} else {
						q.push({ sql, data: value })
					}
				})
				const res = await db.execO<O>(sql)
				res.forEach((v) => {
					value.set(v.rowid, v)
				})
				// console.log(value)
			})
			.catch((err) => {
				console.log(err)
				throw err
			})
			.finally(() => {
				this.#close(db)
			})
		return {
			get data() { return value },
		}
	}

	async exec<R>(fn: (d: DB) => R) {
		try {
			const db = await this.#connect()
			await db.tx(async (tx) => {
				await fn(tx)
			})
			this.#close(db)
		} catch (err) {
			console.error(err)
			throw err
		}
	}
}

export const pool = new DbPool()
// const res = dp.exec((x) => x.execO<{ id: string }>(''))
