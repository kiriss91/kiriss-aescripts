(function () {

var comp = app.project.activeItem;
if (!(comp instanceof CompItem)) return;

var layers = comp.selectedLayers;
if (layers.length === 0) return;

var cti = comp.time;

var kb = ScriptUI.environment.keyboardState;
var shift = kb.shiftKey;
var ctrl = kb.ctrlKey;

var mode = "normal";

if (shift && !ctrl) mode = "labels";
if (ctrl && !shift) mode = "parents";

app.beginUndoGroup("Align Layers to CTI");


// ---------------- NORMAL MODE ----------------
if (mode === "normal") {

    for (var i = 0; i < layers.length; i++) {

        var l = layers[i];
        var shiftAmount = cti - l.inPoint;

        l.startTime += shiftAmount;
    }

}


// ---------------- LABEL MODE ----------------
if (mode === "labels") {

    var labelGroups = {};

    for (var i = 0; i < layers.length; i++) {

        var l = layers[i];
        var label = l.label;

        if (!labelGroups[label]) labelGroups[label] = [];
        labelGroups[label].push(l);

    }

    for (var key in labelGroups) {

        var group = labelGroups[key];
        var minIn = Infinity;

        for (var j = 0; j < group.length; j++) {
            minIn = Math.min(minIn, group[j].inPoint);
        }

        var shiftAmount = cti - minIn;

        for (var j = 0; j < group.length; j++) {
            group[j].startTime += shiftAmount;
        }

    }

}


// ---------------- PARENT MODE ----------------
if (mode === "parents") {

    var families = {};

    function getRoot(layer) {
        while (layer.parent) {
            layer = layer.parent;
        }
        return layer;
    }

    for (var i = 0; i < layers.length; i++) {

        var root = getRoot(layers[i]);
        var id = root.index;

        if (!families[id]) families[id] = [];
        families[id].push(layers[i]);

    }

    for (var key in families) {

        var group = families[key];
        var minIn = Infinity;

        for (var j = 0; j < group.length; j++) {
            minIn = Math.min(minIn, group[j].inPoint);
        }

        var shiftAmount = cti - minIn;

        for (var j = 0; j < group.length; j++) {
            group[j].startTime += shiftAmount;
        }

    }

}

app.endUndoGroup();

})();