<script lang="ts">
	import ReaderView from '$lib/components/ReaderView.svelte'
	const entries = $state([])
	let { data } = $props()
	entries.push({ title: 'title', content: 'it was the best of times' })
	console.log(data.search)
</script>

<ReaderView {...data.search} />
