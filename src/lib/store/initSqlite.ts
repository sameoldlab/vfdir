export async function initSqlite() {
	const { sqlite3Worker1Promiser } = await import(`@sqlite.org/sqlite-wasm`)

	const log = console.log
	const error = console.error
	const promiser = await sqlite3Worker1Promiser.v2()

	try {
		log('Loading and initializing SQLite3 module...')

		log('Done initializing. Running demo...')

		const configResponse = await promiser('config-get', {})
		log('Running SQLite3 version', configResponse)
		const openResponse = await promiser('open', {
			filename: 'file:mydb.sqlite3?vfs=opfs',
		})
		const { dbId } = openResponse
		log(
			'OPFS is available, created persisted database at',
			openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
		)
		
		
	} catch (err) {
		if (!(err instanceof Error)) {
			err = new Error(err.result.message)
		}
		error(err.name, err.message)
	}
}
