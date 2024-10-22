<script lang="ts">
	import { Block, Channel } from '$lib/database/schema'
	import { resizer, key } from '$lib/actions'
	import { pushState } from '$app/navigation'
	// import { page } from '$app/stores'
	import { pool } from '$lib/database/connectionPool.svelte'
	import BlockDetail from '$lib/components/BlockDetails.svelte'

	let { ...data }: (Block | Channel)[] = $props()

	const addItem = (e: MouseEvent) => {
		pushState('', {
			show: true
		})
	}

	let col1Hover = $state('01J942ANKYCD2NXZ0TDCXXH5C7')
	$inspect(col1Hover)
	let col2 = $derived(
		pool.query<Block>(
			`
			SELECT b.id, b.title, b.type
			FROM Connections conn
			JOIN Blocks b ON conn.child_id = b.id
			WHERE conn.parent_id = ?
			ORDER BY conn.position;
		`,
			[col1Hover]
		)
	)

	let col2Hover: string | undefined = $state(col2[0]?.data?.id)
</script>

<main>
	<div class="pane left">
		{#each data as { id, user, slug, title }, i (id)}
			<a
				onmouseover={() => (col1Hover = id)}
				onfocus={() => (col1Hover = id)}
				href="{user}/{slug}"
				class="item"
				use:key>{title}</a
			>
		{:else}
			<div class="item">empty</div>
		{/each}
	</div>
	<div class="handle" draggable use:resizer>
		<div></div>
	</div>
	<div class="pane right">
		<!--
	<p class="item" use:key>{col1Hover}</p>
	<button onclick={addItem}>New Channel</button>-->

		{#each col2.data as { id, title }, i (id)}
			<a
				onmouseover={() => (col2Hover = id)}
				onfocus={() => (col2Hover = id)}
				href={id}
				class="item"
				use:key>{title || '-'}</a
			>
		{:else}
			<div class="item">empty</div>
		{/each}
	</div>
	<div class="handle" draggable use:resizer>
		<div></div>
	</div>

	<div class="pane detail">
		{#if col2Hover}
			<BlockDetail id={col2Hover} />
		{/if}
	</div>
</main>

<style>
	main {
		min-height: 100dvh;
		max-width: 100svw;
		overflow-x: auto;
		display: grid;
		grid-template-rows: repeat(auto-fill, 2.5rem);
		grid-template-columns: [full-start] minmax(15ch, min-content) [chan-end] 0.5rem auto 0.5rem 4fr [full-end];
	}
	.handle {
		width: 0.5rem;
		grid-row: 1 / -1;
		/* opacity: 0; */
		outline: 4px solid transparent;
		display: flex;
		justify-content: center;

		&:hover {
			animation: delayed-resize 0ms 80ms ease-out forwards;
			div {
				background-color: color-mix(in oklch, var(--line), oklch(0.7 0.2 80));
			}
		}
		& div {
			width: 1px;
			height: 100%;
			background: var(--line);
			opacity: 1;
			transition: background-color 100ms 80ms ease-out;
		}
	}

	@keyframes delayed-resize {
		from {
			pointer-events: none;
		}
		to {
			pointer-events: auto;
			cursor: col-resize;
		}
	}
	.pane {
		display: grid;
		grid-template-rows: subgrid;
		grid-row: 1 / -1;
		align-items: center;
		/* border-inline-end: 1px solid hsl(0 0% 24%); */
		/* padding: .5em; */
		/* width: 1fr; */
		padding: 0.75rem 0.15rem;
		.item {
			/* border-block: 1px solid ; */
			width: 100%;
			font-size: 0.85rem;
			padding: 0.5em 0.5em;
			overflow: hidden;
			/* height: 1.1rem; */
			white-space: nowrap;
			text-overflow: ellipsis;
			/* margin: 0.25em 0.75em; */
			&:hover,
			&:focus {
				background: oklch(0.24 0 89.88);
			}
		}
	}
	.pane.left {
		grid-column: full-start / chan-end;
		padding-inline-start: 0.5rem;
		max-width: 35ch;
		min-width: 15ch;
		/* width: 25ch; */
	}

	.pane.right {
		/* grid-column: 3 / 4; */
		min-width: 10ch;
		max-width: 30ch;
		min-width: 1fr;
		/* width: 40ch; */
		/* background: brown; */
		width: 1fr;
	}
	.pane.detail {
		/* grid-column: 5 / full-end; */
		/* background: red; */
		min-width: 30ch;
		/* width: 40ch; */
		display: block;
		overflow-y: auto;
		/* flex-direction: column; */
	}
</style>
