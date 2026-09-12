// After Effects Script: Create Individual Nulls at Each Layer's Anchor Point
// Each layer gets its own null above it and with the same label color
// Null inherits original parent, layer is parented to null
// NEW: Null is trimmed to match its layer timing

app.beginUndoGroup("Create Individual Anchor Nulls Above Layers");

var comp = app.project.activeItem;

if (comp && comp instanceof CompItem) {

    var selectedLayers = comp.selectedLayers;

    if (selectedLayers.length >= 1) {

        for (var i = 0; i < selectedLayers.length; i++) {

            var layer = selectedLayers[i];
            var originalParent = layer.parent; 
            var layerLabel = layer.label;

            // Unparent temporarily
            layer.parent = null;

            var is3D = layer.threeDLayer;

            // Create null
            var nullLayer = comp.layers.addNull();
            nullLayer.name = layer.name + " Null";
            nullLayer.threeDLayer = is3D;
            nullLayer.label = layerLabel;

            // ✅ Trim null to match layer timing
            nullLayer.inPoint = layer.inPoint;
            nullLayer.outPoint = layer.outPoint;

            // Evaluate layer anchor in world/comp space
            var anchor = layer.transform.anchorPoint.value;
            var anchorStr = "[" + anchor.join(",") + "]";

            var expr = "thisComp.layer(" + layer.index + ")." +
                       (is3D ? "toWorld" : "toComp") +
                       "(" + anchorStr + ");";

            if (!is3D) {
                expr = "var p = " + expr + "; [p[0], p[1], 0];";
            }

            nullLayer.transform.position.expression = expr;

            // Bake position and remove expression
            nullLayer.transform.position.setValue(nullLayer.transform.position.value);
            nullLayer.transform.position.expression = "";

            // Move null above the layer
            nullLayer.moveBefore(layer);

            // Restore parenting structure
            if (originalParent) {
                nullLayer.parent = originalParent;
            }

            layer.parent = nullLayer;
        }

    }

}

app.endUndoGroup();