{
    app.beginUndoGroup("Hide/Show All Shape Fills & Strokes");

    var comp = app.project.activeItem;

    if (!(comp && comp instanceof CompItem)) {
        alert("Please open a composition and select shape layers.");
    } else {

        var keys = ScriptUI.environment.keyboardState;
        var ctrlPressed = keys.ctrlKey || keys.metaKey; // Cmd on Mac

        var selLayers = comp.selectedLayers;

        if (selLayers.length === 0) {
            alert("Please select at least one layer.");
        } else {

            function isFill(prop) {
                return prop.matchName === "ADBE Vector Graphic - Fill" ||
                       prop.matchName === "ADBE Vector Graphic - G-Fill";
            }

            function isStroke(prop) {
                return prop.matchName === "ADBE Vector Graphic - Stroke" ||
                       prop.matchName === "ADBE Vector Graphic - G-Stroke";
            }

            function collectPaintOps(contentsProp, arr) {
                if (!contentsProp) return;

                for (var i = 1; i <= contentsProp.numProperties; i++) {
                    var p = contentsProp.property(i);

                    if (isFill(p) || isStroke(p)) {
                        arr.push(p);
                    }

                    if (p.matchName === "ADBE Vector Group") {
                        var nestedContents = p.property("Contents");
                        if (nestedContents) {
                            collectPaintOps(nestedContents, arr);
                        }
                    }
                }
            }

            // Apply visibility
            for (var l = 0; l < selLayers.length; l++) {
                var layer = selLayers[l];

                if (layer.matchName === "ADBE Vector Layer") {
                    var allOps = [];
                    collectPaintOps(layer.property("Contents"), allOps);

                    for (var j = 0; j < allOps.length; j++) {
                        allOps[j].enabled = ctrlPressed; 
                        // Ctrl pressed → true (show)
                        // Normal → false (hide)
                    }
                }
            }
        }
    }

    app.endUndoGroup();
}