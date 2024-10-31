# indexing result on rowId

I've tried this twice now on different projects, but it's not going to work. The general idea is that instead of using an array I can track the rowId from the query and then make precise updates to the values in each object that have changed. I wanted to do this because reassigning all values on any kind of update felt extremely inefficient. On a page that could mean all te core data and enything derived from it would need to rerender, often times with the exact same information.

This works in very basic cases. For `select * from users` I can simply check the rowid to see which rows have been affected. Update? get the new row and update values. Delete? No need to even query, just delete that entry from the store. Insert? Get new row then map.set(rowid, row). In most other situations, JOINS, Count(), windows, subqueries the type of update has no direct translation for "what should I do with my data?"

The other reason this doesn't seem worth it is for any more complicated of a query, there'd be no way to do a comparison without first getting new data form the database, and getting new data is likely the most expensive operation all together. For a simple update, without knowing what coulns have been affected trying to diff the values would mean itereating through _each_ Map **and** the keys of the Object within the map, at minimum an O(n^3) operation. 

Earlier I said reassigning arrays will cause your entire app to rerender. That isn't actually true depending on where you are. For examlpe, svelte's derived rune, and I'd assume many other signal implementations already check to see if the change from upstream state will affect the derived value and avoid rerendering if so. That means if I have: 
```svelte
<script>
	let tbl = pool.query('select rowid,* from tbl')
	let derve = $derived(tbl.data.get(2)?.val)
</script>
{derve + ' : ' + Math.random()}
```
Math.random() will only run if the value of `derve` changes. Even if `tbl.data.get(2)` suddenly returns a new object, what matters is that the value is the same.  
