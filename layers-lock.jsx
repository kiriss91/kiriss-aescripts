{
app.beginUndoGroup("Lock / Unlock Layers");

var comp = app.project.activeItem;

if (comp instanceof CompItem) {

    var keys = ScriptUI.environment.keyboardState;
    var ctrlDown = keys.ctrlKey || keys.metaKey;

    if (ctrlDown) {
        // UNLOCK ALL LAYERS
        for (var i = 1; i <= comp.numLayers; i++) {
            comp.layer(i).locked = false;
        }

    } else {
        // LOCK SELECTED LAYERS
        var layers = comp.selectedLayers;

        if (layers.length === 0) {
            alert("Please select at least one layer.");
        } else {
            for (var j = 0; j < layers.length; j++) {
                layers[j].locked = true;
            }
        }
    }

} else {
    alert("Please open a composition.");
}

app.endUndoGroup();
}