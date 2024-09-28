# Learning SQLite as I work

## Quirks
[Full page](https://www.sqlite.org/quirks.html)
Most of these are about types. Where they are different from other SQL databases and what to do instead.

### Types are "flexible"
> Thus, if one inserts '1234' into an INTEGER column, that value is converted into an integer 1234 and stored. But, if you insert a non-numeric string like 'wxyz' into an INTEGER column, unlike other SQL databases, SQLite does not throw an error. Instead, SQLite stores the actual string value in the column.

SQLite version 3.37.0 (2021-11-27) introduced the option of [STRICT tables](https://www.sqlite.org/stricttables.html). Where you get errors on mismatched types and an explicit `ANY`

Seeing this, it's not surprising no one one the team or maintining the sqlite-wasm ESM package, even when working on web things, uses typescript. There are also no booleans (use integers) or a DATETIME datatype.
> Instead, dates and times can be stored in any of these ways:
>
> As a TEXT string in the ISO-8601 format. Example: '2018-04-02 12:13:46'.
> As an INTEGER number of seconds since 1970 (also known as "unix time").
> As a REAL value that is the fractional Julian day number.
> The built-in date and time functions of SQLite understand date/times in all of the formats above, and can freely change between them. Which format you use, is entirely up to your application.

A common SQLite table might look like this:
```sql
CREATE TABLE t1(a,b,c,d);
```
I think the best options are either to (1.) full lean into it; test strictly before adding to the database and maybe after. Take advantage of integer coercion and knowing what you put in for a date will not get changed,i.e, can still be read the same way by javascript. Or (2.) use `STRICT` values and check for errors, like so:
```sql
CREATE TABLE t1(
	a INT ,
	b TEXT ,
	c TEXT,
	d ANY
) STRICT;
```
The only valid datatype here are INT, INTEGER, REAL (real numbers), TEXT, BLOB, and ANY. You can get something close to mySQL Enums with:
```sql
CREATE TABLE t1(
	a INT,
	b TEXT,
	phone TEXT INT CHECK(length(phone) < 16),
	live INT CHECK(length(live) < 2)
) STRICT;
```

### Keys
- Add a `NOT NULL` to `PRIMARY KEY`. `STRICT` also does this by default.
- There is a default primary key, `ROWID` in SQLite. Creating an `id INTEGER PRIMARY KEY` is an alias for `rowid` (except in WITHOUT ROWID tables). There is no need to use `AUTOINCREMENT` on the primary key, if you insert a NULL into `INTEGER PRIMARY KEY` SQLite automatically converts the NULL into a unique integer. This could be better than `NOT NULL` with integers as it happens automatically.
- If the [AUTOINCREMENT](https://www.sqlite.org/autoinc.html) keyword appears after INTEGER PRIMARY KEY, that changes the automatic ROWID assignment algorithm to prevent the reuse of ROWIDs over the lifetime of the database. In other words, the purpose of AUTOINCREMENT is to prevent the reuse of ROWIDs from previously deleted rows.

### Other links
- [Making other kinds of table schama changes](https://www.sqlite.org/lang_altertable.html#otheralter)
-
