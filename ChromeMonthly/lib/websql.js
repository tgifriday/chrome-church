/*! websql.js | MIT license | http://bitbucket.org/nonplus/websql-js */

(function () {}());

/*jslint undef: true, white: true, browser: true, devel: true, indent: 4, sloppy: false */
/*global alert: false, define: true*/

//      (c) 2012 Stepan Riha
//      websql.js may be freely distributed under the MIT license.
//
// Module that wraps asynchronous WebSQL calls with deferred promises and provides SQL utility
// methods.
//
// Promises are **resolved** when asynchronous database callback is finished.
//
// Promises are **rejected** with an `Error` object that may contain one or more of the following:
//
// * `message`: Describing what failed
// * `exception`: Exception that was thrown
// * `sqlError`: Error returned by WebSQL
// * `sql`: statement that was executing
//
// ## Getting Started
//
// Websql can be loaded as
//
// * a `<script>` tag (creating a `websql` global)
// * an AMD module
//
// Websql can produce deferred promises using
//
// * [`when.js`](https://github.com/cujojs/when)
// * [`Q.js`](https://github.com/kriskowal/q)
// * [`jQuery's Deferred`](http://api.jquery.com/category/deferred-object/)
// * Other...
//
// ### To use in `<script>` tag
//
// The module will autodetect and use one of the supported promise providers
// if it's included in your HTML before `websql`:
//
//          <script src="path/to/when.js"></script>
//          <script src="path/to/websql.js"></script>
//          ...
//
// ### To use as an AMD module
//
// If a promise provider isn't loaded into the global scope, you need to use
// the `websql.config()` method to tell it which provider to use.
//
//          // Using a CommonJS Promisses/A implementation:
//          define(["websql", "when"], function(websql, when) {
//              websql.config({
//                  defer: when.defer
//              });
//              ...
//          })
//
//          // Using jQuery Deferred implementation:
//          define(["websql", "jquery"], function(websql, $) {
//              websql.config({
//                  defer: $.Deferred
//              });
//              ...
//          })
//
//
// ## Using the API
//
// Example:
//
//      var wsdb = websql("test");
//      wsdb.read("SELECT * FROM ...");
//          .then(function(resultSet) { ... });
//

(function (root, factory) {
    "use strict";
    if (typeof define === 'function' && define.amd) {
        // When used as AMD, register as an anonymous module.
        define(factory);
    } else {
        // Otherwise create browser global `websql`
        root.websql = factory();
    }
} (this, function () {
    "use strict";
    var NONE = 0;
    var ERROR = 1;
    var DEBUG = 2;

    var verbosity = NONE;
    var trace = console;

    // ## Public Methods ##
    //
    // ### websql() or websql(Database) or websql(name, _version_, _displayName_, _estimatedSize_)
    //
    // Constructor for `WebsqlDatabase` wrapper objects.
    //
    // * `websql()` creates an uninitialized instance.  Use the `openDatabase` method to initialize it.
    // * `websql(Database)` creates an instance from an native Database opened via `window.openDatabase(...)`
    // * `websql(name, ...)` takes the same parameters as the `window.openDatabase` function, but supplies
    // default values for unspecified parameters.
    //
    // Returns: new instance of `WebsqlDatabase` wrapper class.
    //
    // Usage:
    //
    //      var wsdb = websql("test", "Test Database", 2 * 1024 * 1024);
    //      wsdb.execute("INSERT INTO ...")
    //          .then(function(resultSet) { ... })
    //
    // More usage:
    //
    //      var wsdb = websql("test");
    //      wsdb.execute("INSERT INTO ...")
    //          .then(function(resultSet) { ... })
    //
    //      var database = window.openDatabase(...);
    //      var wsdb = websql(database);
    //
    function WebsqlDatabase(name, _version_, _displayName_, _estimatedSize_) {
        
        var db;
        var self = this;

        // ### openDatabase(name, _version_, _displayName_, _estimatedSize_) ###
        //
        // Calls window.openDatabase().
        //
        //  * version defaults to `""`
        //  * displayName defaults to `name`
        //  * estimatedSize defaults to `2 * 1024 * 1024`
        //
        // Returns: promise that resolves with this `WebsqlDatabase` instance
        //
        // Usage:
        //
        //      wsdb.openDatabase("test", "Test Database", 2 * 1024 * 1024))
        //          .then(function(wsdb) {...});
        //
        // More usage:
        //
        //      wsdb.openDatabase("test"))
        //          .then(function(wsdb) {...});
        //
        function openDatabase(name, version, displayName, estimatedSize) {
            log(DEBUG, "openDatabase", name, version, displayName, estimatedSize);

            if (!displayName) { displayName = name; }
            if (!version) { version = ""; }
            if (!estimatedSize) { estimatedSize = 2 * 1024 * 1024; }

            var dfd = defer();
            try {
                if (!window.openDatabase) {
                    log(ERROR, "WebSQL not implemented");
                    _rejectError(dfd, "WebSQL not implemented");
                } else {
                    exports.db = db = window.openDatabase(name, version, displayName, estimatedSize);
                    if (db) {
                        dfd.resolve(self);
                    } else {
                        _rejectError(dfd, "Failed to open database");
                    }
                }
            } catch (ex) {
                log(ERROR, "Failed to open database " + name);
                _rejectError(dfd, "Failed to open database " + name, { exception: ex });
            }
            exports.promise = promise(dfd);
            return exports.promise;
        }

        // ### changeVersion(oldVersion, newVersion, xactCallback) ###
        //
        // Calls changeVersion(oldVersion, newVersion, xactCallback).
        //
        // Returns: promise that resolves with the changed `WebsqlDatabase`
        //
        // Usage:
        //
        //      wsdb.changeVersion("1", "2",
        //              function (xact) {
        //                  xact.executeSQL(...);
        //              }
        //      ).then(function(wsdb) {...});
        //
        function changeVersion(oldVersion, newVersion, xactCallback) {
            log(DEBUG, "openDatabase", db, oldVersion, newVersion, xactCallback);

            var dfd = defer();
            try {
                if (!_isDatabase(db)) {
                    _rejectError(dfd, "Database not specified (db='" + db + "')");
                } else {
                    db.changeVersion(oldVersion, newVersion, xactCallback,
                        function (sqlError) {
                            log(ERROR, sqlError);
                            _rejectError(dfd, "Failed to change version", { sqlError: sqlError });
                        },
                        function () {
                            log(DEBUG, "SUCCESS changeVersion");
                            dfd.resolve(this);
                        }
                    );
                }
            } catch (ex) {
                log(ERROR, ex);
                _rejectError(dfd, "Failed changeVersion(db, '" + oldVersion + "', '" + newVersion + "'')", { exception: ex });
            }
            return promise(dfd);
        }

        // ### getTables() ###
        //
        // Queries the sqlite_master table for user tables
        //
        // Returns: promise that resolves with an array of table information records
        //
        // Usage:
        //
        //      wsdb.getTables()
        //          .then(function(tables) {
        //          for(var i = 0; i < tables.length; i++) {
        //              var name = tables[i].name;
        //              var sql = tables[i].sql;
        //              ...
        //          }
        //      });
        //
        function getTables() {

            var sql = "SELECT name, type, sql FROM sqlite_master " +
                        "WHERE type in ('table') AND name NOT LIKE '?_?_%' ESCAPE '?'";

            return read(sql, function (rs) {
                var tables = [];
                var rows = rs.rows;
                var i;
                for (i = 0; i < rows.length; i++) {
                    tables.push(rows.item(i));
                }
                return tables;
            });
        }

        // ### tableExists(name) ###
        //
        // Queries the sqlite_master for a table by name
        //
        // Returns: promise that resolves with table info or with `undefined` if table
        // does not exist.
        //
        // Usage:
        //
        //      wsdb.tableExists("person")
        //          .then(function (table) {
        //              if(table) {
        //                  alert("table exists");
        //              } else {
        //                  alert("does not exist");
        //              }
        //          });
        //
        function tableExists(name) {

            var sql = "SELECT * FROM sqlite_master " +
                        "WHERE name = ?";

            return readRow(sql, [name], function (row) {
                return row || undefined;
            });
        }

        // ### destroyDatabase() ###
        //
        // Drops all the tables in the database.
        //
        // Returns: promise that resolves with this `WebsqlDatabase`
        //
        // Usage:
        //
        //      wsdb.destroyDatabase()
        //          .then(function (wsdb) {...});
        //
        function destroyDatabase() {
            return changeVersion(db.version, "", function (xact) {
                var sql = "SELECT name FROM sqlite_master " +
                            "WHERE type in ('table') AND name NOT LIKE '?_?_%' ESCAPE '?'";
                xact.executeSql(sql, [], function (xact, rs) {
                    var rows = rs.rows;
                    var i;
                    for (i = 0; i < rows.length; i++) {
                        var sql = 'DROP TABLE "' + rows.item(i).name + '"';
                        xact.executeSql(sql);
                    }
                });
            });
        }

        // ### transaction(xactCallback) ###
        //
        // Calls xactCallback(xact) from within a database transaction
        //
        // Returns: promise that resolves with the database
        //
        // Usage:
        //
        //      wsdb.transaction(
        //              function (xact) {
        //                  xact.executeSQL(...);
        //              }
        //      ).then(function (wsdb) {...});
        //
        // More usage:
        //
        //      var addressId;
        //      var personId;
        //
        //      function insertPerson(xact) {
        //          return xact.executeSql(
        //              "INSERT INTO person ...", [...],
        //              function (xact, rs) {
        //                  personId = rs.insertId;
        //                  insertAddress(xact, personId);
        //              }
        //          )
        //      }
        //
        //      function insertAddress(xact, personId) {
        //          return wsdb.executeSql(xact,
        //              "INSERT INTO address (person, ...) VALUES (?, ...)",
        //              [personId, ...],
        //              function (xact, rs) {
        //                  addressId = rs.insertId;
        //              }
        //          )
        //      }
        //
        //      wsdb.transaction(
        //              function (xact) {
        //                  insertPerson(xact);
        //              }
        //      ).then(function(wsdb) {
        //          alert("Created person " + personId +
        //                  " with address " + addressId);
        //      });
        //
        function transaction(xactCallback) {
            return executeTransaction("transaction", xactCallback);
        }

        // ### readTransaction(xactCallback) ###
        //
        // Calls xactCallback(xact) from within a database read transaction
        //
        // Returns: promise that resolves with the database
        //
        // Usage:
        //
        //      wsdb.readTransaction(
        //              function (xact) {
        //                  xact.executeSQL(...);
        //              }
        //      ).then(function (wsdb) {...});
        //
        function readTransaction(xactCallback) {
            return executeTransaction("readTransaction", xactCallback);
        }

        // ### execute(sqlStatement(s), _args(s)_, _rsCallback_) ###
        //
        // Method for executing a transaction with a one or more `sqlStatement`
        // with the specified `args`, calling the `rsCallback` with the result set(s).
        //
        // The `args` and `rsCallback` are optional.
        //
        // * Passing a _single_ `sqlStatement` string with `args` that is an _array of arrays_,
        // the statement is executed with each row in the `args`.
        // * Passing an array of `{ sql, args}` objects to `sqlStatement`
        // executes the `sql` in each row with the row's `args` (or the parameter `args`).
        //
        // Returns: promise that resolves with `rsCallback` result
        // or the resultSet, if no `rsCallback` specified.  If an array of statements or arguments
        // is specified, the promise resolves with an array of results/resultSets.
        //
        // Basic Usage:
        //
        //      wsdb.execute("DELETE FROM person")
        //          .then(function (resultSet) {...});
        //
        // Other Usage:
        //
        //      wsdb.execute(
        //                  "INSERT INTO person (first, last) VALUES (?, ?)",
        //                  ["John", "Doe"],
        //                  function (rs) {
        //                      console.log("Inserted person", rs.insertId);
        //                      return rs.insertId;
        //                  }
        //      ).then(function (result) {...});
        //
        // Other Usage: (single `sqlStatement` with multiple sets of `args`)
        //
        //      wsdb.execute(
        //                  "INSERT INTO person (first, last) VALUES (?, ?)",
        //                  [
        //                      ["John", "Doe"],
        //                      ["Jane", "Doe"]
        //                  ],
        //                  // called for each row in args
        //                  function (rs) {
        //                      console.log("Inserted person", rs.insertId);
        //                      return rs.insertId;
        //                  }
        //      ).then(function (insertIds) {
        //          var personId1 = insertIds[0], personId2 = insertIds[1];
        //          ...
        //      });
        //
        // Other Usage: (multiple `sqlStatement` with multiple sets of `args`)
        //
        //      wsdb.execute(
        //                  [{
        //                      sql: "UPDATE person SET (first=?, last=?) WHERE id=?",
        //                      args: ["Robert", "Smith", 23]
        //                  }, {
        //                      sql: "UPDATE address SET (street=?, city=?, zip=?) WHERE id=?",
        //                      args: ["Sesame St.", "Austin", "78758", 45]
        //
        //                  }],
        //                  // called for each object in args
        //                  function (rs) {
        //                      console.log("Updated object: ", rs.rowsAffected);
        //                      return rs.rowsAffected;
        //                  }
        //      ).then(function (results) {
        //          var numPersons = results[0], numAddresses = results[1];
        //          ...
        //      });
        //
        function execute(sqlStatement, args, rsCallback) {
            return execSqlStatements(transaction, sqlStatement, args, rsCallback);
        }

        // ### read(sqlStatement(s), _args(s)_, _rsCallback_) ###
        //
        // Method for executing a readTransaction with a one or more `sqlStatement`
        // with the specified `args`, calling the `rsCallback` with the result set(s).
        //
        // The `args` and `rsCallback` are optional.
        //
        // * Passing a _single_ `sqlStatement` string with `args` that is an _array of arrays_,
        // the statement is executed with each row in the `args`.
        // * Passing an array of `{ sql, args}` objects to `sqlStatement`
        // executes the `sql` in each row with the row's `args` (or the parameter `args`).
        //
        // Returns: promise that resolves with `rsCallback` result
        // or the resultSet, if no `rsCallback` specified.  If an array of statements or arguments
        // is specified, the promise resolves with an array of results/resultSets.
        //
        // Usage:
        //
        //      wsdb.read("SELECT * FROM person WHERE first = ?",
        //                  ["Bob"],
        //                  function (rs) {
        //                      var rows = rs.rows;
        //                      for(var i = 0; i < rows.length; i++) {
        //                          ...
        //                      }
        //                      return result;
        //                  }
        //      ).then(function (result) {...});
        //
        // Other usage:
        //
        //      wsdb.read("SELECT * FROM person WHERE first = ?",
        //                  ["Bob"]
        //      ).then(function (resultSet) {...});
        //
        // Other Usage: (single `sqlStatement` with multiple sets of `args`)
        //
        //      wsdb.read("SELECT * FROM person WHERE first = ?",
        //                  [
        //                      ["Bob"],
        //                      ["John"]
        //                  ],
        //                  // called for each row in args
        //                  function (rs) {
        //                      return rs.rows;
        //                  }
        //      ).then(function (results) {
        //          var bobRows = results[0], johnRows = results[1];
        //          ...
        //      });
        //
        // Other Usage: (multiple `sqlStatement` with multiple sets of `args`)
        //
        //      wsdb.read([{
        //                      sql: "SELECT * FROM person WHERE id=?",
        //                      args: [23]
        //                  }, {
        //                      sql: "SELECT * FROM address WHERE state in (?, ?, ?)",
        //                      args: ["CA", "FL", "TX"]
        //
        //                  }],
        //                  // called for each object in args
        //                  function (rs) {
        //                      return rs.rows;
        //                  }
        //      ).then(function (results) {
        //          var person23rows = results[0], addressRows = results[1];
        //          ...
        //      });
        //
        function read(sqlStatement, args, rsCallback) {
            return execSqlStatements(readTransaction, sqlStatement, args, rsCallback);
        }

        // ### readRow(sqlStatement, _args_, _rowCallback_, _defaultRow_) ###
        //
        // Method for executing a readTransaction with a single `sqlStatement`
        // that's expected to return a single row.
        // The specified `rowCallback` is called with the row in the resultset
        // or with `undefined` if resolutSet contains no rows.
        // If the query does not return a row, the `_defaultRow_` is returned instead.
        //
        // The `args`, `rowCallback` and `defaultRow` are optional.
        //
        // Returns: promise that resolves with the `rowCallback` result
        // or the row, if no `rowCallback` specified.
        // If no rows are selected and `rowCallback` isn't specified, the promise
        // resolves with the `defaultRow`.
        // The promise is rejected if the query returns multiple rows or if it returns
        // zero rows and no `rowCallback` and `defaultRow` were specified.
        //
        // Usage:
        //
        //      wsdb.readRow(
        //                  "SELECT * FROM person WHERE id = ?",
        //                  [123],
        //                  function (row) {
        //                      if(!row) {
        //                          // person not found
        //                          return;
        //                      }
        //                      var login = row.login;
        //                      ...
        //                      return result;
        //                  }
        //      ).then(function (result) {...});
        //
        // Other Usage:
        //
        //      wsdb.readRow(
        //                  "SELECT * FROM person WHERE id = ?",
        //                  [123]
        //      ).then(function (row) {...});
        //
        function readRow(sqlStatement) {
            var args, rowCallback, defaultValue;
            var idx = 1;
            if (arguments[idx] instanceof Array) {
                args = arguments[idx++];
            }
            if (arguments[idx] instanceof Function) {
                rowCallback = arguments[idx++];
            }
            if (arguments[idx] instanceof Object) {
                defaultValue = arguments[idx++];
            }

            return pipe(read(sqlStatement, args),
                    function (rs) {
                        var row;
                        if (rs.rows.length > 1) {
                            return _rejectError(defer(), new Error("Query returned " + rs.rows.length + " rows"));
                        }
                        if (rs.rows.length === 0) {
                            if (defaultValue) {
                                row = defaultValue;
                            } else if (rowCallback) {
                                row = rowCallback();
                            } else {
                                return _rejectError(defer(), new Error("Query returned 0 rows"));
                            }
                        } else {
                            row = rs.rows.item(0);
                            if (rowCallback) {
                                row = rowCallback(row);
                            }
                        }
                        return row;
                    });
        }

        // #### executeTransaction(xactType, xactCallback)
        //
        // Call `xactType` method on `db`
        //
        // Implements common behavior for `wsdb.transaction` and `wsdb.readTransaction`
        //
        function executeTransaction(xactType, xactCallback) {
            var dfd = defer();
            log(DEBUG, xactType + ": in");

            try {
                if (!_isDatabase(db)) {
                    _rejectError(dfd, "Database not specified (db='" + db + "')");
                } else {
                    db[xactType](function (xact) {
                        try {
                            xactCallback(xact);
                        } catch (exception) {
                            log(ERROR, xactType + ": exception " + exception.message);
                            _rejectError(dfd, xactType + " callback threw an exception", { exception: exception });
                            log(DEBUG, xactType + ": rejected");
                        }
                    },
                        function (sqlError) {
                            log(ERROR, xactType + ": error " + sqlError);
                            _rejectError(dfd, "Failed executing " + xactType.replace(/transaction/i, "") + " transaction", { sqlError: sqlError });
                            log(DEBUG, xactType + ": rejected");
                        },
                        function () {
                            log(DEBUG, xactType + ": resolving");
                            dfd.resolve(this);
                            log(DEBUG, xactType + ": resolved");
                        }
                    );
                }
            } catch (exception) {
                log(ERROR, xactType + ": exception " + exception);
                _rejectError(dfd, "Failed calling " + xactType, { exception: exception });
                log(DEBUG, xactType + ": rejected");
            }
            log(DEBUG, xactType + ": out");
            return promise(dfd);
        }

        // #### execSqlStatements(xactMethod, sqlStatement, args, rsCallback)
        //
        // Execute sqlStatement in the context of `xactMethod`
        //
        // Implements common behavior for `wsdb.execute` and `wsdb.read`
        //
        function execSqlStatements(xactMethod, sqlStatement, args, rsCallback) {
            var results = [];
            if (typeof (args) === "function") {
                rsCallback = args;
                args = undefined;
            }

            function execCommand(xact, sql, args) {
                xact.executeSql(sql, args || [], function (xact, rs) {
                    results.push(rsCallback ? rsCallback(rs) : rs);
                });
            }

            var isArray;

            return pipe(xactMethod(function (xact) {
                var i;
                if (_isArray(sqlStatement)) {
                    isArray = true;
                    for (i = 0; i < sqlStatement.length; i++) {
                        var cmnd = sqlStatement[i];
                        var params = _isUndefined(cmnd.args) ? args : cmnd.args;
                        execCommand(xact, cmnd.sql, params);
                    }
                } else {
                    isArray = _isArray(args) && _isArray(args[0]);
                    var argSets = isArray ? args : [args];
                    for (i = 0; i < argSets.length; i++) {
                        execCommand(xact, sqlStatement, argSets[i]);
                    }
                }
            }), function () {
                return isArray ? results : results[0];
            }, function (err) {
                err.sql = sqlStatement;
                return err;
            });
        }

        var exports = {
            openDatabase: openDatabase,

            changeVersion: changeVersion,
            getTables: getTables,
            tableExists: tableExists,
            destroyDatabase: destroyDatabase,

            transaction: transaction,
            readTransaction: readTransaction,

            execute: execute,
            read: read,
            readRow: readRow
        };

        // Initialize db from native Database or by opening `name`
        if (_isDatabase(name)) {
            exports.db = db = name;
            var dfd = defer();
            exports.promise = promise(dfd);
            dfd.resolve(this);
        } else if (name) {
            openDatabase(name, _version_, _displayName_, _estimatedSize_);
        }

        return exports;
    }

    // Internal Functions
    // ------------------

    // #### defer()
    //
    // Create a deferred object
    //
    var defer = function () {
        throw new Error("wbesql.defer not configured");
    };

    // #### promise(deferred)
    //
    // Returns the promise from a deferred object
    //
    var promise = function (dfd) {
        return _isFunction(dfd.pipe) ? dfd.promise() : dfd.promise;
    };

    // #### pipe(promise, onSuccess, onError)
    //
    // Calls `onSuccess` or `onError` when `promise` is resolved.
    //
    // Returns a new promise that is resolved/rejected based on the
    // values returned from the callbacks.
    //
    var pipe = function (p, onSuccess, onError) {
        var dfd = defer();
        p.then(function (val) {
            if (onSuccess) {
                val = onSuccess(val);
            }
            if (_isPromise(val)) {
                val.then(dfd.resolve, dfd.reject);
            } else {
                dfd.resolve(val);
            }

        }, function (err) {
            if (onError) {
                err = onError(err);
            }
            if (_isPromise(err)) {
                err.then(dfd.resolve, dfd.reject);
            } else {
                dfd.reject(err);
            }
        });
        return promise(dfd);
    };

    // #### log(level, msg1, msg2, ...)
    //
    // Log statement unless level > verbosity
    //
    // Usage:
    //
    //      log(DEBUG, "Calling function", functionName);
    //      log(ERROR, "Something horrible happened:", error);
    //
    function log(level) {
        if (level <= verbosity && trace) {
            var args = Array.prototype.slice.call(arguments, 1);
            args.unshift("WebSQL:");
            if (_isFunction(trace.text)) {
                trace.text(args, "color: purple");
            } else if (_isFunction(trace.log)) {
                trace.log(args.join(' '));
            }
        }
    }

    function setConsole(console) {
        trace = console;
    }

    function _rejectError(dfd, error, options) {
        if (_isString(error)) {
            error = new Error(error);
        }

        if (options && options.exception) {
            error.exception = options.exception;
        }
        
        if (options && options.sqlError) {
            error.sqlError = options.sqlError;
        }

        log(ERROR, "ERROR: " + error.message || error.exception || error.sqlError);
        dfd.reject(error);
        return promise(dfd);
    }

    function _toString(obj) {
        return Object.prototype.toString.call(obj);
    }

    function _isString(fn) {
        return _toString(fn) === '[object String]';
    }

    function _isDatabase(db) {
        return _toString(db) === '[object Database]';
    }

    function _isFunction(fn) {
        return _toString(fn) === '[object Function]';
    }

    function _isUndefined(obj) {
        return typeof(obj) === 'void';
    }

    function _isPromise(obj) {
        return obj && _isFunction(obj.then);
    }

    var _isArray;

    _isArray = Array.isArray || function (obj) {
        return _toString(obj) === '[object Array]';
    };

    // ### ctor function()
    //
    function websql(name, version, displayName, estimatedSize) {
        return new WebsqlDatabase(name, version, displayName, estimatedSize);
    }

    // ### websql.config(settings) ###
    //
    // Sets `websql` configuration:
    //
    // * `defer`: specifies the function that constructs a deferred object.
    // Default is window.when, window.Q or window.jQuery.Deferred, if present.
    // * `trace`: specifies the object used for logging messages. Default is `window.console`.
    // * `logVerbosity`: specifies verbosity of logging (NONDE, ERROR or DEBUG). Default is `websql.log.NONE`.
    //
    websql.config = function (settings) {
        if (_isFunction(settings.defer)) {
            defer = settings.defer;
        }
        if (_isFunction(settings.trace)) {
            trace = settings.trace;
        }
        if (!_isUndefined(settings.logVerbosity)) {
            verbosity = settings.logVerbosity;
        }
    };

    // ### websql.log ###
    //
    // Predefined `logVerbosity` levels:
    //
    // * `websql.log.NONE`: No logging.
    // * `websql.log.ERROR`: Log errors.
    // * `websql.log.DEBUG`: Verbose logging.
    //
    websql.log = {
        NONE: NONE,
        ERROR: ERROR,
        DEBUG: DEBUG
    };

    // Try to initialize defer() function based on window globals
    if (window.when && _isFunction(window.when.defer)) {
        // https://github.com/cujojs/when
        defer = window.when.defer;
    } else if (window.Q && _isFunction(window.Q.defer)) {
        // https://github.com/kriskowal/q
        defer = window.Q.defer;
    } else if (window.jQuery && _isFunction(window.jQuery.Deferred)) {
        // http://jquery.com
        defer = window.jQuery.Deferred;
    }

    return websql;
}));