<script lang="ts">
	let { ...c } = $props()
	import { pool } from '$lib/database/connectionPool.svelte'
	import type { User } from '$lib/database/schema'
	import { firstPick } from '@vlcn.io/xplat-api'
</script>

<div class="channel">
	<p class="title">{c.title}</p>
	<p class="author">by {c.author_slug}</p>
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
