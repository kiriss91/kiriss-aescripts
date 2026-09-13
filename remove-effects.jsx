app.beginUndoGroup("Remove All Effects From Selected Layers");

var comp = app.project.activeItem;

if (comp && comp instanceof CompItem) {
    var selectedLayers = comp.selectedLayers;

    if (selectedLayers.length > 0) {

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var effects = layer.property("ADBE Effect Parade");

            if (effects && effects.numProperties > 0) {
                // Remove effects from bottom to top
                for (var j = effects.numProperties; j >= 1; j--) {
                    effects.property(j).remove();
                }
            }
        }

    } else {
        alert("No layers selected.");
    }

} else {
    alert("Please select a composition.");
}

app.endUndoGroup();
