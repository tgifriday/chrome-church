function initialiseTables(sort){
   if(typeof(sort)==='undefined') sort = 0;

   db.transaction(function(tx) {
	//tx.executeSql("drop table if exists Week"+ThisWeekNum);
    //tx.executeSql("drop table if exists "+dbtable);
	dbgmsg("Creating table if not existing "+dbtable+"");
    tx.executeSql("create table if not exists "+dbtable+" ("
      + "recid INTEGER primary key,"
      + "MemberName TEXT,"
	  + "GenCashAmt REAL,"
	  + "GenChkNum INTEGER,"
      + "GenChkAmt REAL,"
	  + "DesCashAmt REAL,"
	  + "DesChkNum INTEGER,"
	  + "DesChkAmt REAL,"
	  + "Description TEXT"
      + ")",null,null, logger);
    showRecords(sort);
    //console.log("doffo");
  });

  db.transaction(function(tx) {
    //tx.executeSql("drop table if exists Members");
	dbgmsg("Creating table if not existing Members");
    tx.executeSql("create table if not exists Members ("
      + "memberID INTEGER primary key,"
      + "MemberName TEXT,"
	  + "Active INTEGER,"
	  + "Description TEXT"
      + ")",null,null, logger);
    //showRecords();
    //console.log("doffo");
  });

  db.transaction(function(tx) {
    //tx.executeSql("drop table if exists Members");
	dbgmsg("Creating table if not existing Descriptions");
    tx.executeSql("create table if not exists Descriptions ("
      + "descrID INTEGER primary key,"
      + "Description TEXT,"
	  + "Active INTEGER"
      + ")",null,null, logger);
    //showRecords();
    //console.log("doffo");
  });

}

function LookUpMember(mid){
	db.transaction(function(tx) {
	  tx.executeSql("select * from Members where memberID="+mid, [], function(tx, results) {
		//console.log("select * from Members where memberID="+mid);
		var record = results.rows.item(0);
		//console.log(record.MemberName);
		MemberName=record.MemberName;
	  });
	});
  }

function LookUpDescr(did){
	db.transaction(function(tx) {
	  tx.executeSql("select * from Descriptions where descrID="+did, [], function(tx, results) {
		//console.log("select * from Members where memberID="+mid);
		var record = results.rows.item(0);
		//console.log(record.MemberName);
		Description=record.Description;
	  });
	});
  }

function SaveData(){
     db.transaction(function(tx) {
      //console.log("running2");
	  //console.log(MemberName);
	  dbgmsg("insert into "+dbtable+" (MemberName, GenCashAmt, GenChkNum, GenChkAmt, DesCashAmt, DesChkNum, DesChkAmt, Description) "
        + "values ("
		+ $_("#MemberName").value+", "
		+ $_("#GenCashAmt").value+", "
		+ $_("#GenChkNum").value+", "
		+ $_("#GenChkAmt").value+", "
		+ $_("#DesCashAmt").value+", "
		+ $_("#DesChkNum").value+", "
		+ $_("#DesChkAmt").value+", "
		+ $_("#Description").value
		);
      tx.executeSql(
          "insert into "+dbtable+" (MemberName, GenCashAmt, GenChkNum, GenChkAmt, DesCashAmt, DesChkNum, DesChkAmt, Description) "
        + "values ("
		+"?,?,?,?,?,?,?,?)", [
		MemberName,
		$_("#GenCashAmt").value,
		$_("#GenChkNum").value,
		$_("#GenChkAmt").value,
        $_("#DesCashAmt").value,
		$_("#DesChkNum").value,
		$_("#DesChkAmt").value,
		Description
		], null,  logger
      );
      //console.log("done");

      $_("#MemberName").value = "";
      $_("#GenCashAmt").value = "";
      $_("#GenChkNum").value = "";
      $_("#GenChkAmt").value = "";
      $_("#DesCashAmt").value = "";
      $_("#DesChkNum").value = "";
      $_("#DesChkAmt").value = "";
      $_("#Description").value = "";

      showRecords();
    });

}

function exportThisWeek(){
     db.transaction(function (tx) {
      tx.executeSql("select * from "+dbtable, [], function(tx, results) {
        csvContent = "data:text/csv;charset=utf-8,";
        csvContent+=
          "RecID\t"+
		  "MemberName\t"+
		  "GenCashAmt\t"+
		  "GenChkNum\t"+
		  "GenChkAmt\t"+
		  "DesCashAmt\t"+
		  "DesChkNum\t"+
		  "DesChkAmt\t"+
		  "Description\n"+
		  "";
        for (var i=0; i<results.rows.length; i++) {
          var record = results.rows.item(i);

          var GcashAmt=(record.GenCashAmt)?parseFloat(record.GenCashAmt).toFixed(2):'';
          var GchkAmt=(record.GenChkAmt)?parseFloat(record.GenChkAmt).toFixed(2):'';
          var DcashAmt=(record.DesCashAmt)?parseFloat(record.DesCashAmt).toFixed(2):'';
          var DchkAmt=(record.DesChkAmt)?parseFloat(record.DesChkAmt).toFixed(2):'';
          csvContent+=""+record.recid+"\t"+
		  record.MemberName+"\t"+
		  GcashAmt+"\t"+
		  record.GenChkNum+"\t"+
		  GchkAmt+"\t"+
		  DcashAmt+"\t"+
		  record.DesChkNum+"\t"+
		  DchkAmt+"\t"+
		  record.Description+"\n"+
		  "";
        }

        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "EXP-"+dbtable+".csv");

        link.click();

        $_("#datadump").innerHTML = "Weekly Downloaded";

	   });
    });
}


function exportMemberList(){
     db.transaction(function (tx) {
      tx.executeSql("select * from Members", [], function(tx, results) {
        csvContent = "data:text/csv;charset=utf-8,";
        csvContent+="memberID\tMemberName\tActive\tDescription\n";
        for (var i=0; i<results.rows.length; i++) {
          var record = results.rows.item(i);

          csvContent+=""+record.memberID+"\t"+
            record.MemberName+"\t"+
		    record.Active+"\t"+
		    record.Description+"\t"+
		  "\n";
        }
        var encodedUri = encodeURI(csvContent);
        var link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", "EXP-Member.csv");

        link.click();

        $_("#datadump").innerHTML = "Member List Downloaded";

	   });
    });

}

function saveMember(){
 		db.transaction(function(tx,rs) {
		  //console.log("running2");
		  dbgmsg("Added record to Members");
		  tx.executeSql(
			  "insert into Members (MemberName, Active, Description) "
			+ "values ("
			+"?,?,?)", [
			$_("#NewMemberName").value,
			$_("#NewMemberAct").value,
			$_("#NewMemberDesc").value
			], function (xact, rs) {
                          recordid = rs.insertId;
						  populateMembers();
						  $_("#NewMemberName").value="";
						  $_("#NewMemberAct").value="on";
						  $_("#NewMemberDesc").value="";
						  MembrDialog.close("saved:"+recordid);
                      },  logger
		  );
		});

}

function saveDescr(){
 		db.transaction(function(tx,rs) {
		  //console.log("running2");
		  dbgmsg("Added record to Descriptions");
		  tx.executeSql(
			  "insert into Descriptions (Description, Active) "
			+ "values ("
			+"?,?)", [
			$_("#NewDescr").value,
      $_("#NewDescrReuse").value
			], function (xact, rs) {
                          recordid = rs.insertId;
						  populateDescr();
						  $_("#NewDescr").value="";
						  $_("#NewDescrReuse").value="on";
						  DescrDialog.close("saved:"+recordid);
                      },  logger
		  );
		});

}

function deleteRecord(recordID){
         db.transaction(function(tx) {
          dbgmsg("delete from cities where recid="+recordID);
          tx.executeSql("delete from "+dbtable+" where recid=?", [recordID], null, logger);
          showRecords();
        });


}

function dumpDBtoScreen(){

    db.transaction(function(tx) {
      tx.executeSql("select * from "+dbtable, [], function(tx, results) {
        for (var i=0; i<results.rows.length; i++) {
          var record = results.rows.item(i);

          var GcashAmt=(record.GenCashAmt)?parseFloat(record.GenCashAmt).toFixed(2):'';
          var GchkAmt=(record.GenChkAmt)?parseFloat(record.GenChkAmt).toFixed(2):'';
          var DcashAmt=(record.DesCashAmt)?parseFloat(record.DesCashAmt).toFixed(2):'';
          var DchkAmt=(record.DesChkAmt)?parseFloat(record.DesChkAmt).toFixed(2):'';
          html+="<div class='tabledata'><div class='rowdata'>"+
		  "<input id='dump"+record.recid+"rid' size='2' value='"+record.recid+"' disabled /> "+
		  "<input value='"+record.MemberName+"' size='20' disabled /> "+
		  "<input value='"+GcashAmt+"' size='4' disabled /> "+
		  "<input value='"+record.GenChkNum+"' size='4' disabled /> "+
		  "<input value='"+GchkAmt+"' size='4' disabled /> "+
		  "<input value='"+DcashAmt+"' size='4' disabled /> "+
		  "<input value='"+record.DesChkNum+"' size='4' disabled /> "+
		  "<input value='"+DchkAmt+"' size='4' disabled /> "+
		  "<input value='"+record.Description+"' size='25' disabled />"+
		  "</div></div>";
        }
        //$_("#datadump").innerHTML = html;

	   });
      tx.executeSql("select * from Members", [], function(tx, results) {
        for (var i=0; i<results.rows.length; i++) {
          var record = results.rows.item(i);

          html+="<div class='tabledata'><div class='rowdata'>"+
		  "<input id='dump"+record.memberID+"rid' size='2' value='"+record.memberID+"' disabled /> "+
		  "<input value='"+record.MemberName+"' size='20' disabled /> "+
		  "<input value='"+record.Active+"' size='4' disabled /> "+
		  "<input value='"+record.Description+"' size='25' disabled />"+
		  "</div></div>";
        }
        $_("#datadump").innerHTML = html;
		$_("#dump2").onclick = function() {
			$_("#datadump").innerHTML = "";
		}

	   });
	 });

}
