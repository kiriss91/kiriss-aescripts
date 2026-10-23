// ---------------------------------------------------------
// Search for specific properties & effects (recursive)
// Shows results in a NON-BLOCKING floating window
// ---------------------------------------------------------
(function searchPropertiesRecursively() {

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel) ? thisObj : new Window("palette", "Property Finder", undefined, {resizeable:true});

        win.orientation = "column";
        win.alignChildren = ["fill","top"];

        var drop = win.add("dropdownlist", undefined, [
            "Text Path (Path Options)",
            "Shape Offset Path (Offset Path)"
        ]);
        drop.selection = 0;

        var btn = win.add("button", undefined, "Search");

        btn.onClick = function() {
            if (!app.project || !app.project.activeItem || !(app.project.activeItem instanceof CompItem)) {
                showResultsWindow(["Please select a composition first."]);
                return;
            }

            var comp = app.project.activeItem;
            var selection = drop.selection.index;
            var targetType = (selection === 0) ? "TEXT_PATH" : "OFFSET_PATH";

            var results = [];
            app.beginUndoGroup("Search Properties");
            scanComp(comp, results, targetType);
            app.endUndoGroup();

            if (results.length === 0) {
                showResultsWindow(["No matches found."]);
            } else {
                showResultsWindow(results);
            }
        };

        win.layout.layout(true);
        return win;
    }

    // -----------------------------------------------------
    // Recursively scan a comp
    // -----------------------------------------------------
    function scanComp(comp, results, targetType) {
        for (var i = 1; i <= comp.numLayers; i++) {

            var lyr = comp.layer(i);

            // ---- FIXED TEXT-PATH SEARCH ----
            if (targetType === "TEXT_PATH" && lyr.property("ADBE Text Properties")) {

                var pathOpts = lyr.property("ADBE Text Properties").property("ADBE Text Path Options");
                if (pathOpts) {
                    var pathProp = pathOpts.property("ADBE Text Path");
                    if (pathProp && pathProp.value) {
                        results.push(
                            comp.name +
                            " -> Layer " + lyr.name +
                            " (index " + i + ") -> Text Path"
                        );
                    }
                }
            }

            // ---- Shape Offset Path ----
            if (targetType === "OFFSET_PATH" && lyr.matchName === "ADBE Vector Layer") {
                scanShapeLayerForOffset(lyr, comp, i, results);
            }

            // ---- Precomps ----
            if (lyr.source && lyr.source instanceof CompItem) {
                scanComp(lyr.source, results, targetType);
            }
        }
    }

    // -----------------------------------------------------
    // Shape Offset Path Scanner
    // -----------------------------------------------------
    function scanShapeLayerForOffset(layer, comp, layerIndex, results) {

        function scanGroup(group) {
            for (var j = 1; j <= group.numProperties; j++) {
                var prop = group.property(j);

                if (prop.matchName === "ADBE Vector Filter - Offset") {
                    results.push(
                        comp.name + " -> Layer " + layer.name +
                        " (index " + layerIndex + ") -> Offset Path"
                    );
                }

                if (prop.numProperties > 0) scanGroup(prop);
            }
        }

        var contents = layer.property("ADBE Root Vectors Group");
        if (contents) scanGroup(contents);
    }

    // -----------------------------------------------------
    // NON-BLOCKING RESULTS WINDOW
    // -----------------------------------------------------
    function showResultsWindow(lines) {
        var w = new Window("palette", "Search Results", undefined, {resizeable:true});
        w.orientation = "column";
        w.alignChildren = ["fill","fill"];

        var list = w.add("edittext", undefined, lines.join("\n"), {
            multiline:true,
            readonly:true,
            scrolling:true
        });

        list.minimumSize.height = 300;
        list.minimumSize.width = 500;

        var closeBtn = w.add("button", undefined, "Close");
        closeBtn.onClick = function(){ w.close(); };

        w.center();
        w.show();
    }

    // -----------------------------------------------------
    // Build and show main UI
    // -----------------------------------------------------
    var ui = buildUI(this);
    if (ui instanceof Window) ui.center(), ui.show();

})();
