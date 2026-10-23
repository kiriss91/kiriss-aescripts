(function (thisObj) {

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Rank Offset Tool", undefined, { resizeable: false });

        win.orientation = "column";
        win.alignChildren = "fill";

        var panel = win.add("panel", undefined, "Settings");
        panel.orientation = "column";
        panel.alignChildren = "left";
        panel.margins = 15;

        // Offset Y
        var offsetGroup = panel.add("group");
        offsetGroup.add("statictext", undefined, "Offset Y:");
        var offsetField = offsetGroup.add("edittext", undefined, "150");
        offsetField.characters = 6;

        // Ease frames
        var easeGroup = panel.add("group");
        easeGroup.add("statictext", undefined, "Ease Frames:");
        var easeField = easeGroup.add("edittext", undefined, "20");
        easeField.characters = 6;

        // NEW: Ignore Offset checkbox
        var ignoreOffset = panel.add("checkbox", undefined, "Ignore Offset");
        ignoreOffset.value = true; // default checked

        // Run button
        var runBtn = win.add("button", undefined, "Apply Ranking Offset");
        runBtn.alignment = "fill";

        runBtn.onClick = function () {

            var comp = app.project.activeItem;
            if (!(comp instanceof CompItem)) {
                alert("Please select layers inside a composition.");
                return;
            }

            var layers = comp.selectedLayers;
            if (layers.length === 0) {
                alert("No layers selected.");
                return;
            }

            var offsetY = Number(offsetField.text);
            if (isNaN(offsetY)) { alert("Offset must be a number."); return; }

            var easeFrames = Number(easeField.text);
            if (isNaN(easeFrames)) { alert("Ease Frames must be a number."); return; }

            app.beginUndoGroup("Ranking Offset Tool");

            // Collect EP values
            var result = [];
            for (var i = 0; i < layers.length; i++) {
                var layer = layers[i];
                var epGroup = layer.essentialProperty;
                if (!epGroup) continue;
                var prop = epGroup.property("value");
                if (!prop) continue;

                result.push({ layer: layer, value: prop.value, prop: prop });
            }
            if (result.length === 0) { 
                alert("No EP named 'value' found on selected layers."); 
                app.endUndoGroup();
                return; 
            }

            // Sort highest → lowest
            result.sort(function (a, b) { return b.value - a.value; });

            // ------------------------------------------------------
            // OFFSET LAYERS (only if checkbox is OFF)
            // ------------------------------------------------------
            if (!ignoreOffset.value) {
                for (var r = 0; r < result.length; r++) {
                    var layer = result[r].layer;
                    var pos = layer.property("Position").value;
                    if (r > 0) layer.property("Position").setValue([pos[0], pos[1] + (offsetY * r)]);
                }
            }

            // ------------------------------------------------------
            // REST OF YOUR CROSSING DETECTION LOGIC (unchanged)
            // ------------------------------------------------------
            var lastOrder = {};
            var lastNulls = {};
            var crossingCount = 0;
            var warnings = [];

            var fps = comp.frameRate;
            var frameStep = 1 / fps;
            var totalFrames = Math.floor(comp.duration * fps);

            var easeIn = new KeyframeEase(40, 98);
            var easeOut = new KeyframeEase(40, 98);

            for (var i = 0; i < result.length; i++) {
                for (var j = i + 1; j < result.length; j++) {
                    var A = result[i], B = result[j];
                    var vA = A.prop.valueAtTime(0, false);
                    var vB = B.prop.valueAtTime(0, false);

                    if (vA == vB) lastOrder[A.layer.id + "_" + B.layer.id] = 0;
                    else if (vA > vB) lastOrder[A.layer.id + "_" + B.layer.id] = 1;
                    else lastOrder[A.layer.id + "_" + B.layer.id] = -1;
                }
            }

            for (var f = 1; f <= totalFrames; f++) {
                var time = f * frameStep;

                for (var i = 0; i < result.length; i++) {
                    for (var j = i + 1; j < result.length; j++) {

                        var A = result[i], B = result[j];
                        var idKey = A.layer.id + "_" + B.layer.id;

                        var vA = A.prop.valueAtTime(time, false);
                        var vB = B.prop.valueAtTime(time, false);
                        var currentOrder = (vA == vB) ? 0 : (vA > vB ? 1 : -1);
                        var previousOrder = lastOrder[idKey];

                        if (currentOrder != 0 && previousOrder != 0 && currentOrder != previousOrder) {

                            crossingCount++;
                            var crossingFrame = time;
                            var upLayer = (currentOrder == -1) ? A.layer : B.layer;
                            var downLayer = (currentOrder == -1) ? B.layer : A.layer;
                            warnings.push(upLayer.name + " passes " + downLayer.name + " at frame " + f);

                            var upParent = lastNulls[upLayer.id] || upLayer;
                            var nullUp = comp.layers.addNull();
                            nullUp.name = upLayer.name + "_up_" + crossingCount;
                            nullUp.moveBefore(upParent);
                            nullUp.startTime = 0;
                            nullUp.inPoint = crossingFrame;
                            nullUp.outPoint = comp.duration;

                            var upPos = upLayer.property("Position").valueAtTime(crossingFrame, false);
                            nullUp.property("Position").setValueAtTime(crossingFrame, upPos);
                            nullUp.property("Position").setTemporalEaseAtKey(1, [easeIn], [easeOut]);
                            nullUp.property("Position").setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER);

                            var upFrame2 = crossingFrame + (easeFrames / fps);
                            var upPos2 = [upPos[0], upPos[1] + offsetY];
                            nullUp.property("Position").setValueAtTime(upFrame2, upPos2);

                            if (lastNulls[upLayer.id]) lastNulls[upLayer.id].parent = nullUp;
                            else upLayer.parent = nullUp;
                            lastNulls[upLayer.id] = nullUp;

                            var downParent = lastNulls[downLayer.id] || downLayer;
                            var nullDown = comp.layers.addNull();
                            nullDown.name = downLayer.name + "_down_" + crossingCount;
                            nullDown.moveBefore(downParent);
                            nullDown.startTime = 0;
                            nullDown.inPoint = crossingFrame;
                            nullDown.outPoint = comp.duration;

                            var downPos = downLayer.property("Position").valueAtTime(crossingFrame, false);
                            nullDown.property("Position").setValueAtTime(crossingFrame, downPos);
                            nullDown.property("Position").setTemporalEaseAtKey(1, [easeIn], [easeOut]);
                            nullDown.property("Position").setInterpolationTypeAtKey(1, KeyframeInterpolationType.BEZIER);

                            var downFrame2 = crossingFrame + (easeFrames / fps);
                            var downPos2 = [downPos[0], downPos[1] - offsetY];
                            nullDown.property("Position").setValueAtTime(downFrame2, downPos2);

                            if (lastNulls[downLayer.id]) lastNulls[downLayer.id].parent = nullDown;
                            else downLayer.parent = nullDown;
                            lastNulls[downLayer.id] = nullDown;
                        }

                        lastOrder[idKey] = currentOrder;
                    }
                }
            }

            if (warnings.length > 0)
                alert("Crossings detected (" + crossingCount + "):\n\n" + warnings.join("\n"));
            else
                alert("Done! No crossings found.");

            app.endUndoGroup();

        };

        if (win instanceof Window) win.center();
        return win;
    }

    var ui = buildUI(thisObj);
    if (ui instanceof Window) ui.show();

})(this);
