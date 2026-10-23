// simple_addTextToEssentialGraphics.jsx
// Creates one text layer and adds Source Text to Essential Graphics

(function () {
    app.beginUndoGroup("Create Text Layer + Add to Essential Graphics");

    var proj = app.project;
    if (!proj) {
        alert("No project open.");
        return;
    }

    // Use the active composition
    var comp = proj.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Please select or open a composition.");
        return;
    }

    // Name of layer
    var layerName = "My Text Layer";

    // Check if it already exists
    var layer = null;
    for (var i = 1; i <= comp.numLayers; i++) {
        if (comp.layer(i).name === layerName) {
            layer = comp.layer(i);
            break;
        }
    }

    // Create text layer if needed
    if (!layer) {
        layer = comp.layers.addText("Hello World");
        layer.name = layerName;

        // Format text
        var td = layer.text.sourceText.value;
        td.fontSize = 60;
        td.applyFill = true;
        td.fillColor = [1, 1, 1];
        layer.text.sourceText.setValue(td);

        layer.transform.position.setValue([200, 200]);
    }

    // Try to add to Essential Graphics
    try {
        if (layer.property("Source Text").canAddToMotionGraphicsTemplate(comp)) {
            layer.property("Source Text")
                 .addToMotionGraphicsTemplateAs(comp, "Custom Text Control");
        } else {
            alert("Cannot add Source Text to Essential Graphics.");
        }
    } catch (err) {
        alert("Error adding to Essential Graphics:\n" + err.toString());
    }

    app.endUndoGroup();
})();
