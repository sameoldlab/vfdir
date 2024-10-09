<script lang="ts">
	import { arenaCsvToObj } from '$lib/utils/parseArenaCsv'
	import { parseWebloc } from '$lib/utils/webloc'
	import BlockTypeCard from '$lib/components/BlockTypeCard.svelte'
	let folder: (FileSystemDirectoryHandle | FileSystemFileHandle)[] = $state([])
	let selected: FileSystemDirectoryHandle | FileSystemFileHandle = $state()
	let available = 'showOpenFilePicker' in self
	let error = $state()
	const init = async () => {
		try {
			const handle = await window.showDirectoryPicker()
			console.log(handle.entries())
			const promises = []
			for await (const entry of handle.values()) {
				folder.push(entry)
				if (entry.kind !== 'file') continue
				promises.push(
					entry.getFile().then((file) => `${file.name} (${file.size})`)
				)
				// console.log(entry)
			}
			console.log(await Promise.all(promises))
		} catch (e) {
			error = e
		}
	}
	$inspect(folder)

	const getExtension = (name: string): string => name.split('.').at(-1)
	const isText = (name: string): string | boolean => {
		const ext = getExtension(name)
		return ['csv', 'webloc', 'txt', 'html', 'svg'].includes(ext) ? ext : false
	}
	const isBlob = (name: string): boolean =>
		['png', 'jpeg', 'jpg'].includes(getExtension(name))

	const read = async (file: File) => {
		const is_text = isText(file.name)
		if (is_text) {
			const text = await file.text()
			switch (is_text) {
				case 'webloc':
					return parseWebloc(text)
				case 'csv':
					return arenaCsvToObj(text)
				default:
					return text
			}
		} else {
			const blob = await file.arrayBuffer()
			return new Blob([blob])
		}
	}
</script>

{#if available}
	<button onclick={init}>Use Are.na Export</button>
{:else}
	Oops, local file access is currently only <a
		href="https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker#browser_compatibility"
		>available on some Chromium-based browsers</a
	>. Please try a different browser or download vfdir as a desktop app to use
	with local files.
{/if}
{#if error}
	{error}
{/if}
<main>
	<div class="sidebar">
		{#if folder.length > 0}
			{#each folder as e}
				<p>
					<button
						onclick={() => {
							selected = e
						}}
						>{e.name}
					</button>
				</p>
			{/each}
		{/if}
	</div>
	{#if selected}
		{@const contents =
			selected.kind === 'file' && selected.getFile().then(read)}
		<div class="data">
			<h2>{selected.name}</h2>
			{#await contents then c}
				{#if typeof c === 'string'}
					{c}
				{:else if 'hash' in c}
					<a href={c.toString()}> {selected.name}</a>
				{:else if 'length' in c}
					{#each c as block}
						<pre><code
								>{#each Object.entries(block) as [k, v]}{#if v}{k}: {v}<br
										/>{/if}{/each}</code
							></pre>
					{/each}
				{:else if isBlob(selected.name)}
					<img src={URL.createObjectURL(c)} alt={selected.name} />
				{:else}
					{c}
				{/if}
			{/await}
		</div>
	{/if}
</main>

<style>
	main {
		display: grid;
		grid-template-columns: repeat(2, 1fr);
	}
</style>
