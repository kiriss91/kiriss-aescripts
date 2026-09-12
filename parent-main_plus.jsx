// Smart Hierarchy + Shift-Parent (world-safe, master restore) + Ctrl replace
(function smartShiftParent() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var layers = comp.selectedLayers;
    if (layers.length < 2) return;

    var ctrlPressed = ScriptUI.environment.keyboardState.ctrlKey;

    app.beginUndoGroup("Smart Hierarchy Shift-Parent");

    var master = layers[layers.length - 1]; // last selected = master
    var originalMasterParent = master.parent;

    // Build lookup for smart parenting
    var selectedLookup = {};
    for (var i = 0; i < layers.length; i++) {
        selectedLookup[layers[i].index] = true;
    }

    // Unparent master temporarily if parent is selected
    if (master.parent != null && selectedLookup[master.parent.index]) {
        master.parent = null;
    }

    function setPropValue(prop, value) {
        if (!prop) return;
        if (prop.numKeys > 0) {
            prop.setValueAtTime(comp.time, value);
        } else {
            prop.setValue(value);
        }
    }

    function matchTransform(layer, reference) {
        var originalParent = layer.parent;
        layer.parent = null;

        var originalRefParent = reference.parent;
        reference.parent = null;

        setPropValue(layer.position, reference.position.value);
        if (reference.threeDLayer) {
            setPropValue(layer.orientation, reference.orientation.value);
            setPropValue(layer.xRotation, reference.xRotation.value);
            setPropValue(layer.yRotation, reference.yRotation.value);
            setPropValue(layer.zRotation, reference.zRotation.value);
        } else {
            setPropValue(layer.rotation, reference.rotation.value);
        }
        setPropValue(layer.scale, reference.scale.value);

        layer.parent = originalParent;
        reference.parent = originalRefParent;
    }

    // Smart parenting logic
    for (var i = 0; i < layers.length - 1; i++) {
        var layer = layers[i];
        var shouldParent = false;

        if (layer.parent == null || layer.parent === master || !selectedLookup[layer.parent.index]) {
            shouldParent = true;
        }

        if (shouldParent) {
            matchTransform(layer, master);
            layer.parent = master;
        }
    }

    master.parent = originalMasterParent;

    // === Ctrl pressed: replace all layers with master ===
    if (ctrlPressed) {
        for (var i = 0; i < layers.length - 1; i++) { // skip master
            var layer = layers[i];

            // Duplicate master
            var copy = master.duplicate();

            // Match world transform of the original layer
            matchTransform(copy, layer);

            // Remove original layer
            layer.remove();
        }
    }

    app.endUndoGroup();

})();
