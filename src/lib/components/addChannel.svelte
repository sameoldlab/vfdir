<script lang="ts">
	import Modal from './modal.svelte'
	let { id = $bindable('addChannel') }: { id: string } = $props()
	const sanititize = (string = '') =>
		string.trim().replaceAll(/ |\/|\\|\&|\%|\#|:/g, '-')

	let title = $state('')
	const slug = $derived({ collision: false, string: sanititize(title) })
	let description = $state('')
	let service = $state('local')
	const submit = (e: MouseEvent) => {
		e.preventDefault()
	}
</script>

<Modal {id}>
	<form>
		<h1>Create Channel</h1>
		<div>
			<label for="channel-title">Title </label>
			<input
				bind:value={title}
				id="channel-title"
				type="text"
				placeholder="title"
			/>
			<p>slug: <code>{slug.string}</code></p>
		</div>
		<div>
			<label for="channel-description">Description</label>
			<textarea
				bind:value={description}
				id="chanel-description"
				placeholder="channel description"
			></textarea>
		</div>
		<div>
			<label for="channel-service">Backing Service</label>
			<select bind:value={service} id="channel-service">
				<option value="local" selected>none (local)</option>
				<option value="arena">are.na</option>
				<option value="raindrop" disabled>raindrop</option>
			</select>
		</div>
		<div class="submit">
			<button class="btn" onclick={submit}>Create</button>
		</div>
	</form>
</Modal>

<style>
	h1 {
		font-size: 1rem;
		font-weight: 500;
		text-align: center;
		padding-block-end: 2rem;
	}
	.submit {
		display: flex;
		justify-content: end;
	}
	form {
		div {
			display: flex;
			flex-direction: column;
			padding-block: 0.5rem;
		}
	}
	label {
		opacity: 0.6;
		padding-block-end: 0.25rem;
	}
	input,
	select,
	textarea {
		background: var(--b3);
		border: 1px solid var(--line);
		padding: 0.5rem;
	}
	textarea {
		height: 6rem;
	}
</style>
