
//DBSYNC.initSync(TABLES_TO_SYNC, db, SYNCDATA.sync_info, 'http://www.myserver.com', callBackEndInit);

window.onload = function() {
  date = new Date();

  if (!window.openDatabase) {
    dbgmsg("Database is not supported");
    return;
  }
  $_("#selMonth").value=ThisMonth;

  addTheListeners();
  renderData(1);

  $_(".appname").innerHTML=appname;
  $_(".appversion").innerHTML=appversion;


  $_("#save").onclick = function() {
	LookUpMember($_("#MemberName").value);
	LookUpDescr($_("#Description").value);
    SaveData();
    populateMembers();
    populateDescr();
  };

  $_("#admin").onclick = function(){
    var e = document.getElementById("admin");
    if (confirm('Are you sure you want to enter admin mode? (OK=yes, Cancel=no)')) {
      isadmin=1;
      e.style.background="red";
      $_(".admingear").style.display='inline';
    } else {
      isadmin=0;
      e.style.background="";
      $_(".admingear").style.display='none';
    }
  };

  $_("#sortid").onclick=function(){
    renderData(0);
  }

  $_("#sortname").onclick=function(){
    renderData(1);
  }

  $_("#dbgmode").onclick=function(){
    var e = document.getElementById("debug");
    if (dbgmode=="ON"){
          dbgmode="OFF";
          e.style.display = 'none';
          //$_(".debug").hide;
    }else{
          dbgmode="ON";
          e.style.display = 'block';
          //$_(".debug").show;
    }
  };

  $_("#exportReport").onclick = function(){
    exportThisWeek();
  };

  $_("#exportMember").onclick = function(){
    exportMemberList();
  };

  $_("#exportMinistries").onclick = function(){
    exportMinistryList();
  };

  $_("#endofMonth").onclick = function(){
    //document.location.href = "endofMonth.html";
    $('#contentarea').load('endofMonth.html',function() {
      endOfMonthINIT();
    });
  };

  $_("#home").onclick = function() {
    location.reload(true);
  };

  $_("#dump").onclick = function() {
	var html="DUMP:<button id='dump2'>Hide</button><hr />";
    dumpDBtoScreen();
  };

  //$_("#Description").onkeyup = function(ev) {
//    if (ev.keyCode==13) $_("#save").onclick();
//  };

  $_("#records").onclick = function(ev) {
    if ((ev.target.className!="remove") &&
        (ev.target.className!="admingear")) return;
    var recordID = ev.target.id;
    //console.log(recordID);
    console.log(ev.target.className);

    if (ev.target.className=="admingear")
      //console.log(ev.target.text());
      ev.target.innerHTML="UPDATE";
    if (ev.target.className=="remove")
      if (confirm("Are you sure?")) {
        deleteRecord(recordID);
      }
  };

};