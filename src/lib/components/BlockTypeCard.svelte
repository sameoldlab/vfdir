<script>
	let { ...c } = $props()
</script>

<div class="item {status}">
	<a href={c.type === 'channel' ? `${c.user}/${c.slug}` : `/block/${c.id}`}>
		<div>
			<p>
				{c.title}
			</p>
		</div>
	</a>
</div>

<style>
	.item {
		border: 1px solid #666;
		box-sizing: border-box;
		padding: 0.25em;
		width: 100%;
		aspect-ratio: 1 / 1;

		& > a {
			display: block;
			width: 100%;
			height: 100%;
		}
	}
	.public {
		border: 1px solid green;
	}
	.private {
		border: 1px solid #666;
	}
	.closed {
		border: 1px solid red;
	}
</style>
