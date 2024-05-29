import { sqlite3Worker1Promiser, type Promiser } from '@sqlite.org/sqlite-wasm'

export const filename = 'file:vfdir.sqlite3?vfs=opfs'
export function initSqlite(promiser: Promiser) {
	try {
		console.log('Loading and initializing SQLite3 module...')

		promiser('config-get', {}).then(configResponse => {
			console.info(
				'Running SQLite3 version',
				configResponse.result.version.libVersion
			)
		})

		promiser('open', {
			filename,
		}).then(openResponse => {
			const { dbId } = openResponse
			if (openResponse.type !== 'error') {
				console.info(
					'OPFS is available, created persisted database at',
					openResponse.result.filename.replace(/^file:(.*?)\?vfs=opfs$/, '$1')
				)
			}


		})
	} catch (err) {
		if (!(err instanceof Error)) {
			err = new Error(err.result.message)
		}
		console.error(err.name, err.message)
	}
}
}
