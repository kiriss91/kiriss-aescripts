{
    function getSelection() {
        var comp = app.project.activeItem;

        // 1️⃣ Selected Effects (Effect Controls panel)
        if (comp && comp instanceof CompItem && comp.selectedLayers.length === 1) {
            var selectedProps = comp.selectedProperties;
            if (selectedProps.length > 0) {
                var effects = [];
                for (var i = 0; i < selectedProps.length; i++) {
                    if (selectedProps[i].parentProperty &&
                        selectedProps[i].parentProperty.matchName === "ADBE Effect Parade") {
                        effects.push(selectedProps[i]);
                    }
                }
                if (effects.length > 0) {
                    return { type: "effects", items: effects };
                }
            }
        }

        // 2️⃣ Selected Layers
        if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
            return { type: "layers", items: comp.selectedLayers };
        }

        // 3️⃣ Selected Project Items
        if (app.project.selection.length > 0) {
            return { type: "project", items: app.project.selection };
        }

        return null;
    }

    var selectionData = getSelection();

    if (!selectionData) {
        alert("Select Layers, Effects, or Project Items first.");
    } else {

        var win = new Window("dialog", "Smart Batch Rename PRO");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

        // Prefix
        var prefixGroup = win.add("group");
        prefixGroup.add("statictext", undefined, "Prefix:");
        var prefixInput = prefixGroup.add("edittext", undefined, "");
        prefixInput.characters = 25;

        // Base Name
        var nameGroup = win.add("group");
        nameGroup.add("statictext", undefined, "Base Name:");
        var nameInput = nameGroup.add("edittext", undefined, "");
        nameInput.characters = 25;
        nameInput.active = true;

        // Suffix
        var suffixGroup = win.add("group");
        suffixGroup.add("statictext", undefined, "Suffix:");
        var suffixInput = suffixGroup.add("edittext", undefined, "");
        suffixInput.characters = 25;

        // Start Index
        var startGroup = win.add("group");
        startGroup.add("statictext", undefined, "Start Index:");
        var startInput = startGroup.add("edittext", undefined, "1");
        startInput.characters = 5;

        // Padding (default 2)
        var padGroup = win.add("group");
        padGroup.add("statictext", undefined, "Padding:");
        var padInput = padGroup.add("edittext", undefined, "2");
        padInput.characters = 5;

        // Buttons
        var btnGroup = win.add("group");
        btnGroup.alignment = "center";

        var cancelBtn = btnGroup.add("button", undefined, "Esc");
        var renameBtn = btnGroup.add("button", undefined, "Enter (OK)");

        function renameItems() {

            var prefix = prefixInput.text;
            var baseName = nameInput.text;
            var suffix = suffixInput.text;

            if (!baseName) {
                alert("Please enter a base name.");
                return;
            }

            var startIndex = parseInt(startInput.text, 10);
            if (isNaN(startIndex)) startIndex = 1;

            var padding = parseInt(padInput.text, 10);
            if (isNaN(padding) || padding < 1) padding = 2;

            var items = selectionData.items;

            app.beginUndoGroup("Smart Batch Rename PRO");

            for (var i = 0; i < items.length; i++) {
                var num = startIndex + i;
                var padded = ("000000000" + num).slice(-padding);
                items[i].name = prefix + baseName + padded + suffix;
            }

            app.endUndoGroup();
            win.close();
        }

        renameBtn.onClick = renameItems;

        cancelBtn.onClick = function () {
            win.close();
        };

        win.defaultElement = renameBtn;

        win.onKeyDown = function (k) {
            if (k.keyName === "Escape") {
                win.close();
            }
        };

        win.center();
        win.show();
    }
}