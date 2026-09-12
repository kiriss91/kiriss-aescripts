// Keep only selected layers that have a parent AND no children
(function keepYoungestChildren() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 1) return;

    app.beginUndoGroup("Keep Youngest Children");

    var youngest = [];

    // Helper: check if layer has any children in comp
    function hasChildren(layer) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).parent === layer) {
                return true;
            }
        }
        return false;
    }

    for (var i = 0; i < selectedLayers.length; i++) {

        var layer = selectedLayers[i];

        if (layer.parent != null && !hasChildren(layer)) {
            youngest.push(layer);
        }
    }

    // Deselect everything
    for (var i = 1; i <= comp.numLayers; i++) {
        comp.layer(i).selected = false;
    }

    // Select only youngest children
    for (var i = 0; i < youngest.length; i++) {
        youngest[i].selected = true;
    }

    app.endUndoGroup();

})();