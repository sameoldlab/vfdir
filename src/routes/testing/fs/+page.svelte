<script lang="ts">
	import { parseWebloc } from '$lib/utils/webloc'
	import { parse } from 'csv-parse/browser/esm/sync'
	import GridView from '$lib/components/views/GridView.svelte'
	import type { BlocksRow } from '$lib/database/schema'
	import * as s from 'superstruct'
	import { SvelteMap } from 'svelte/reactivity'

	let folder: Map<string, File> = $state(new SvelteMap())
	const processed: BlocksRow[] = $state([])
	const date_int = s.coerce(
		s.number(),
		s.union([s.string(), s.date()]),
		(value) =>
			typeof value === 'string' ? new Date(value).valueOf() : value.valueOf()
	)
	const ChannelCsv = s.object({
		id: s.coerce(s.number(), s.string(), (v) => parseInt(v)),
		filename: s.string(),
		title: s.string(),
		description: s.string(),
		created_at: date_int,
		updated_at: date_int,
		source: s.optional(s.string())
	})

	let selected: File = $state()
	let available = 'showOpenFilePicker' in self
	let error = $state()
	const init = async () => {
		try {
			const handle = await window.showDirectoryPicker()
			for await (const entry of handle.values()) {
				if (entry.kind !== 'file') continue
				folder.set(
					entry.name.endsWith('csv') ? 'table' : entry.name,
					await entry.getFile()
				)
			}
			toBlocks(folder, processed)
		} catch (e) {
			error = e
		}
	}

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
					const link = parseWebloc(text)
					if (link.host.includes('are.na'))
						return { type: 'channel' as const, content: link }
					else return { type: 'link' as const, content: link }
				case 'txt':
					return { type: 'text' as const, content: text }
				default:
					return { type: 'unknown' as const, content: text }
			}
		} else {
			const blob = await file.arrayBuffer()
			return { type: 'media' as const, content: new Blob([blob]) }
		}
	}

	async function toBlocks(folder: Map<string, File>, blocks: BlocksRow[] = []) {
		const tableContent = await folder.get('table').text()
		const table = parse(tableContent, {
			delimiter: ',',
			cast_date: true,
			columns: (header) =>
				header.map((h) => h.toLowerCase().replaceAll(' ', '_'))
		}) as s.Infer<typeof ChannelCsv>[]
		console.log(table)
		table.forEach(async (v, i) => {
			const file = folder.get(v.filename)
			if (!file) return
			const { type, content } = await read(file)
			let block: BlocksRow = {
				id: `${i}`,
				title: v.title,
				type,
				updated_at: v.created_at.valueOf(),
				created_at: v.updated_at.valueOf(),
				author_id: 'filesystem',
				external_ref: `fs:${v.id}`,
				provider_url: type === 'link' ? content.hostname : null,
				description: v.description,
				content:
					type !== 'media'
						? type === 'link'
							? content.toString()
							: content
						: null,
				image:
					type === 'media' ? URL.createObjectURL(content).toString() : null,
				filename: v.filename,
				source: v?.source
			}
			console.log(block)
			blocks.push(block)
		})
		return blocks
	}
</script>

<main>
	{#if available}
		<button onclick={init}>Import Local Directory</button>
	{:else}
		<p>
			File system access is currently only available in some <a
				href="https://developer.mozilla.org/en-US/docs/Web/API/Window/showOpenFilePicker#browser_compatibility"
			>
				versions of chromium.</a
			> Please use a different browser or (soon-ish, but no promises) download vfdir
			as a desktop app to use with local files.
		</p>
	{/if}
	{#if error}
		{error}
	{/if}
	<section>
		<GridView {...processed} />
	</section>
	<div class="raw">
		<div class="sidebar">
			{#each folder as [n, e]}
				<div>
					<button onclick={() => (selected = e)}>{e.name} </button>
				</div>
			{/each}
		</div>
		{#if selected}
			{@const contents = read(selected)}
			<!-- prettier-ignore -->
			<div class="data">
			<h2>{selected.name}</h2>
			{#await contents then {type, content}}
				{#if type === 'link'}
					<a href={content.toString()}> {selected.name}</a>
				{:else if type === 'text'}
					<p> {content} </p>
				{:else if type === 'media'}
					<img src={URL.createObjectURL(content)} alt={selected.name} />
				{:else}
				<pre><code>{content}</code></pre>
				{/if}
			{/await}
		</div>
		{/if}
	</div>
</main>

<style>
	button {
		padding: 0.75rem 1.5rem;
	}
	main {
		display: flex;
		flex-direction: column;
		gap: 1rem;
		min-height: 100vh;
		justify-content: center;
		align-items: center;
		padding: 1rem;
	}
	.raw {
		display: grid;
		grid-template-columns: 2fr 3fr;
		button {
			width: 100%;
			text-align: left;
		}
	}
	.data {
		max-height: 80svh;
		overflow-y: auto;
	}
	pre {
		overflow: auto;
		margin: 0.25rem;
	}
	code {
		text-wrap: wrap;
		line-break: strict;
	}
</style>
