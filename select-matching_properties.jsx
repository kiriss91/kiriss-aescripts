var myComp = app.project.activeItem;
var myProps = myComp.selectedProperties;
for (var p = 0; p < myProps.length; p++){
	var myLayers = myComp.selectedLayers;
	for (var l = 0; l < myLayers.length; l++){
		var myProp = myProps[p];
		var myPropString = "";
		while (myProp.parentProperty !== null){
			var name = "\"" + myProp.name + "\"";
			myPropString = ".property" + "(" + name + ")" + myPropString;
			myProp = myProp.parentProperty;
		}
		if (myPropString != ""){
			eval("var myActualProp = myComp.layer('"  + myLayers[l].name  + "')" + myPropString + ";");
			myActualProp.selected = true;
		}
	}
};