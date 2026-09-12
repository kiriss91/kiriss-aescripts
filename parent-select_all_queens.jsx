// Select parents of all selected layers (no duplicates)
// Default: climbs to the top-most root parent
// Alt held: selects only the immediate (one level up) parent
(function selectParentsMultiple() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 1) return; // need at least one layer

    var altPressed = ScriptUI.environment.keyboardState.altKey;

    app.beginUndoGroup(altPressed ? "Select Immediate Parents" : "Select Top Parents");

    var parents = []; // store unique parent layers

    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];

        if (altPressed) {
            // Immediate parent only
            if (layer.parent != null && parents.indexOf(layer.parent) === -1) {
                parents.push(layer.parent);
            }
        } else {
            // Climb up to the root parent
            while (layer.parent != null) {
                layer = layer.parent;
            }
            if (parents.indexOf(layer) === -1) {
                parents.push(layer);
            }
        }
    }

    // Deselect all layers first
    for (var i = 1; i <= comp.numLayers; i++) {
        comp.layer(i).selected = false;
    }

    // Select collected parents
    for (var i = 0; i < parents.length; i++) {
        parents[i].selected = true;
    }

    app.endUndoGroup();

})();
