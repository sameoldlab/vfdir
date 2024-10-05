<script lang="ts">
	let { ...c } = $props()
</script>

<div class="channel">
	<p class="title">{c.title}</p>
	<p class="author">by {c.author_id}</p>
</div>

<style>
	.title {
		font-size: 1.5rem;
	}
	div {
		color: var(--type);
		display: flex;
		flex-direction: column;
		text-align: center;
		justify-content: center;
	}
</style>
