export async function getPromiser() {
	const { sqlite3Worker1Promiser } = await import(`@sqlite.org/sqlite-wasm`)

	let promiser = $state(
		await sqlite3Worker1Promiser.v2({
			debug(...args) {
				// log(args)
			},
		})
	)

	return {
		get promiser() {
			return promiser
		},
	}
}

export async function initSqlite(file: string) {
	const SQL = await getPromiser()

	try {
		console.log('Loading and initializing SQLite3 module...')

		let configResponse = await SQL.promiser('config-get', {})
		console.info('Running SQLite3 version', configResponse.result.version.libVersion)

		const openResponse = await SQL.promiser('open', {
			filename: `file:${file}.sqlite3?vfs=opfs`,
		})
		const {dbId} = openResponse
		if (openResponse.type !== 'error') {
			console.info(
				'OPFS is available, created persisted database at',
				openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
			)
		}

		await SQL.promiser('exec', { dbId, sql: 'CREATE TABLE IF NOT EXISTS t(a,b)' })
    console.log('', 'Creating a table...')

    console.log('', 'Insert some data using exec()...')
    for (let i = 20; i <= 25; ++i) {
      await SQL.promiser<'exec'>('exec', {
        dbId,
        sql: 'INSERT INTO t(a,b) VALUES (?,?)',
        bind: [i, i * 2],
      })
    }

	} catch (err) {
		if (!(err instanceof Error)) {
			err = new Error(err.result.message)
		}
		console.error(err.name, err.message)
	}

}
