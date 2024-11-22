<script lang="ts">
	import { page } from '$app/stores'
	import View from '$lib/components/view.svelte'
	import { pool } from '$lib/database/connectionPool.svelte'
	import type { User } from '$lib/database/schema'
	import { getChannels } from '$lib/services/api/arenav2'
	import { first } from '$lib/utils/queryProcess'

	const { username } = $derived($page.params)
	const user = $derived(
		pool.query<User, User>(
			`select id from users where slug = ? limit 1`,
			[username],
			first
		)
	)
	const channels = $derived(
		pool.query(`select * from blocks where author_slug = ?`, [username])
	)
	let error: string = $state(null)
	$effect(() => {
		if (user.loading) return
		if (user.data === null)
			error =
				'this user has not been saved. Try going to one of their channels instead'
		const [service, id] = user.data.id.split(':')
		if (service === 'arena') getChannels(id)
	})
</script>

{#if channels.error || error}
	{error}
	{channels.error}
{:else if !channels.loading}
	<View {...channels.data} />
{/if}
