import initWasm, { DB, SQLite3 } from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";
import { SvelteSet } from "svelte/reactivity";

type DELETE = 9;
type INSERT = 18;
type UPDATE = 23;
type UpdateType = DELETE | INSERT | UPDATE;
type UpdateEvent = [type: UpdateType, db: string, table: string, rowid: bigint];

class DbPool {
	#maxConnections: number;
	#connections = new SvelteSet<DB>();
	#sqlite: SQLite3;
	dbName: string;
	available = $state(false)

	constructor(
		{ maxConnections, dbName } = { maxConnections: 5, dbName: "vfdir.db" },
	) {
		this.#maxConnections = maxConnections;
		this.dbName = dbName;
		try {
			initWasm(() => wasmUrl).then((sqlite) => (this.#sqlite = sqlite));
			this.available = true
		} catch(err) {
			console.error(err)
			this.available = false
		}
	}

	async #connect() {
		if (this.#connections.size < this.#maxConnections) {
			let connection: DB | undefined
			try {
				connection = await this.#sqlite.open(this.dbName);
			} catch (err) {
				console.error(err);
				throw err;
			}
			connection.onUpdate(this.#subscribe);
			this.#connections.add(connection);
			return connection;
		}
		return [...this.#connections.values()][0];
	}

	#subscribe(...[type, db, table, rowid]: UpdateEvent) {
		console.log({ type, dbName: db, tblName: table, rowid });
		console.log(this.queries)
		switch (type) {
		}
	}

	async #close(connection: DB) {
		const res = await connection.close();
		this.#connections.delete(connection);
		return res;
	}

	async #closeAll() {
		for (const connection of this.#connections) {
			await connection.close();
		}
		this.#connections.clear();
	}

	exec<R>(fn: (d: DB) => R) {
		let value = $state<Awaited<R>>();
		let db: DB;
		this.#connect()
			.then(async (_db) => {
				db = _db;
				value = await fn(db);
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
}

export const dp = new DbPool();
const res = dp.exec((x) => x.execO<{ id: string }>(""));
