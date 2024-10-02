<header>
  <div>
    <a href="/">vfdir</a>
  </div>
  <nav>
      <span > Search 	</span>
      <span > About 		</span>
      <a href='/local' > Account 	</a>
  </nav>
</header>

<style>
  header {
    display: flex;
    position: sticky;
    top:0;
    left: 0;
    right: 0;
    padding-block: .25em;
    justify-content: space-between;
    padding-inline: 2em;
		/* grid-row: header-start / header-end; */
		grid-column: full-start / full-end;
		border-bottom: 1px solid var(--line);
		font-size: .9rem;
		font-weight: 600;
		max-width: 100svw;
  }

  nav {
    display: flex;
    gap: 2ch;
  }
</style>
