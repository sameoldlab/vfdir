import { parseSql } from '$lib/utils/parseSql'
import initWasm, { DB, SQLite3 } from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import type { TXAsync } from '@vlcn.io/xplat-api'
import { untrack } from 'svelte'
import { SvelteMap, SvelteSet } from 'svelte/reactivity'

type DELETE = 9
type INSERT = 18
type UPDATE = 23
type UpdateType = DELETE | INSERT | UPDATE
type UpdateEvent = [type: UpdateType, db: string, table: string, rowid: bigint]
type Data<V> = V[]
type Query<V> = {
	sql: string
	setData: Data<V>
}

export type QueryData<T> = {
	readonly loading: boolean;
	readonly error?: Error;
	readonly data: T;
}

export class DbPool {
	#maxConnections: number
	#connections = new SvelteSet<DB>()
	#sqlite: SQLite3
	dbName: string
	status = $state<'available' | 'loading' | 'error'>('loading')
	error = $state()
	#queries = $state(new SvelteMap<string, Query<object>[]>())
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
			this.#subscribe(parseInt(type), table, Array.from(rowids));
		}

		this.#updateBuffer.clear();
	}
	#subscribe(type: UpdateType, table: string, rowid: bigint[]) {
		// console.log(type, rowid, table)
		let queries = this.#queries.get(table)
		if (!queries) return
		switch (type) {
			case 18: {
				console.log(`Row ${rowid} inserted in ${table}`)
				break
			}
			case 9: {
				console.log(`Row ${rowid} deleted in ${table}`)
				break
			}
			case 23: {
				console.log(`Row ${rowid} updated in ${table}`)
				break
			}
		}
		this.exec(async (db) => {
			queries.forEach(async (sub) => {
				// let ast = parseSql(sub.sql)
				sub.setData((await db.execO(sub.sql, sub.bind)))
			})
		})
	}



	query<R extends object, M = R[]>(
		sql: string,
		bind: (string | number)[] = null,
		process: (rows: R[]) => M = (r) => r
	): QueryData<M> {

		let value = $state.raw<R[]>([])
		let loading = $state<boolean>(true)
		let error = $state<Error>(null)

		let db: DB
		untrack(() => {
			this.#connect()
				.then(async (_db) => {
					loading = true
					db = _db
					let tables = (await db.tablesUsedStmt.all(null, sql))[0]
					tables.forEach((t) => {
						let q = this.#queries.get(t)
						if (q === undefined) {
							this.#queries.set(t, [])
							q = this.#queries.get(t)
						}
						q.push({ sql, bind, setData })
					})
					value = await db.execO<R>(sql, bind)
					// console.log(value)
				})
				.catch((err) => {
					error = err
					throw err
				})
				.finally(() => {
					loading = false
					// this.#close(db)
				})
		})
		function setData(v) {
			console.log(v)
			value = v
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
			await db.tx(async (tx) => {
				await fn(tx, db)
			})
			this.#close(db)
		} catch (err) {
			console.error(err)
			throw err
		}
	}
	async #close(connection: DB) {
		const res = connection && await connection.close()
		this.#connections.delete(connection)
		return res
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
// const res = dp.exec((x) => x.execO<{ id: string }>(''))
