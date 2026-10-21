(function RandomTransformTool(thisObj) {

    function buildUI(thisObj) {

        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Random Transform Tool", undefined, { resizeable: true });

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];

        // ---------------- CHECKBOXES ----------------
        var checkGroup = win.add("panel", undefined, "Affect Properties");
        checkGroup.orientation = "column";
        checkGroup.alignChildren = "left";

        var posCheck = checkGroup.add("checkbox", undefined, "Position");
        posCheck.value = true;

        var anchorCheck = checkGroup.add("checkbox", undefined, "Anchor Point");
        anchorCheck.value = false;

        // ---------------- X ----------------
        var xGroup = win.add("panel", undefined, "X Range");
        xGroup.orientation = "row";

        xGroup.add("statictext", undefined, "Min:");
        var xMin = xGroup.add("edittext", undefined, "-200");
        xMin.characters = 8;

        xGroup.add("statictext", undefined, "Max:");
        var xMax = xGroup.add("edittext", undefined, "200");
        xMax.characters = 8;

        // ---------------- Y ----------------
        var yGroup = win.add("panel", undefined, "Y Range");
        yGroup.orientation = "row";

        yGroup.add("statictext", undefined, "Min:");
        var yMin = yGroup.add("edittext", undefined, "-200");
        yMin.characters = 8;

        yGroup.add("statictext", undefined, "Max:");
        var yMax = yGroup.add("edittext", undefined, "200");
        yMax.characters = 8;

        // ---------------- Z ----------------
        var zGroup = win.add("panel", undefined, "Z Range");
        zGroup.orientation = "row";

        zGroup.add("statictext", undefined, "Min:");
        var zMin = zGroup.add("edittext", undefined, "-200");
        zMin.characters = 8;

        zGroup.add("statictext", undefined, "Max:");
        var zMax = zGroup.add("edittext", undefined, "200");
        zMax.characters = 8;

        var btn = win.add("button", undefined, "Apply Random Transform");

        function rand(min, max) {
            return min + Math.random() * (max - min);
        }

        function applyRandom(prop, current, dx, dy, dz, t) {

            if (!prop) return;

            if (prop.numKeys > 0) {
                prop.setValueAtTime(t, [
                    current[0] + dx,
                    current[1] + dy,
                    (current.length === 3 ? current[2] + dz : undefined)
                ]);
            } else {
                prop.setValue([
                    current[0] + dx,
                    current[1] + dy,
                    (current.length === 3 ? current[2] + dz : undefined)
                ]);
            }
        }

        btn.onClick = function () {

            var comp = app.project.activeItem;

            if (!(comp instanceof CompItem)) {
                alert("Open a composition first.");
                return;
            }

            var layers = comp.selectedLayers;

            if (!layers || layers.length === 0) {
                alert("Select at least one layer.");
                return;
            }

            if (!posCheck.value && !anchorCheck.value) {
                alert("Select Position or Anchor Point.");
                return;
            }

            var xmin = parseFloat(xMin.text);
            var xmax = parseFloat(xMax.text);

            var ymin = parseFloat(yMin.text);
            var ymax = parseFloat(yMax.text);

            var zmin = parseFloat(zMin.text);
            var zmax = parseFloat(zMax.text);

            var t = comp.time;

            app.beginUndoGroup("Random Transform Tool");

            for (var i = 0; i < layers.length; i++) {

                var layer = layers[i];

                try {

                    var dx = rand(xmin, xmax);
                    var dy = rand(ymin, ymax);
                    var dz = rand(zmin, zmax);

                    // ---------------- POSITION ----------------
                    if (posCheck.value) {

                        var pos = layer.property("ADBE Transform Group").property("ADBE Position");
                        if (pos) {
                            var v = pos.value;

                            if (v.length === 2) {
                                if (pos.numKeys > 0) {
                                    pos.setValueAtTime(t, [v[0] + dx, v[1] + dy]);
                                } else {
                                    pos.setValue([v[0] + dx, v[1] + dy]);
                                }
                            } else {
                                if (pos.numKeys > 0) {
                                    pos.setValueAtTime(t, [v[0] + dx, v[1] + dy, v[2] + dz]);
                                } else {
                                    pos.setValue([v[0] + dx, v[1] + dy, v[2] + dz]);
                                }
                            }
                        }
                    }

                    // ---------------- ANCHOR POINT ----------------
                    if (anchorCheck.value) {

                        var ap = layer.property("ADBE Transform Group").property("ADBE Anchor Point");

                        if (ap) {

                            var v2 = ap.value;

                            if (ap.numKeys > 0) {
                                ap.setValueAtTime(t, [v2[0] + dx, v2[1] + dy, v2[2] + dz]);
                            } else {
                                ap.setValue([v2[0] + dx, v2[1] + dy, v2[2] + dz]);
                            }
                        }
                    }

                } catch (err) {
                    alert("Error on layer: " + layer.name + "\n" + err.toString());
                }
            }

            app.endUndoGroup();
        };

        win.layout.layout(true);
        return win;
    }

    var panel = buildUI(thisObj);

    if (panel instanceof Window) {
        panel.center();
        panel.show();
    }

})(this);