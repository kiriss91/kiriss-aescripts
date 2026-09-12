{
    app.beginUndoGroup("Smart Hierarchy Parent To Last");

    var comp = app.project.activeItem;

    if (comp && comp instanceof CompItem) {

        var layers = comp.selectedLayers;

        if (layers.length >= 2) {

            var master = layers[layers.length - 1]; // last selected

            // Build lookup of selected layers
            var selectedLookup = {};
            for (var i = 0; i < layers.length; i++) {
                selectedLookup[layers[i].index] = true;
            }

            // 1️⃣ Unparent master ONLY if its parent is selected
            if (master.parent != null && selectedLookup[master.parent.index]) {
                master.parent = null;
            }

            // 2️⃣ Process other selected layers
            for (var i = 0; i < layers.length - 1; i++) {

                var layer = layers[i];

                if (layer.parent == null) {
                    // No parent → parent to master
                    layer.parent = master;
                } 
                else {
                    // If parent is NOT selected → reparent to master
                    if (!selectedLookup[layer.parent.index]) {
                        layer.parent = master;
                    }
                    // If parent IS selected → keep existing relationship
                }
            }

        } else {
            alert("Select at least two layers.\nLast selected becomes master parent.");
        }

    } else {
        alert("Please select a composition.");
    }

    app.endUndoGroup();
}