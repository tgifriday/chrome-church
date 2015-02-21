function endOfMonthINIT(){

    $('header').html('<p></p><strong><span class="appname"></span> Tithe Report - End Of Month Report  <span id="EOMonth"></span></strong> <span class="appversion"></span>');
    document.getElementById("endofMonth").style.display = 'none';
    document.getElementById("OpBut").style.display = 'none';
    document.getElementById("home").style.color = 'red';
    document.getElementById("home").style.display = 'block';
    adminmode="EOM";

    renderData();
    setupEOMListeners();

}

function eomdbInit(){

   db.transaction(function(tx) {
	//tx.executeSql("drop table if exists Week"+ThisWeekNum);
    //tx.executeSql("drop table if exists "+dbtable);
	dbgmsg("Creating table if not existing "+eomtable+"");
    tx.executeSql("create table if not exists "+eomtable+" ("
      + "recid INTEGER primary key,"
      + "MinistryName TEXT,"
	  + "DesgPct REAL,"
	  + "DesgAmt REAL,"
	  + "Description TEXT"
      + ")",null,null, logger);
    showEOMRecords();
    //console.log("doffo");
  });

  db.transaction(function(tx) {
    //tx.executeSql("drop table if exists Members");
	dbgmsg("Creating table if not existing Ministries");
    tx.executeSql("create table if not exists Ministries ("
      + "ministryID INTEGER primary key,"
      + "MinistryName TEXT,"
	  + "Active INTEGER,"
	  + "Percentage REAL,"
	  + "Description TEXT"
      + ")",null,null, logger);
    //showRecords();
    //console.log("doffo");
  });

}


function buildWeeklyBreakdown(ThisMonth){

  db.transaction(function(tx) {
      tx.executeSql("select * from "+eomtable, [], function(tx, results) {
        for (var i=0; i<results.rows.length; i++) {
          $_("#wk1").innerHTML='<td>Week 1</td><td id="wk5gentot" class="genl">gen</td><td id="wk5dsgtot" class="dsgn">dsg</td><td id="wk5grandtot" class="totl">gt</td>';
          $_("#wk2").innerHTML='<td>Week 2</td><td id="wk5gentot" class="genl"></td><td id="wk5dsgtot" class="dsgn"></td><td id="wk5grandtot" class="totl"></td>';
          $_("#wk3").innerHTML='<td>Week 3</td><td id="wk5gentot" class="genl"></td><td id="wk5dsgtot" class="dsgn"></td><td id="wk5grandtot" class="totl"></td>';
          $_("#wk4").innerHTML='<td>Week 4</td><td id="wk5gentot" class="genl"></td><td id="wk5dsgtot" class="dsgn"></td><td id="wk5grandtot" class="totl"></td>';
          $_("#wk5").innerHTML='<td>Week 5</td><td id="wk5gentot" class="genl"></td><td id="wk5dsgtot" class="dsgn"></td><td id="wk5grandtot" class="totl"></td>';
        }
    });
  });
}

function showEOMRecords(){
    //console.log("db", db);
    html = "";
	var eomDsgTTL=0.0;
    var eomPctTTL=0.0;
    db.transaction(function(tx) {
      tx.executeSql("select * from "+eomtable, [], function(tx, results) {
        for (var i=0; i<results.rows.length; i++) {
          var record = results.rows.item(i);
		  eomDsgTTL+= +(record.GenCashAmt);
		  eomPctTTL+= +(record.GenChkAmt);

          var GcashAmt=(record.GenCashAmt)?parseFloat(record.GenCashAmt).toFixed(2):'';
          var GchkAmt=(record.GenChkAmt)?parseFloat(record.GenChkAmt).toFixed(2):'';
          var DcashAmt=(record.DesCashAmt)?parseFloat(record.DesCashAmt).toFixed(2):'';
          var DchkAmt=(record.DesChkAmt)?parseFloat(record.DesChkAmt).toFixed(2):'';
          html+="<div class='tabledata'><div class='rowdata'>"+
		  "<input id='"+record.recid+"rid' size='2' value='"+record.recid+"' disabled /> "+
		  "<input value='"+record.MemberName+"' size='20' disabled /> "+
		  "<input value='"+GcashAmt+"' size='4' disabled /> "+
		  "<input value='"+record.GenChkNum+"' size='4' disabled /> "+
		  "<input value='"+GchkAmt+"' size='4' disabled /> "+
		  "<input value='"+DcashAmt+"' size='4' disabled /> "+
		  "<input value='"+record.DesChkNum+"' size='4' disabled /> "+
		  "<input value='"+DchkAmt+"' size='4' disabled /> "+
		  "<input value='"+record.Description+"' size='25' disabled />"+
		  "<button id='"+record.recid+"' class='remove'>x</button> "+
		  "<button id='"+record.recid+"' class='admingear'>edit</button> "+
		  "</div></div>";
        }
        $_("#EOMrecords").innerHTML = html;
		//$_("#totals #ftrGenCashAmt").value = parseFloat(eomDsgTTL).toFixed(2);
		//$_("#totals #ftrGenChkAmt").value = parseFloat(eomPctTTL).toFixed(2);

      });
    });
}

function populateMinistries(){
    Ministry.DATA=[];
	db.transaction(function(tx) {
      tx.executeSql("select * from Ministries where Active='on' ORDER BY MinistryName COLLATE NOCASE", [], function(tx, results) {
		//alert(results.rows.length);
        for (var i=0; i<results.rows.length; i++) {
			var record = results.rows.item(i);
			//alert(record.memberID+"-"+record.MemberName);
			Ministry.DATA.push([record.ministryID.toString(),record.MinistryName]);
		}
		clearMinistryDropdown();
		populateMinistryDropdown();
	  });
	});

}

function clearMinistryDropdown(){
  var list=document.getElementById("EOMMinistryName");
  //list.innerHTML="";
  //console.log(list.childNodes.length);
  for (var h = 0; h = list.childNodes.length; h++){
    //console.log("to remove: "+list.childNodes[0].textContent);
    list.removeChild(list.childNodes[0]);
  }
}

function populateMinistryDropdown(){
  select = document.getElementById("EOMMinistryName");

  var option = document.createElement("option");
  option.value = "0";
  option.textContent = "Select A Ministry";
  select.appendChild(option);

  for (var i = 0; i < Ministry.DATA.length; i++) {
    var option = document.createElement("option");
    option.value = Minsitry.DATA[i][0];
    option.textContent = Ministry.DATA[i][1];
    //console.log(Members.DATA[0][1]);
    select.appendChild(option);
  };
  var option = document.createElement("option");
  option.value = "ADD";
  option.textContent = "+ Add New";
  select.appendChild(option);
}


function setupEOMListeners(){

    dialog = document.querySelector('#AddMinistry');

	document.querySelector('#EOMMinistryName').addEventListener('change', function(evt){
      var selection = document.getElementById("EOMMinistryName");
      if (selection.value == "ADD") {
        dialog.showModal();
        return;
      }
	});

	document.querySelector('#EOMMinistryAdd').addEventListener("click", function(evt) {
      var recordid;
      saveMinistry();
      //console.log(recordid);
	});

}