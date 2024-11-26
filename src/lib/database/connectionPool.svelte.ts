import { parseSql } from '$lib/utils/parseSql'
import initWasm, { DB, SQLite3 } from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import type { StmtAsync, TXAsync } from '@vlcn.io/xplat-api'
// import { untrack } from 'svelte'
// import { SvelteMap, SvelteSet } from 'svelte/reactivity'

type DELETE = 9
type INSERT = 18
type UPDATE = 23
type UpdateType = DELETE | INSERT | UPDATE
type UpdateEvent = [type: UpdateType, db: string, table: string, rowid: bigint]
type Data<V> = V[]
type Query<V> = {
	stmt: StmtAsync
	bind: any[]
	setData: Data<V>
}
const log = (...args: unknown[]) => {
	if (import.meta.env.DEV)
		console.debug(...args)
}

export type QueryData<T> = {
	readonly loading: boolean;
	readonly error?: Error;
	readonly data: T;
}

export class DbPool {
	#maxConnections: number
	#connections = new Set<DB>()
	#sqlite: SQLite3
	dbName: string
	status = $state<'available' | 'loading' | 'error'>('loading')
	error = $state()
	#queries = new Map<string, Map<number, Query<object>[]>>()
	#stmts = new Map<number, StmtAsync>()
	#channel = new BroadcastChannel('updates')
	constructor(
		args?: { maxConnections: number | undefined, dbName: string | undefined }
	) {
		this.#maxConnections = args?.maxConnections || 5
		this.dbName = args?.dbName || 'vfdir.db'
		this.#initSql().then(sqlite => {
			this.#sqlite = sqlite
		})
	}

	#updateBuffer = new Map<`${string}:${UpdateType}`, Set<bigint>>()
	#timeout = null
	async #connect() {
		this.#sqlite = this.#sqlite || await this.#initSql()

		if (this.#connections.size < this.#maxConnections) {
			let connection: DB | undefined
			try {
				connection = await this.#sqlite.open(this.dbName)
			} catch (err) {
				console.error(err)
			}
			connection.onUpdate((type, db, table, row) => {
				if (!this.#updateBuffer.has(`${table}:${type}`)) {
					this.#updateBuffer.set(`${table}:${type}`, new Set())
				}
				this.#updateBuffer.get(`${table}:${type}`).add(row)

				if (this.#timeout === null) this.#timeout = setTimeout(() =>
					this.#batchSubscribe()
					, 4)

				// this.#subscribe(type, db, table, row)
			})

			this.#connections.add(connection)
			return connection
		}
		return [...this.#connections.values()][0]
	}
	#batchSubscribe() {
		this.#timeout = null
		this.#channel.postMessage(this.#updateBuffer.get(`log:18`))
		for (const [key, rowids] of this.#updateBuffer.entries()) {
			const [table, type] = key.split(':');
			this.#subscribe(Number(type), table, Array.from(rowids));
		}

		this.#updateBuffer.clear();
	}
	#subscribe(type: UpdateType, table: string, rowid: bigint[]) {
		let queries = this.#queries.get(table)
		if (!queries) return

		this.exec(async (tx) => {
			for (const sub of queries.values()) {
				try {
					// const data = stmt.get(tx, sub.bind)
					const data = await tx.execO(sub.sql, sub.bind)
					sub.setData(data)
				} catch (err) {
					console.error({ err, bind: sub.bind })
				}
			}
			/* queries.forEach(async (sub) => {
				const data = await sub.stmt.get(tx, sub.bind)//db.execO(sub.sql, sub.bind)
				sub.setData(data)
			}) */
		})
	}

	query<R extends object, M = R[]>(
		sql: string,
		bind: (string | number)[] = null,
		process: (rows: R[]) => M = (r) => r
	): QueryData<M> {

		let value = $state<R[]>([])
		let loading = $state.raw<boolean>(true)
		let error = $state<Error>(null)

		let db: DB
		this.#connect().then(async (_db) => {
			loading = true
			db = _db
			try {
				let [stmt, tables] = await prepareAndGetUsedTables(db, sql)
				const query = { sql, bind, setData }
				tables.forEach((t) => {
					let q = this.#queries.get(t)
					if (q === undefined) {
						this.#queries.set(t, new Map())
						q = this.#queries.get(t)
					}
					q.set(query.sql + JSON.stringify(query.bind), query)
				})
				stmt.finalize(null)
				stmt = null
				// })
				setData(await db.execO<R>(sql, bind))
			} catch (err) {
				error = new Error(`Error parsing used tables: ${err} for query ${sql} with binds ${bind}`)
				console.trace(error.message)
				// throw Error(`Error parsing used tables: ${err} for statement ${sql}`)
			}
		})
			.catch((err) => {
				error = err
			})
			.finally(() => {
				loading = false
				this.#close(db)
			})
		function setData(v: R[]) {
			switch (mergeArr(value, v)) {
				case false:
					console.error('merge failed')
					break
				case true:
					log('merge succesful')
					log($state.snapshot(value))
					break
			}
		}
		return {
			get data() {
				return process(value)
			},
			get error() { return error },
			get loading() { return loading },
		}
	}

	async exec<R>(fn: (tx: TXAsync, db: DB) => R) {
		try {
			const db = await this.#connect()
			try {
				await db.tx(async (tx) => {
					await fn(tx, db)
				})
			} catch (err) {
				console.error(`Error while transaction: ${err}`)
			}
			this.#close(db)
		} catch (err) {
			console.error(err)
		}
	}
	async #close(connection: DB) {
		try {
			const res = connection && await connection.close()
			this.#connections.delete(connection)
			return res
		} catch (err) {
			if (!err.message === 'Error: not a database') console.warn(err)
		}
	}
	async closeAll() {
		for (const connection of this.#connections) {
			await connection.close()
		}
		this.#connections.clear()
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
}

export const pool = new DbPool()

function prepareAndGetUsedTables(db: DB, query: string): Promise<[StmtAsync, string[]]> {
	return Promise.all([
		db.prepare(query),
		usedTables(db, query),
	]);
}
async function usedTables(db: DB, query: string): Promise<string[]> {
	const rows = await db.tablesUsedStmt.all(null, query)
	return rows.map((r) => r[0])
}

const set1 = new Set()
const map = new Map()
/** return false if a fine grained merge is not possible; else merge */
function mergeArr<T extends object>(one: T[], two: T[], key?: string): boolean | 'empty' {
	if (one.length === 0) {
		one = two
		log('filled empty')
		log({ two })
		return true
	}
	// Handle arrays of rows
	if (!Array.isArray(one) || !Array.isArray(two)) {
		log('not an array')
		return false
	}
	key = key ?? one[0].id ?? one[0].name ?? one[0].slug ?? one[0].route ?? Object.keys(one[0])[0]
	log({ key })

	// set1.clear()
	// one.forEach(t => set1.add(Object.values(t)[0]))
	// set2.clear()
	// two.forEach(t => set2.add(Object.values(t)[0]))
	// log({ set1, set2 })

	if (one.length !== two.length) {
		log('length mismatch')
		map.clear()
		one.forEach(o => map.set(o[key], o))

		for (const t of two) {
			const o = map.get(two[key])
			if (o === undefined) {
				o.push(t)
			} else {
				if (mergeObj(o, t)) continue
				log('object mismatch in len fn')
				return false
			}
		}

		return false
	}

	for (const [i, obj] of one.entries()) {
		if (mergeObj(obj, two[i])) continue
		log('object mismatch')
		return false
	}

	return true;
}

function mergeObj<T extends object>(one: T, two: T): boolean {
	if (
		typeof one !== "object" ||
		one === null ||
		typeof two !== "object" ||
		two === null
	) {
		log('improper type')
		return false;
	}

	for (const [key, value] of Object.entries(one)) {
		if (!(key in two)) {
			log('mismath key: ', key)
			return false
		}
		if (value !== two[key]) one[key] = two[key]
	}
	return true
}
