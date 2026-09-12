// Select all direct child layers of all selected layers
(function selectChildrenMultiple() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 1) return;

    app.beginUndoGroup("Select Direct Children");

    var children = [];

    // Loop through all layers in comp
    for (var i = 1; i <= comp.numLayers; i++) {
        var layer = comp.layer(i);

        // Check if this layer's parent is in selectedLayers
        for (var j = 0; j < selectedLayers.length; j++) {
            if (layer.parent === selectedLayers[j]) {

                // Avoid duplicates
                if (children.indexOf(layer) === -1) {
                    children.push(layer);
                }
            }
        }
    }

    // Deselect everything
    for (var i = 1; i <= comp.numLayers; i++) {
        comp.layer(i).selected = false;
    }

    // Select collected children
    for (var i = 0; i < children.length; i++) {
        children[i].selected = true;
    }

    app.endUndoGroup();

})();