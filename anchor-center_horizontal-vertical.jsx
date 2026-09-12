app.beginUndoGroup("Move to Comp Center (Ctrl = Vertical)");

var comp = app.project.activeItem;

if (!comp || !(comp instanceof CompItem)) {
    alert("Please select a composition.");
} else if (comp.selectedLayers.length === 0) {
    alert("Please select at least one layer.");
} else {

    var kb = ScriptUI.environment.keyboardState;
    var moveVertical = kb.ctrlKey || kb.metaKey; // Ctrl (Win) or Cmd (Mac)

    var compCenterX = comp.width / 2;
    var compCenterY = comp.height / 2;

    for (var i = 0; i < comp.selectedLayers.length; i++) {
        var layer = comp.selectedLayers[i];
        var posProp = layer.property("Position");
        var curPos = posProp.value;

        var shift;

        if (moveVertical) {
            shift = compCenterY - curPos[1];
        } else {
            shift = compCenterX - curPos[0];
        }

        if (posProp.numKeys > 0) {
            for (var k = 1; k <= posProp.numKeys; k++) {
                var keyVal = posProp.keyValue(k);

                if (moveVertical) {
                    posProp.setValueAtKey(k, [
                        keyVal[0],
                        keyVal[1] + shift
                    ]);
                } else {
                    posProp.setValueAtKey(k, [
                        keyVal[0] + shift,
                        keyVal[1]
                    ]);
                }
            }
        } else {
            if (moveVertical) {
                posProp.setValue([
                    curPos[0],
                    curPos[1] + shift
                ]);
            } else {
                posProp.setValue([
                    curPos[0] + shift,
                    curPos[1]
                ]);
            }
        }
    }
}

app.endUndoGroup();