<script lang="ts">
  export let content;
</script>

<div class="grid">
  {#each content as {status, slug, title}}
    <div class="item {status}">
      <a href={slug}>
        <div>
          <p>
            {title}
          </p>
        </div>
      </a>
    </div>
  {/each}
</div>

<style>
  .grid {
    --size: 260px;
    display: grid;
    justify-content: center;
    gap: 1em;
    grid-template-columns: repeat(auto-fill, minmax(var(--size), 1fr));
    box-sizing: border-box;
    padding: 1em;
    
    & .item {
      box-sizing: border-box;
      padding: .25em;
      height: var(--size);

      & > a {
        display: block;
        width: 100%;
        height: 100%;
      }
    }
  }
  div {
    display: block;
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
