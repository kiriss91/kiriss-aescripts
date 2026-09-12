app.beginUndoGroup("Move to Comp Center (Keyframes Safe)");

var comp = app.project.activeItem;

if (!comp || !(comp instanceof CompItem)) {
    alert("Please select a composition.");
} else if (comp.selectedLayers.length === 0) {
    alert("Please select at least one layer.");
} else {
    var compCenter = [comp.width / 2, comp.height / 2];

    for (var i = 0; i < comp.selectedLayers.length; i++) {
        var layer = comp.selectedLayers[i];

        // Get current position at comp time (this is the location of the anchor point)
        var curPos = layer.position.value;

        // Calculate how much to shift so the anchor moves to comp center
        var shiftX = compCenter[0] - curPos[0];
        var shiftY = compCenter[1] - curPos[1];

        // Apply the same shift to ALL position keyframes (or the static value)
        var posProp = layer.position;
        if (posProp.numKeys > 0) {
            for (var k = 1; k <= posProp.numKeys; k++) {
                var keyVal = posProp.keyValue(k);
                posProp.setValueAtKey(k, [keyVal[0] + shiftX, keyVal[1] + shiftY]);
            }
        } else {
            posProp.setValue([curPos[0] + shiftX, curPos[1] + shiftY]);
        }
    }
}

app.endUndoGroup();