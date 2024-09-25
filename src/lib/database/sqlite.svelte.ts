import initWasm, { DB } from "@vlcn.io/crsqlite-wasm";
import wasmUrl from "@vlcn.io/crsqlite-wasm/crsqlite.wasm?url";


export class Cr {
	db = $state<DB>(undefined)
	instances = $state(0)
	fulfilled = $state(false)
	error = $state<Error>()
}

export const db = init()

function init() {
	const cr = new Cr()

	async function initialize() {
		cr.fulfilled = false
		cr.instances++
		console.log(`${cr.instances} instances`)
		try {
			const sqlite = await initWasm(() => wasmUrl);
			cr.db = await sqlite.open("my-database.db");
			cr.fulfilled = cr.db !== undefined
		} catch (err) {
			console.error(err)
			cr.error = err
			cr.fulfilled = false
		}
	}
	if (cr.db == undefined) initialize()

	return cr
}
