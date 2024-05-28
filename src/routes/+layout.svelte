<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
  import { initSqlite, getPromiser } from '$lib/store/initSqlite.svelte'
  import { onMount } from 'svelte'

  onMount(async () => {
		let file = 'vfdir'
		const SQL = await getPromiser()
  	await initSqlite(file)

		let {dbId} = await SQL.promiser('open', {filename: `file:${file}.sqlite3?vfs=opfs`})

		console.log('', 'Query data with exec()')
    SQL.promiser('exec', {
      dbId,
      sql: 'SELECT a FROM t ORDER BY a LIMIT 3',
      callback: (result) => {
				console.log(result.type)
        if (!result.row) {
          return
        }
        console.log('', result.row)
      },
    })
		
	SQL.promiser('close', { dbId: dbId })
  });

</script>

<Header />
<slot />
