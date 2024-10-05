<script lang="ts">
	let { ...c } = $props()
</script>

<div class="text"><p>{c.content}</p></div>

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
