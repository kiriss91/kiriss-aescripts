#target aftereffects

(function ReplaceCompGlobally(thisObj) {

    function getSelectedComps() {
        var selection = app.project.selection;
        var comps = [];
        var i;

        for (i = 0; i < selection.length; i++) {
            if (selection[i] instanceof CompItem) {
                comps.push(selection[i]);
            }
        }

        return comps;
    }

    function replaceCompEverywhere(statusText) {
        var comps = getSelectedComps();

        if (comps.length !== 2) {
            statusText.text = "Select exactly 2 comps";
            return;
        }

        // Project-panel selection order:
        // first selected comp = old/source
        // second selected comp = new/replacement
        var oldComp = comps[0];
        var newComp = comps[1];

        if (oldComp === newComp) {
            statusText.text = "Select 2 different comps";
            return;
        }

        var replaced = 0;
        var affectedComps = 0;
        var i, j;

        app.beginUndoGroup("Replace Comp Everywhere");

        try {
            for (i = 1; i <= app.project.numItems; i++) {
                var item = app.project.item(i);

                if (!(item instanceof CompItem)) {
                    continue;
                }

                var changedThisComp = false;

                for (j = 1; j <= item.numLayers; j++) {
                    var layer = item.layer(j);

                    // Only AVLayers can have a replaceable source.
                    if (!(layer instanceof AVLayer)) {
                        continue;
                    }

                    var source = null;

                    try {
                        source = layer.source;
                    } catch (sourceErr) {
                        source = null;
                    }

                    if (source === oldComp) {
                        try {
                            /*
                                replaceSource() keeps the existing layer itself:
                                transforms, effects, masks, timing, parenting,
                                switches, etc. remain on the layer while only
                                its source comp is replaced.
                            */
                            layer.replaceSource(newComp, false);
                            replaced++;
                            changedThisComp = true;
                        } catch (replaceErr) {
                            // Skip a layer if AE refuses replacement.
                        }
                    }
                }

                if (changedThisComp) {
                    affectedComps++;
                }
            }
        } finally {
            app.endUndoGroup();
        }

        statusText.text =
            oldComp.name + "  →  " + newComp.name +
            "   |   " + replaced + " replaced in " +
            affectedComps + " comp" +
            (affectedComps === 1 ? "" : "s");
    }

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window(
                "palette",
                "Replace Comp Everywhere",
                undefined,
                { resizeable: false }
            );

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 5;
        win.margins = 8;

        var replaceBtn = win.add(
            "button",
            undefined,
            "Replace"
        );

        replaceBtn.preferredSize = [170, 27];

        var hint = win.add(
            "statictext",
            undefined,
            "1st selected → 2nd selected"
        );

        hint.alignment = ["fill", "top"];

        var statusText = win.add(
            "statictext",
            undefined,
            "Ready"
        );

        statusText.alignment = ["fill", "top"];
        statusText.characters = 38;

        replaceBtn.onClick = function () {
            try {
                replaceCompEverywhere(statusText);
            } catch (err) {
                statusText.text = "Replace failed";
            }
        };

        win.layout.layout(true);
        win.layout.resize();

        return win;
    }

    var panel = buildUI(thisObj);

    if (panel instanceof Window) {
        panel.center();
        panel.show();
    }

})(this);
