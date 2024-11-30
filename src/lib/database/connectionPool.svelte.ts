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
	#maxConnections: number = 1
	#connections = new Set<DB>()
	#sqlite: SQLite3
	dbName: string
	status = $state<'available' | 'loading' | 'error'>('loading')
	error = $state()
	#channel = new BroadcastChannel('updates')

	constructor(
		args?: { dbName: string | undefined }
	) {
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
		this.#updateBuffer.clear();
	}

	async exec<R>(fn: (tx: TXAsync, db: DB) => R) {
		try {
			const db = await this.#connect()
			try {
				await db.tx(async (tx) => {
					await fn(tx, db)
				})
			} catch (err) {
				console.error(`Error while running transaction: ${err}`)
			}
			return () => this.#close(db)
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
			if (!(err.message === 'Error: not a database')) console.warn(err)
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
