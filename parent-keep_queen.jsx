// Keep only highest parent (root) of selected layers
(function keepHighestQueens() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 1) return;

    app.beginUndoGroup("Keep Highest Parent");

    var rootParents = [];

    function alreadyAdded(layer, array) {
        for (var i = 0; i < array.length; i++) {
            if (array[i] === layer) return true;
        }
        return false;
    }

    // Find highest parent for each selected layer
    for (var i = 0; i < selectedLayers.length; i++) {

        var current = selectedLayers[i];

        while (current.parent != null) {
            current = current.parent;
        }

        if (!alreadyAdded(current, rootParents)) {
            rootParents.push(current);
        }
    }

    // Deselect everything
    for (var i = 1; i <= comp.numLayers; i++) {
        comp.layer(i).selected = false;
    }

    // Select only highest queens
    for (var i = 0; i < rootParents.length; i++) {
        rootParents[i].selected = true;
    }

    app.endUndoGroup();

})();