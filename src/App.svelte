<script lang="ts">
  import {ArenaClient } from 'arena-ts'

  const client = new ArenaClient({
  //   fetch: ("https://api.are.na/v2/",)
  })

  // let Channels = [];
  // client.channels().then((val)=>{
  //     // Channels = val
  //     console.log(val)
  //   })
  
  let Channels = []
  fetch("https://api.are.na/v2/users/408713/channels?per=50", {
    headers: {
      "Content-Type": "application/json",
    },
    method: "GET",
  })
    .then(async (res) => {
       const r = await res.json()
      console.log(r)
      Channels = r.channels
    })
</script>

<main>
  {#if Channels }
    <div class="channels">
    {#each Channels as channels}
      <div>
        <p>
        {channels.title} | {channels.slug}
        </p>
        <p>
          {channels.status} {channels.length}
        </p>
      </div>
    {/each}
    </div>
  {/if}
</main>

<style>
  .channels {
    display: grid;
    
  }
</style>
