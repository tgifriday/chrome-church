     (c) 2012 Stepan Riha
     websql.js may be freely distributed under the MIT license.

Module that wraps asynchronous WebSQL calls with deferred promises and provides SQL utility
methods.

Promises are **resolved** when asynchronous database callback is finished.

Promises are **rejected** with an `Error` object that may contain one or more of the following:

* `message`: Describing what failed
* `exception`: Exception that was thrown
* `sqlError`: Error returned by WebSQL
* `sql`: statement that was executing

## Getting Started

Websql can be loaded as

* a `<script>` tag (creating a `websql` global)
* an AMD module

Websql can produce deferred promises using

* [`when.js`](https://github.com/cujojs/when)
* [`Q.js`](https://github.com/kriskowal/q)
* [`jQuery's Deferred`](http://api.jquery.com/category/deferred-object/)
* Other...

### To use in `<script>` tag

The module will autodetect and use one of the supported promise providers
if it's included in your HTML before `websql`:

         <script src="path/to/when.js"></script>
         <script src="path/to/websql.js"></script>
         ...

### To use as an AMD module

If a promise provider isn't loaded into the global scope, you need to use
the `websql.config()` method to tell it which provider to use.

         // Using a CommonJS Promisses/A implementation:
         define(["websql", "when"], function(websql, when) {
             websql.config({
                 defer: when.defer
             });
             ...
         })

         // Using jQuery Deferred implementation:
         define(["websql", "jquery"], function(websql, $) {
             websql.config({
                 defer: $.Deferred
             });
             ...
         })


## Using the API

Example:

     var wsdb = websql("test");
     wsdb.read("SELECT * FROM ...");
         .then(function(resultSet) { ... });

## Public Methods ##

### websql() or websql(Database) or websql(name, _version_, _displayName_, _estimatedSize_)

Constructor for `WebsqlDatabase` wrapper objects.

* `websql()` creates an uninitialized instance.  Use the `openDatabase` method to initialize it.
* `websql(Database)` creates an instance from an native Database opened via `window.openDatabase(...)`
* `websql(name, ...)` takes the same parameters as the `window.openDatabase` function, but supplies
default values for unspecified parameters.

Returns: new instance of `WebsqlDatabase` wrapper class.

Usage:

     var wsdb = websql("test", "Test Database", 2 * 1024 * 1024);
     wsdb.execute("INSERT INTO ...")
         .then(function(resultSet) { ... })

More usage:

     var wsdb = websql("test");
     wsdb.execute("INSERT INTO ...")
         .then(function(resultSet) { ... })

     var database = window.openDatabase(...);
     var wsdb = websql(database);

### openDatabase(name, _version_, _displayName_, _estimatedSize_) ###

Calls window.openDatabase().

 * version defaults to `""`
 * displayName defaults to `name`
 * estimatedSize defaults to `2 * 1024 * 1024`

Returns: promise that resolves with this `WebsqlDatabase` instance

Usage:

     wsdb.openDatabase("test", "Test Database", 2 * 1024 * 1024))
         .then(function(wsdb) {...});

More usage:

     wsdb.openDatabase("test"))
         .then(function(wsdb) {...});

### changeVersion(oldVersion, newVersion, xactCallback) ###

Calls changeVersion(oldVersion, newVersion, xactCallback).

Returns: promise that resolves with the changed `WebsqlDatabase`

Usage:

     wsdb.changeVersion("1", "2",
             function (xact) {
                 xact.executeSQL(...);
             }
     ).then(function(wsdb) {...});

### getTables() ###

Queries the sqlite_master table for user tables

Returns: promise that resolves with an array of table information records

Usage:

     wsdb.getTables()
         .then(function(tables) {
         for(var i = 0; i < tables.length; i++) {
             var name = tables[i].name;
             var sql = tables[i].sql;
             ...
         }
     });

### tableExists(name) ###

Queries the sqlite_master for a table by name

Returns: promise that resolves with table info or rejects if table
does not exist.

Usage:

     wsdb.tableExists("person")
         .then(function (table) {
             alert("table exists");
         }, function(err) {
             alert("does not exist");
         }
     });

### destroyDatabase() ###

Drops all the tables in the database.

Returns: promise that resolves with this `WebsqlDatabase`

Usage:

     wsdb.destroyDatabase()
         .then(function (wsdb) {...});

### transaction(xactCallback) ###

Calls xactCallback(xact) from within a database transaction

Returns: promise that resolves with the database

Usage:

     wsdb.transaction(
             function (xact) {
                 xact.executeSQL(...);
             }
     ).then(function (wsdb) {...});

More usage:

     var addressId;
     var personId;

     function insertPerson(xact) {
         return xact.executeSql(
             "INSERT INTO person ...", [...],
             function (xact, rs) {
                 personId = rs.insertId;
                 insertAddress(xact, personId);
             }
         )
     }

     function insertAddress(xact, personId) {
         return wsdb.executeSql(xact,
             "INSERT INTO address (person, ...) VALUES (?, ...)",
             [personId, ...],
             function (xact, rs) {
                 addressId = rs.insertId;
             }
         )
     }

     wsdb.transaction(
             function (xact) {
                 insertPerson(xact);
             }
     ).then(function(wsdb) {
         alert("Created person " + personId +
                 " with address " + addressId);
     });

### readTransaction(xactCallback) ###

Calls xactCallback(xact) from within a database read transaction

Returns: promise that resolves with the database

Usage:

     wsdb.readTransaction(
             function (xact) {
                 xact.executeSQL(...);
             }
     ).then(function (wsdb) {...});

### execute(sqlStatement(s), _args(s)_, _rsCallback_) ###

Method for executing a transaction with a one or more `sqlStatement`
with the specified `args`, calling the `rsCallback` with the result set(s).

The `args` and `rsCallback` are optional.

* Passing a _single_ `sqlStatement` string with `args` that is an _array of arrays_,
the statement is executed with each row in the `args`.
* Passing an array of `{ sql, args}` objects to `sqlStatement`
executes the `sql` in each row with the row's `args` (or the parameter `args`).

Returns: promise that resolves with `rsCallback` result
or the resultSet, if no `rsCallback` specified.  If an array of statements or arguments
is specified, the promise resolves with an array of results/resultSets.

Basic Usage:

     wsdb.execute("DELETE FROM person")
         .then(function (resultSet) {...});

Other Usage:

     wsdb.execute(
                 "INSERT INTO person (first, last) VALUES (?, ?)",
                 ["John", "Doe"],
                 function (rs) {
                     console.log("Inserted person", rs.insertId);
                     return rs.insertId;
                 }
     ).then(function (result) {...});

Other Usage: (single `sqlStatement` with multiple sets of `args`)

     wsdb.execute(
                 "INSERT INTO person (first, last) VALUES (?, ?)",
                 [
                     ["John", "Doe"],
                     ["Jane", "Doe"]
                 ],
                 // called for each row in args
                 function (rs) {
                     console.log("Inserted person", rs.insertId);
                     return rs.insertId;
                 }
     ).then(function (insertIds) {
         var personId1 = insertIds[0], personId2 = insertIds[1];
         ...
     });

Other Usage: (multiple `sqlStatement` with multiple sets of `args`)

     wsdb.execute(
                 [{
                     sql: "UPDATE person SET (first=?, last=?) WHERE id=?",
                     args: ["Robert", "Smith", 23]
                 }, {
                     sql: "UPDATE address SET (street=?, city=?, zip=?) WHERE id=?",
                     args: ["Sesame St.", "Austin", "78758", 45]

                 }],
                 // called for each object in args
                 function (rs) {
                     console.log("Updated object: ", rs.rowsAffected);
                     return rs.rowsAffected;
                 }
     ).then(function (results) {
         var numPersons = results[0], numAddresses = results[1];
         ...
     });

### read(sqlStatement(s), _args(s)_, _rsCallback_) ###

Method for executing a readTransaction with a one or more `sqlStatement`
with the specified `args`, calling the `rsCallback` with the result set(s).

The `args` and `rsCallback` are optional.

* Passing a _single_ `sqlStatement` string with `args` that is an _array of arrays_,
the statement is executed with each row in the `args`.
* Passing an array of `{ sql, args}` objects to `sqlStatement`
executes the `sql` in each row with the row's `args` (or the parameter `args`).

Returns: promise that resolves with `rsCallback` result
or the resultSet, if no `rsCallback` specified.  If an array of statements or arguments
is specified, the promise resolves with an array of results/resultSets.

Usage:

     wsdb.read("SELECT * FROM person WHERE first = ?",
                 ["Bob"],
                 function (rs) {
                     var rows = rs.rows;
                     for(var i = 0; i < rows.length; i++) {
                         ...
                     }
                     return result;
                 }
     ).then(function (result) {...});

Other usage:

     wsdb.read("SELECT * FROM person WHERE first = ?",
                 ["Bob"]
     ).then(function (resultSet) {...});

Other Usage: (single `sqlStatement` with multiple sets of `args`)

     wsdb.read("SELECT * FROM person WHERE first = ?",
                 [
                     ["Bob"],
                     ["John"]
                 ],
                 // called for each row in args
                 function (rs) {
                     return rs.rows;
                 }
     ).then(function (results) {
         var bobRows = results[0], johnRows = results[1];
         ...
     });

Other Usage: (multiple `sqlStatement` with multiple sets of `args`)

     wsdb.read([{
                     sql: "SELECT * FROM person WHERE id=?",
                     args: [23]
                 }, {
                     sql: "SELECT * FROM address WHERE state in (?, ?, ?)",
                     args: ["CA", "FL", "TX"]

                 }],
                 // called for each object in args
                 function (rs) {
                     return rs.rows;
                 }
     ).then(function (results) {
         var person23rows = results[0], addressRows = results[1];
         ...
     });

### readRow(sqlStatement, _args_, _rowCallback_, _defaultRow_) ###

Method for executing a readTransaction with a single `sqlStatement`
that's expected to return a single row.
The specified `rowCallback` is called with the row in the resultset
or with `undefined` if resolutSet contains no rows.
If the query does not return a row, the `_defaultRow_` is returned instead.

The `args`, `rowCallback` and `defaultRow` are optional.

Returns: promise that resolves with the `rowCallback` result
or the row, if no `rowCallback` specified.
If no rows are selected and `rowCallback` isn't specified, the promise
resolves with the `defaultRow`.
The promise is rejected if the query returns multiple rows or if it returns
zero rows and no `rowCallback` and `defaultRow` were specified.

Usage:

     wsdb.readRow(
                 "SELECT * FROM person WHERE id = ?",
                 [123],
                 function (row) {
                     if(!row) {
                         // person not found
                         return;
                     }
                     var login = row.login;
                     ...
                     return result;
                 }
     ).then(function (result) {...});

Other Usage:

     wsdb.readRow(
                 "SELECT * FROM person WHERE id = ?",
                 [123]
     ).then(function (row) {...});

### websql.config(settings) ###

Sets `websql` configuration:

* `defer`: specifies the function that constructs a deferred object.
Default is window.when, window.Q or window.jQuery.Deferred, if present.
* `trace`: specifies the object used for logging messages. Default is `window.console`.
* `logVerbosity`: specifies verbosity of logging (NONDE, ERROR or DEBUG). Default is `websql.log.NONE`.

### websql.log ###

Predefined `logVerbosity` levels:

* `websql.log.NONE`: No logging.
* `websql.log.ERROR`: Log errors.
* `websql.log.DEBUG`: Verbose logging.

