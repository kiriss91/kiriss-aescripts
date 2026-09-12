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

app.beginUndoGroup("Align OutPoints to CTI");

// ---------------- NORMAL MODE ----------------
if (mode === "normal") {
    for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        var move = cti - l.outPoint;
        l.startTime += move;
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
        var maxOut = -Infinity;
        for (var j = 0; j < group.length; j++) {
            maxOut = Math.max(maxOut, group[j].outPoint);
        }
        var move = cti - maxOut;
        for (var j = 0; j < group.length; j++) {
            group[j].startTime += move;
        }
    }
}

// ---------------- PARENT MODE ----------------
if (mode === "parents") {

    // Helper: get the topmost parent
    function getRoot(layer){
        while(layer.parent){
            layer = layer.parent;
        }
        return layer;
    }

    var families = [];

    for (var i = 0; i < layers.length; i++){
        var layer = layers[i];
        var root = getRoot(layer);

        // Check if this family already exists
        var found = false;
        for (var f = 0; f < families.length; f++){
            if (families[f].root === root){
                families[f].layers.push(layer);
                found = true;
                break;
            }
        }
        if (!found){
            families.push({
                root: root,
                layers: [layer]
            });
        }
    }

    // For each family, calculate shift based on the **most right outPoint**
    for (var f = 0; f < families.length; f++){
        var group = families[f].layers;
        var maxOut = -Infinity;
        for (var j = 0; j < group.length; j++){
            maxOut = Math.max(maxOut, group[j].outPoint);
        }
        var move = cti - maxOut;
        for (var j = 0; j < group.length; j++){
            group[j].startTime += move;
        }
    }
}

app.endUndoGroup();

})();