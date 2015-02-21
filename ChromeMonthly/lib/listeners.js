function addTheListeners(){

	document.querySelector('#MemberName').addEventListener('change', function(evt){
      var selection = document.getElementById("MemberName");
      if (selection.value == "ADD") {
        MembrDialog.showModal();
        return;
      }
	});

	document.querySelector('#newMemberSave').addEventListener("click", function(evt) {
      var recordid;
      saveMember();
      //console.log(recordid);
	});

  document.querySelector('#Description').addEventListener('change', function(evt){
      var selection = document.getElementById("Description");
      if (selection.value == "ADD") {
        DescrDialog.showModal();
        return;
      }
	});

	document.querySelector('#newDescrSave').addEventListener("click", function(evt) {
      var recordid;
      saveDescr();
      //console.log(recordid);
	});

	document.querySelector('#selWeek').addEventListener('change', function(evt){
      var selection = document.getElementById("selWeek");
      renderData(1);
	});

	document.querySelector('#selMonth').addEventListener('change', function(evt){
      var selection = document.getElementById("selMonth");
      ThisMonth=this.value;
      renderData(1);
	});


  MembrDialog = document.querySelector('#AddMember');

	MembrDialog.addEventListener("close", function(evt) {
		//populateMembers();
		//populateMemberDropdown(Members);
		if (MembrDialog.returnValue.match(/^saved:/)){
			var retsplit=MembrDialog.returnValue.split(/:/);
			var val=retsplit[1];
			console.log("VAL: "+val);
			//var selection = document.getElementById('MemberName');
			//selection.selectedIndex = val;
			//for(var i, j = 0; i = selection.options[j]; j++) {
			//console.log(i.value +'=='+ val);
				//if(i.value == val) {
					//selection.selectedIndex = j;
				//	$_("#MemberName").value=j;
				//	break;
				//}
			//}
			$_("#MemberName").value="ADD";//val.toString();
			//document.getElementById("MemberName").selectedIndex=val;
		}
        document.querySelector('#result').textContent = MembrDialog.returnValue;
	});

	// called when the user Cancels the dialog, for example by hitting the ESC key
	MembrDialog.addEventListener("cancel", function(evt) {
	  MembrDialog.close("cancelled");
	});


	DescrDialog = document.querySelector('#AddDescr');

	DescrDialog.addEventListener("close", function(evt) {
		//populateMembers();
		//populateMemberDropdown(Members);
		if (DescrDialog.returnValue.match(/^saved:/)){
			var retsplit=DescrDialog.returnValue.split(/:/);
			var val=retsplit[1];
			console.log("VAL: "+val);
			//var selection = document.getElementById('MemberName');
			//selection.selectedIndex = val;
			//for(var i, j = 0; i = selection.options[j]; j++) {
			//console.log(i.value +'=='+ val);
				//if(i.value == val) {
					//selection.selectedIndex = j;
				//	$_("#MemberName").value=j;
				//	break;
				//}
			//}
			$_("#Description").value="ADD";//val.toString();
			//document.getElementById("MemberName").selectedIndex=val;
		}
        document.querySelector('#result').textContent = DescrDialog.returnValue;
	});

	// called when the user Cancels the dialog, for example by hitting the ESC key
	DescrDialog.addEventListener("cancel", function(evt) {
	  DescrDialog.close("cancelled");
	});

}