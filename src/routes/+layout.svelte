<script>
  import '../app.css'
  import Header from '$lib/components/header.svelte'
  import { initSqlite } from '$lib/store/initSqlite'
  import { onMount } from 'svelte'

  onMount(() => {
  	initSqlite()
  });

</script>

<Header />
<slot />
