<script lang="ts">
	let { ...data } = $props()
</script>

<nav>
	<a href="/" class="main">
		<div class="section">
			<svg
				width="15"
				height="15"
				viewBox="0 0 15 15"
				fill="none"
				xmlns="http://www.w3.org/2000/svg"
				><path
					d="M7.07926 0.222253C7.31275 -0.007434 7.6873 -0.007434 7.92079 0.222253L14.6708 6.86227C14.907 7.09465 14.9101 7.47453 14.6778 7.71076C14.4454 7.947 14.0655 7.95012 13.8293 7.71773L13 6.90201V12.5C13 12.7761 12.7762 13 12.5 13H2.50002C2.22388 13 2.00002 12.7761 2.00002 12.5V6.90201L1.17079 7.71773C0.934558 7.95012 0.554672 7.947 0.32229 7.71076C0.0899079 7.47453 0.0930283 7.09465 0.32926 6.86227L7.07926 0.222253ZM7.50002 1.49163L12 5.91831V12H10V8.49999C10 8.22385 9.77617 7.99999 9.50002 7.99999H6.50002C6.22388 7.99999 6.00002 8.22385 6.00002 8.49999V12H3.00002V5.91831L7.50002 1.49163ZM7.00002 12H9.00002V8.99999H7.00002V12Z"
					fill="currentColor"
					fill-rule="evenodd"
					clip-rule="evenodd"
				>
				</path></svg
			>
		</div>
	</a>
	<div class="main">
		<div class="section {data.status}">
			<h1>{data.title}</h1>
			{#if data.status === 'public'}
				<svg
					width="15"
					height="15"
					viewBox="0 0 15 15"
					fill="none"
					xmlns="http://www.w3.org/2000/svg"
					><path
						d="M7.5 11C4.80285 11 2.52952 9.62184 1.09622 7.50001C2.52952 5.37816 4.80285 4 7.5 4C10.1971 4 12.4705 5.37816 13.9038 7.50001C12.4705 9.62183 10.1971 11 7.5 11ZM7.5 3C4.30786 3 1.65639 4.70638 0.0760002 7.23501C-0.0253338 7.39715 -0.0253334 7.60288 0.0760014 7.76501C1.65639 10.2936 4.30786 12 7.5 12C10.6921 12 13.3436 10.2936 14.924 7.76501C15.0253 7.60288 15.0253 7.39715 14.924 7.23501C13.3436 4.70638 10.6921 3 7.5 3ZM7.5 9.5C8.60457 9.5 9.5 8.60457 9.5 7.5C9.5 6.39543 8.60457 5.5 7.5 5.5C6.39543 5.5 5.5 6.39543 5.5 7.5C5.5 8.60457 6.39543 9.5 7.5 9.5Z"
						fill="oklch(.7 .08 180)"
						fill-rule="evenodd"
						clip-rule="evenodd"
					></path></svg
				>
			{/if}
		</div>
		<div class="section">
			<span class="light">updated: </span>
			{new Date(data.created_at).toLocaleDateString()}
		</div>
		<div class="section">
			{data.size} <span class="light">items</span>
		</div>
	</div>
</nav>

<style>
	nav {
		display: flex;
		gap: 0.5rem;
	}
	.main {
		display: flex;
		padding: 0.375rem;
		gap: 0.375rem;
		align-items: center;
		background: oklch(0.25 0 0);
		border-radius: 1rem;
		& * {
			font-size: 1rem;
			line-height: 100%;
		}
	}
	.section {
		display: flex;
		gap: 0.25rem;
		align-items: center;
		background: oklch(0.2 0 0);
		padding: 0.75rem 1rem;
		border-radius: 0.75rem;
	}
	h1 {
		display: inline;
		font-weight: 600;
		padding-inline-end: 0.5em;
	}
	svg {
		height: 1rem;
		width: 1rem;
	}
	.light {
		opacity: 0.5;
	}
</style>
