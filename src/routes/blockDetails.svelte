<script lang="ts">
	import block from '$lib/dummy/block.js'
	import original from '$lib/dummy/original.png'

	console.log(block);

	const {title, class: cl, description, image, connections, user, state, visibility, created_at, source} = block
	
</script>

<h1>{title}</h1>
<p class="description">{description}</p>
<img src={block.image.original.url} crossorigin="anonymous" alt="failed">
<img src={original} alt={"description"}>
<div class="metadata">
<div class="data-item">
	<p>Type</p>
	<p>{cl}</p>
</div>
<div class="data-item">
	<p>Added</p>
	<p>{new Date(created_at).toLocaleDateString()}</p>
</div>
<div class="data-item">
	<p>By</p>
	<a href={user.slug}> {user.username} </a>
</div>
<h2>Related</h2>
<div class="connections">
{#each connections as conn}
	<div class="connection">
		<p>
			<a href={conn.slug}>{conn.title}</a>
		</p>
		<p>{conn.length} blocks</p>
		<p>{conn.user_id}</p>
	</div>
{/each}
</div>
<!--<pre>{JSON.stringify(block).replaceAll(/\{/g, '\n    ')}</pre>-->

</div>
<style>
	img {
		width: 100%;
		padding-block: 1rem;
	}
	h1, h2, h3 {
		font-size: 1rem;
		padding-block-start: .75em;
		padding-block-end: .25em;
	}
	.metadata {
		margin-inline-start: auto;
		margin-inline: auto;
		padding-inline-end: 1rem;
		max-width: 28ch;
	}
	.data-item {
		display: flex;
		justify-content: space-between;
		border-block-end: 1px solid var(--line);
	}
	.connections {
		display: grid;
		gap:.75rem;
	}
	.connection {
		display: flex;
		justify-content: space-between;
		padding: .5rem .75rem;
		background: var(--line);
	}
</style>
