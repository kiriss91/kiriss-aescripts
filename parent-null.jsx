// After Effects Script: Create Midpoint Null or Single-Layer Null at Anchor
// Parent selected layers to the new null, preserving hierarchy if possible
// Null uses same label as first selected layer
// Single-layer case preserves original parent and places null above layer
// Multiple layers: If all share the same parent, insert null between them and parent
// NEW: Nothing selected → creates "Center Null" at exact comp center
// NEW: Null is trimmed to match layer timing

app.beginUndoGroup("Create Midpoint / Single-Layer / Center Null + Auto Parent");

var comp = app.project.activeItem;

if (comp && comp instanceof CompItem) {

    var selectedLayers = comp.selectedLayers;

    if (selectedLayers.length >= 1) {

        var nullLabel = selectedLayers[0].label; 
        var maxDimensions = 2;

        // Detect if any layer is 3D
        for (var i = 0; i < selectedLayers.length; i++) {
            if (selectedLayers[i].threeDLayer) {
                maxDimensions = 3;
                break;
            }
        }

        // ================================================================
        // SINGLE LAYER
        // ================================================================
        if (selectedLayers.length === 1) {

            var layer = selectedLayers[0];
            var originalParent = layer.parent;
            var is3D = layer.threeDLayer;

            var nullLayer = comp.layers.addNull();
            nullLayer.name = layer.name + " Null";
            nullLayer.threeDLayer = is3D;
            nullLayer.label = nullLabel;

            // Trim to match layer
            nullLayer.inPoint = layer.inPoint;
            nullLayer.outPoint = layer.outPoint;

            nullLayer.moveBefore(layer);

            var anchor = layer.transform.anchorPoint.value;
            var anchorStr = "[" + anchor.join(",") + "]";
            var expr = "thisComp.layer(" + layer.index + ")." +
                       (is3D ? "toWorld" : "toComp") +
                       "(" + anchorStr + ");";

            if (!is3D) {
                expr = "var p = " + expr + "; [p[0], p[1], 0];";
            }

            nullLayer.transform.position.expression = expr;
            nullLayer.transform.position.setValue(nullLayer.transform.position.value);
            nullLayer.transform.position.expression = "";

            if (originalParent) {
                nullLayer.parent = originalParent;
            }

            layer.parent = nullLayer;
            nullLayer.selected = true;

        } else {

        // ================================================================
        // MULTIPLE LAYERS
        // ================================================================

            // ---- Calculate time span ----
            var minIn = selectedLayers[0].inPoint;
            var maxOut = selectedLayers[0].outPoint;

            for (var i = 1; i < selectedLayers.length; i++) {
                minIn = Math.min(minIn, selectedLayers[i].inPoint);
                maxOut = Math.max(maxOut, selectedLayers[i].outPoint);
            }

            // ---- Calculate midpoint position ----
            var minPos = [999999999, 999999999, 999999999];
            var maxPos = [-999999999, -999999999, -999999999];

            var tempNull = comp.layers.addNull();
            tempNull.name = "Temp Null";
            tempNull.threeDLayer = true;

            for (var i = 0; i < selectedLayers.length; i++) {

                var layer = selectedLayers[i];
                var is3D = layer.threeDLayer;
                var anchor = layer.transform.anchorPoint.value;
                var anchorStr = "[" + anchor.join(",") + "]";

                var expr = "thisComp.layer(" + layer.index + ")." +
                           (is3D ? "toWorld" : "toComp") +
                           "(" + anchorStr + ");";

                if (!is3D) {
                    expr = "var p = " + expr + "; [p[0], p[1], 0];";
                }

                tempNull.transform.position.expression = expr;
                var pos = tempNull.transform.position.value;

                minPos[0] = Math.min(minPos[0], pos[0]);
                maxPos[0] = Math.max(maxPos[0], pos[0]);
                minPos[1] = Math.min(minPos[1], pos[1]);
                maxPos[1] = Math.max(maxPos[1], pos[1]);

                if (maxDimensions === 3) {
                    minPos[2] = Math.min(minPos[2], pos[2]);
                    maxPos[2] = Math.max(maxPos[2], pos[2]);
                }
            }

            tempNull.remove();

            var midPos = [];
            midPos[0] = (minPos[0] + maxPos[0]) / 2;
            midPos[1] = (minPos[1] + maxPos[1]) / 2;
            if (maxDimensions === 3) {
                midPos[2] = (minPos[2] + maxPos[2]) / 2;
            }

            // ---- Create final null ----
            var nullLayer = comp.layers.addNull();
            nullLayer.name = "Midpoint Null";

            if (maxDimensions === 3) {
                nullLayer.threeDLayer = true;
            }

            nullLayer.label = nullLabel;
            nullLayer.transform.position.setValue(midPos);

            // Trim to cover all selected layers
            nullLayer.inPoint = minIn;
            nullLayer.outPoint = maxOut;

            // ---- Parent handling ----
            var commonParent = selectedLayers[0].parent;
            var allSameParent = true;

            for (var i = 1; i < selectedLayers.length; i++) {
                if (selectedLayers[i].parent !== commonParent) {
                    allSameParent = false;
                    break;
                }
            }

            if (allSameParent && commonParent !== null) {
                nullLayer.parent = commonParent;
            }

            for (var i = 0; i < selectedLayers.length; i++) {
                selectedLayers[i].parent = nullLayer;
            }

            // Move null above topmost selected layer
            var minIndex = selectedLayers[0].index;
            for (var i = 1; i < selectedLayers.length; i++) {
                minIndex = Math.min(minIndex, selectedLayers[i].index);
            }

            var topLayer = comp.layer(minIndex);
            nullLayer.moveBefore(topLayer);

            nullLayer.selected = true;
        }

    } else {

    // ================================================================
    // NOTHING SELECTED → CENTER NULL
    // ================================================================

        var nullLayer = comp.layers.addNull();
        nullLayer.name = "Center Null";
        nullLayer.transform.position.setValue([comp.width / 2, comp.height / 2]);

        // Span full comp duration
        nullLayer.inPoint = 0;
        nullLayer.outPoint = comp.duration;

        nullLayer.selected = true;
    }

}

app.endUndoGroup();