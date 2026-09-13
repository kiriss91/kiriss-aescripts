// Layer Tool Suite
// After Effects ExtendScript

(function layerTool(thisObj) {

    function buildUI(thisObj) {

        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Layer Tool Suite", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 12;
        win.margins = 16;

        // =========================================================
        // REMOVE PHRASE SECTION
        // =========================================================

        win.add("statictext", undefined, "Remove Phrase From ALL Layers");

        var removeInput = win.add("edittext", undefined, "");
        removeInput.characters = 35;

        var removeBtn = win.add("button", undefined, "Remove Phrase");

        win.add("panel");

        // =========================================================
        // RENAME SECTION
        // =========================================================

        win.add("statictext", undefined, "Rename Selected Layers");

        var prefixInput = win.add("edittext", undefined, "");
        prefixInput.characters = 35;

        var suffixInput = win.add("edittext", undefined, "");
        suffixInput.characters = 35;

        var appendCheckbox = win.add("checkbox", undefined, "Append to existing name");
        appendCheckbox.value = true;

        var renameBtn = win.add("button", undefined, "Rename Layers");

        win.add("panel");

        // =========================================================
        // SELECT SECTION
        // =========================================================

        win.add("statictext", undefined, "Select Layers (Regex)");

        var patternInput = win.add("edittext", undefined, "conL\\d+.*\\[1\\.1\\.2\\]");
        patternInput.characters = 35;

        var selectBtn = win.add("button", undefined, "Select Matching Layers");

        // =========================================================
        // REMOVE PHRASE ACTION
        // =========================================================

        removeBtn.onClick = function () {

            var comp = app.project.activeItem;

            if (!(comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var phrase = removeInput.text;

            if (!phrase) {
                alert("Enter a phrase to remove.");
                return;
            }

            app.beginUndoGroup("Remove Phrase");

            for (var i = 1; i <= comp.numLayers; i++) {

                var lyr = comp.layer(i);

                if (lyr.name.indexOf(phrase) !== -1) {
                    lyr.name = lyr.name.split(phrase).join("");
                }
            }

            app.endUndoGroup();
        };

        // =========================================================
        // RENAME ACTION
        // =========================================================

        renameBtn.onClick = function () {

            var comp = app.project.activeItem;

            if (!(comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var layers = comp.selectedLayers;

            if (layers.length === 0) {
                alert("No layers selected.");
                return;
            }

            app.beginUndoGroup("Rename Layers");

            for (var i = 0; i < layers.length; i++) {

                var lyr = layers[i];

                if (appendCheckbox.value) {
                    lyr.name = prefixInput.text + lyr.name + suffixInput.text;
                } else {
                    lyr.name = prefixInput.text + suffixInput.text;
                }
            }

            app.endUndoGroup();
        };

        // =========================================================
        // SELECT ACTION
        // =========================================================

        selectBtn.onClick = function () {

            var comp = app.project.activeItem;

            if (!(comp instanceof CompItem)) {
                alert("Please select a composition.");
                return;
            }

            var patternText = patternInput.text;

            if (!patternText) {
                alert("Enter a regex pattern.");
                return;
            }

            var regex;

            try {
                regex = new RegExp(patternText);
            } catch (err) {
                alert("Invalid regex: " + err.toString());
                return;
            }

            app.beginUndoGroup("Select Matching Layers");

            var found = 0;

            for (var i = 1; i <= comp.numLayers; i++) {

                var lyr = comp.layer(i);

                if (regex.test(lyr.name)) {
                    lyr.selected = true;
                    found++;
                }
            }

            app.endUndoGroup();

            if (found === 0) {
                alert("No matching layers found.");
            }
        };

        win.layout.layout(true);

        return win;
    }

    var ui = buildUI(thisObj);

    if (ui instanceof Window) {
        ui.center();
        ui.show();
    }

})(this);