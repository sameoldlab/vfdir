<script lang="ts">
	import { micromark } from 'micromark'
	type Props = {
		/** Markdown string */
		content: string
	}
	let { ...c }: Props = $props()

	const content = micromark(c.content)
</script>

<div class="text"><p>{@html content}</p></div>

<style>
	p {
		height: 100%;
		padding: 1ch;
		max-width: 100%;
		line-break: strict;
		white-space: pre-wrap;
		overflow-wrap: anywhere;
		text-overflow: clip;
	}
</style>
