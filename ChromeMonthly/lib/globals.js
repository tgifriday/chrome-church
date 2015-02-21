//var wsdb = websql("cities");
//    wsdb.read("SELECT * FROM cities");
//	dbgmsg(wsdb);

var manifest = chrome.runtime.getManifest();
var appname = manifest.name;
var appversion = "[v."+manifest.version+"]";


var months = ["January","February","March",    "April",  "May",     "June",
                 "July",   "August",  "September","October","November","December"];

var d = new Date();
var ThisYear = d.getFullYear();
var ThisMonth = months[d.getMonth()];
var ThisWeekNum;
var dbtable;
var eomtable;
var adminmode="DEF";
var isadmin = 0;
var Members = {
        "COLUMNS":["ID", "Name"],
        "DATA": [
        ]
    };
var Ministry = {
        "COLUMNS":["ID", "Name"],
        "DATA": [
        ]
    };
var Descr = {
        "COLUMNS":["ID", "Name"],
        "DATA": [
        ]
    };

var TABLES_TO_SYNC = [
    {tableName : 'table1', idName : 'the_id'},
    {tableName : 'table2'} //if idName not specified, it will assume that it's "id"
];

var SYNCDATA = {
    url: 'http://www.yourserver.com/sync',//TODO Set your server URL
    database: null,
    tableToSync: [{
        tableName: 'card_stat',
        idName: 'card_id'
    }, {
        tableName: 'stat'
    }, {
        tableName: 'user_card'
    }, {
        tableName: 'variable',
        idName: 'name'
    }],
    sync_info: {//Example of user info
        userEmail: 'test@gmail.com',//the user mail is not always here
        device_uuid: 'UNIQUE_DEVICE_ID_287CHBE873JB',//if no user mail, rely on the UUID
        lastSyncDate: 0,
		device_version: '5.1',
        device_name: 'test navigator',
		userAgent: navigator.userAgent,
        //app data
        appName: 'fr-en',
        mosa_version: '3.2',
        lng: 'fr'
    }
};

var MembrDialog;
var DescrDialog;

var MemberName;
var Description;
var dbgmode="OFF";


var db = window.openDatabase("db-"+ThisYear, "1.0", "Church DB for year "+ThisYear, 2 * 1024 * 1024);
