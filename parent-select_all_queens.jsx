// Select immediate parents of all selected layers (no duplicates)
(function selectParentsMultiple() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 1) return; // need at least one layer

    app.beginUndoGroup("Select Immediate Parents");

    var parents = []; // store unique parent layers

    // Collect immediate parents
    for (var i = 0; i < selectedLayers.length; i++) {
        var layer = selectedLayers[i];
        if (layer.parent != null && parents.indexOf(layer.parent) === -1) {
            parents.push(layer.parent);
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