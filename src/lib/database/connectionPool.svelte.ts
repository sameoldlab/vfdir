import initWasm, { DB, SQLite3 } from '@vlcn.io/crsqlite-wasm'
import wasmUrl from '@vlcn.io/crsqlite-wasm/crsqlite.wasm?url'
import { SvelteSet } from 'svelte/reactivity'

type DELETE = 9
type INSERT = 18
type UPDATE = 23
type UpdateType = DELETE | INSERT | UPDATE
type UpdateEvent = [type: UpdateType, db: string, table: string, rowid: bigint]

export class DbPool {
	#maxConnections: number
	#connections = new SvelteSet<DB>()
	#sqlite: SQLite3
	dbName: string
	status = $state<'available' | 'loading' | 'error'>('loading')
	error = $state()
	#queries = []

	constructor(
		{ maxConnections, dbName } = { maxConnections: 5, dbName: "vfdir.db" },
	) {
		this.#maxConnections = maxConnections;
		this.dbName = dbName;
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
				this.#subscribe(...args);
			});
			this.#connections.add(connection);
			return connection;
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
		console.log(this.#queries)
		switch (type) {
			case 18: {
				console.log(`Row ${rowid} inserted in ${db}:${table}`)
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
	}

	async #close(connection: DB) {
		const res = await connection.close()
		this.#connections.delete(connection)
		return res
	}

	async #closeAll() {
		for (const connection of this.#connections) {
			await connection.close()
		}
		this.#connections.clear()
	}

	query<R>(fn: (d: DB) => R) {
		let value = $state<Awaited<R>>();
		let db: DB;
		this.#connect()
			.then(async (_db) => {
				db = _db;
				value = await fn(db);
				this.#queries.push(fn);
			})
			.catch((err) => {
				console.log(err);
				throw err;
			})
			.finally(() => {
				this.#close(db);
			});
		return value;
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
