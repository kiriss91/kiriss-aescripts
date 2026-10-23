// UI: Padding + Roundness version
// Select a Text Layer AND the "Rectangle Path 1" property, then run.

(function () {

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ?
            thisObj :
            new Window("palette", "Text → Rectangle", undefined, {resizeable: false});

        win.alignChildren = "left";

        // PADDING
        var gPad = win.add("group");
        gPad.add("statictext", undefined, "Padding:");
        var padInput = gPad.add("edittext", undefined, "10");
        padInput.characters = 5;

        // ROUNDNESS
        var gRound = win.add("group");
        gRound.add("statictext", undefined, "Roundness:");
        var roundInput = gRound.add("edittext", undefined, "8");
        roundInput.characters = 5;

        // APPLY BUTTON
        var btn = win.add("button", undefined, "Apply");

        btn.onClick = function () {
            app.beginUndoGroup("Rectangle Adjust from Text");

            var comp = app.project.activeItem;
            if (!comp || !(comp instanceof CompItem)) {
                alert("Open a composition first.");
                app.endUndoGroup();
                return;
            }

            var selLayers = comp.selectedLayers;
            var selProps = comp.selectedProperties;

            // TEXT LAYER
            var textLayer = null;
            for (var i = 0; i < selLayers.length; i++) {
                if (selLayers[i].property("ADBE Text Properties")) {
                    textLayer = selLayers[i];
                    break;
                }
            }
            if (!textLayer) {
                alert("Select a text layer.");
                app.endUndoGroup();
                return;
            }

            // RECTANGLE PATH PROPERTY
            var rectPath = null;
            for (var p = 0; p < selProps.length; p++) {
                if (selProps[p].matchName === "ADBE Vector Shape - Rect") {
                    rectPath = selProps[p];
                    break;
                }
            }
            if (!rectPath) {
                alert("Select the 'Rectangle Path 1' property.");
                app.endUndoGroup();
                return;
            }

            // READ UI VALUES
            var pad = parseFloat(padInput.text);
            var round = parseFloat(roundInput.text);
            if (isNaN(pad)) pad = 0;
            if (isNaN(round)) round = 0;

            // RECTANGLE PROPERTIES
            var sizeProp = rectPath.property("ADBE Vector Rect Size");
            var roundProp = rectPath.property("ADBE Vector Rect Roundness");

            if (!sizeProp || !roundProp) {
                alert("Size or Roundness property missing.");
                app.endUndoGroup();
                return;
            }

            // MEASURE TEXT
            var r = textLayer.sourceRectAtTime(comp.time, false);
            var textWidth = r.width;

            // APPLY SIZE
            var oldSize = sizeProp.value;
            var newWidth = textWidth + pad * 2;

            sizeProp.setValue([newWidth, oldSize[1]]);

            // APPLY ROUNDNESS
            roundProp.setValue(round);

            app.endUndoGroup();
        };

        if (win instanceof Window) win.center();
        win.show();
        return win;
    }

    buildUI(this);

})();
