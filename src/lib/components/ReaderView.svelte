<script lang="ts">
	let { ...entries } = $props()
	let selected = $state()
</script>

<main>
	<div class="list">
		{#each entries as entry, i}
			<button
				onclick={() => {
					selected = i
				}}
			>
				{entry.title}</button
			>
		{/each}
	</div>
	<div class="content">
		<article>
			{@html entries[selected]?.content}
			<figure><img src="" alt="" /></figure>
		</article>
	</div>
</main>

<style>
	main {
		display: grid;
		grid-template-columns: 1fr 3fr;
		button {
			width: 100%;
			text-align: left;
		}
	}
	.list {
		background: #fff1;
	}
	:global(article) {
		padding: 2rem 1rem;
		font-family: Cambria, Cochin, Georgia, Times, 'Times New Roman', serif;
		figure,
		img {
			max-width: 100%;
		}
	}
</style>
