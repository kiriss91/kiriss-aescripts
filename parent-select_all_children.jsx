// Select children of all selected layers
// Default: selects the youngest (deepest, leaf) descendants
// Alt held: selects only the immediate (one level down) children
(function selectChildrenMultiple() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length < 1) return;

    var altPressed = ScriptUI.environment.keyboardState.altKey;

    app.beginUndoGroup(altPressed ? "Select Direct Children" : "Select Youngest Children");

    var children = [];

    if (altPressed) {

        // Immediate children only
        for (var i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            for (var j = 0; j < selectedLayers.length; j++) {
                if (layer.parent === selectedLayers[j]) {
                    if (children.indexOf(layer) === -1) {
                        children.push(layer);
                    }
                }
            }
        }

    } else {

        // Deepest leaf descendants
        var allDescendants = [];

        function collectChildren(parentLayer) {
            for (var i = 1; i <= comp.numLayers; i++) {
                var layer = comp.layer(i);

                if (layer.parent === parentLayer) {
                    if (allDescendants.indexOf(layer) === -1) {
                        allDescendants.push(layer);
                    }
                    collectChildren(layer); // recurse deeper
                }
            }
        }

        for (var i = 0; i < selectedLayers.length; i++) {
            collectChildren(selectedLayers[i]);
        }

        // Find leaf nodes (layers that have no children)
        for (var i = 0; i < allDescendants.length; i++) {
            var candidate = allDescendants[i];
            var hasChild = false;

            for (var j = 1; j <= comp.numLayers; j++) {
                if (comp.layer(j).parent === candidate) {
                    hasChild = true;
                    break;
                }
            }

            if (!hasChild) {
                children.push(candidate);
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
