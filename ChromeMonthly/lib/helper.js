Date.prototype.getWeekOfMonth = function(exact) {
    var month = this.getMonth()
    , year = this.getFullYear()
    , firstWeekday = new Date(year, month, 1).getDay()
    , lastDateOfMonth = new Date(year, month + 1, 0).getDate()
    , offsetDate = this.getDate() + firstWeekday - 1
    , index = 1 // start index at 0 or 1, your choice
    , weeksInMonth = index + Math.ceil((lastDateOfMonth + firstWeekday - 7) / 7)
    , week = index + Math.floor(offsetDate / 7)
    ;
    if (exact || week < 2 + index) return week;
    return week === weeksInMonth ? index + 5 : week;
  };

  //Date.prototype.getThisDayOfMonth = function() {
  //  var month = this.getMonth()
  //  , year = this.getFullYear()
  //  , firstWeekday = new Date(year, month, 1).getDay()
  //  , lastDateOfMonth = new Date(year, month + 1, 0).getDate()
  //  , today = this.getDate()
  //  , thisDayofMonth = Math.ceil((today - firstweekday) / 7)
  //  , week = index + Math.floor(offsetDate / 7)
  //  ;

    //if (exact || week < 2 + index) return week;
    //return week === weeksInMonth ? index + 5 : week;
  //  return thisDayofMonth;
  //};


  function renderData(sort){
    if(typeof(sort)==='undefined') sort = 0;

    //ThisMonth=
    if (adminmode=="EOM"){
      eomtable=""+ThisMonth+"_MonthEnd";
      //eomtable=""+$_("#selMonth").value+"_MonthEnd";
      eomdbInit(sort);
      populateMinistries();
      buildWeeklyBreakdown(ThisMonth);

      $_("#EOMonth").innerHTML = "for "+ThisMonth+" ";

    }else{

      //ThisWeekNum=$_("#selWeek").value;//=date.getWeekOfMonth(false);
      ThisWeekNum=document.getElementById("selWeek").value;
      dbtable=""+ThisMonth+"_WEEK_"+ThisWeekNum+"";

      initialiseTables(sort);
      populateMembers();
      populateDescr();

      $_("#MonthWeek").innerHTML = ThisMonth+" WEEK-"+ThisWeekNum+" ";
    }

  }


  function dbgmsg(msg) {
    document.getElementById("debugview").innerHTML = msg;
  }

  function summary(data) {
    document.getElementById("summary").innerHTML = data;
  }

  function logger(tx, error) {
    console.log("Error", error.message);
  }

  function logArguments() {
    console.log(arguments);
  }

  function $_(selector) {
    return document.querySelector(selector);
  }


  function clearMemberDropdown(){
	var list=document.getElementById("MemberName");
	//list.innerHTML="";
	//console.log(list.childNodes.length);
	for (var h = 0; h = list.childNodes.length; h++){
		//console.log("to remove: "+list.childNodes[0].textContent);
		list.removeChild(list.childNodes[0]);
	}
  }

  function populateMemberDropdown(){
    select = document.getElementById("MemberName");

	var option = document.createElement("option");
	option.value = "0";
    option.textContent = "Select A Member";
    select.appendChild(option);

    for (var i = 0; i < Members.DATA.length; i++) {
		var option = document.createElement("option");
        option.value = Members.DATA[i][0];
        option.textContent = Members.DATA[i][1];
		//console.log(Members.DATA[0][1]);
        select.appendChild(option);
    };
	var option = document.createElement("option");
	option.value = "ADD";
    option.textContent = "+ Add New";
    select.appendChild(option);
  }

  function populateMembers() {
    Members.DATA=[];
  	db.transaction(function(tx) {
        tx.executeSql("select * from Members where Active='on' order by MemberName COLLATE NOCASE", [], function(tx, results) {
  		//alert(results.rows.length);
          for (var i=0; i<results.rows.length; i++) {
  			var record = results.rows.item(i);
  			//alert(record.memberID+"-"+record.MemberName);
  			Members.DATA.push([record.memberID.toString(),record.MemberName]);
  		}
  		clearMemberDropdown();
  		populateMemberDropdown();
  	  });
  	});
  }


  function clearDescrDropdown(){
	var list=document.getElementById("Description");
	//list.innerHTML="";
	//console.log(list.childNodes.length);
  	for (var h = 0; h = list.childNodes.length; h++){
  		//console.log("to remove: "+list.childNodes[0].textContent);
  		list.removeChild(list.childNodes[0]);
  	}
  }

  function populateDescrDropdown(){
    select = document.getElementById("Description");

  	var option = document.createElement("option");
  	option.value = "0";
    option.textContent = "Select Description";
    select.appendChild(option);

    for (var i = 0; i < Descr.DATA.length; i++) {
		  var option = document.createElement("option");
        option.value = Descr.DATA[i][0];
        option.textContent = Descr.DATA[i][1];
		//console.log(Members.DATA[0][1]);
        select.appendChild(option);
    };
  	var option = document.createElement("option");
  	option.value = "ADD";
    option.textContent = "+ Add New";
    select.appendChild(option);
  }

  function populateDescr() {
    Descr.DATA=[];
  	db.transaction(function(tx) {
        tx.executeSql("select * from Descriptions where Active='on' order by Description COLLATE NOCASE", [], function(tx, results) {
  		  //alert(results.rows.length);
        for (var i=0; i<results.rows.length; i++) {
    			var record = results.rows.item(i);
    			//alert(record.memberID+"-"+record.MemberName);
    			Descr.DATA.push([record.descrID.toString(),record.Description]);
  	  	}
    		clearDescrDropdown();
    		populateDescrDropdown();
  	  });
  	});

  }


  function showRecords(sort) {
    if(typeof(sort)==='undefined') sort = 0;


    //console.log("db", db);
    html = "";
	var genlCashTTL=0.0;
    var genlChkTTL=0.0;
    var dsgnCashTTL=0.0;
    var dsgnChkTTL=0.0;
    var dsgnatedTTL=0.0;
    var generalTTL=0.0;
    var weekTTL=0.0;
    var sortstring='';

    if (sort)
        sortstring='ORDER BY MemberName COLLATE NOCASE';
    db.transaction(function(tx) {
      tx.executeSql("select * from "+dbtable+" "+sortstring, [], function(tx, results) {
        for (var i=0; i<results.rows.length; i++) {
          var record = results.rows.item(i);
		  genlCashTTL+= +(record.GenCashAmt);
		  genlChkTTL+= +(record.GenChkAmt);
          generalTTL+= +(record.GenCashAmt) + +(record.GenChkAmt);

		  dsgnCashTTL+= +(record.DesCashAmt);
          dsgnChkTTL+= +(record.DesChkAmt);
          dsgnatedTTL+= +(record.DesCashAmt) + +(record.DesChkAmt);

          weekTTL+= +(record.DesCashAmt) + +(record.DesChkAmt)
                  + +(record.GenCashAmt) + +(record.GenChkAmt);

          //genlCashTTL+=record.GenCashAmt;
		  //genlChkTTL+=record.GenChkAmt;
		  //dsgnCashTTL+=record.DesCashAmt;
          //dsgnChkTTL+=record.DesChkAmt;
          var GcashAmt=(record.GenCashAmt)?parseFloat(record.GenCashAmt).toFixed(2):'';
          var GchkAmt=(record.GenChkAmt)?parseFloat(record.GenChkAmt).toFixed(2):'';
          var DcashAmt=(record.DesCashAmt)?parseFloat(record.DesCashAmt).toFixed(2):'';
          var DchkAmt=(record.DesChkAmt)?parseFloat(record.DesChkAmt).toFixed(2):'';
          html+="<table class='tabledata'><tr class='rowdata'>"+
		  "<td><input id='"+record.recid+"rid' size='2' value='"+record.recid+"' disabled /></td> "+
            "<td><input value='"+record.MemberName+"' style='width: 165px;' disabled /></td> "+
		  "<td><input value='"+GcashAmt+"' size='4' disabled /></td> "+
		  "<td><input value='"+record.GenChkNum+"' size='4' disabled /></td> "+
		  "<td><input value='"+GchkAmt+"' size='4' disabled /></td> "+
		  "<td><input value='"+DcashAmt+"' size='4' disabled /></td> "+
		  "<td><input value='"+record.DesChkNum+"' size='4' disabled /></td> "+
		  "<td><input value='"+DchkAmt+"' size='4' disabled /></td> "+
		  "<td><input value='"+record.Description+"' size='25' disabled /></td>"+
		  "<td><button id='"+record.recid+"' class='remove'>x</button></td> "+
		  "<td><button id='"+record.recid+"' class='admingear'>edit</button></td> "+
		  "</tr></table>";
        }

        $_("#records").innerHTML = html;

		document.getElementById("ftrGenCashAmt").value = parseFloat(genlCashTTL).toFixed(2);
		document.getElementById("ftrGenChkAmt").value = parseFloat(genlChkTTL).toFixed(2);
		document.getElementById("ftrDesCashAmt").value = parseFloat(dsgnCashTTL).toFixed(2);
		document.getElementById("ftrDesChkAmt").value = parseFloat(dsgnChkTTL).toFixed(2);

        document.getElementById("sumGenTotal").value = parseFloat(generalTTL).toFixed(2);
        document.getElementById("sumDesTotal").value = parseFloat(dsgnatedTTL).toFixed(2);
        document.getElementById("sumTotal").value = parseFloat(weekTTL).toFixed(2);

      });
    });
  }

function keysorting(json_object, key_to_sort_by) {
    function sortByKey(a, b) {
        var x = a[key_to_sort_by];
        var y = b[key_to_sort_by];
        return ((x < y) ? -1 : ((x > y) ? 1 : 0));
    }

    json_object.sort(sortByKey);
}