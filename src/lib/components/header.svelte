<header>
  <div>
    <a href="/">vfdir</a>
  </div>
  <nav>
      <span>Search</span>
      <span>About</span>
      <span>Account</span>
  </nav>
</header>

<style>
  header {
    display: flex;
    /* position: sticky; */
    top:0;
    padding-block: .25em;
    justify-content: space-between;
    padding-inline: 2em;
		/* grid-row: header-start / header-end; */
		grid-column: full-start / full-end;
		border-bottom: 1px solid var(--line);
		font-size: .9rem;
		font-weight: 600;
  }

  nav {
    display: flex;
    gap: 2ch;
  }
</style>
