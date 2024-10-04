<script lang="ts">
	let { ...c } = $props()
</script>

<div class="channel">
	{c.title}
	<br />
	by {c.author_id}
</div>
