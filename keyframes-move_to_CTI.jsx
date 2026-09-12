(function () {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;var props = comp.selectedProperties;
if (props.length === 0) return;

var kb = ScriptUI.environment.keyboardState;
var shiftKey = kb.shiftKey;
var altKey = kb.altKey;
var ctrlKey = kb.ctrlKey || kb.metaKey;

var cti = comp.time;

app.beginUndoGroup("Align Keyframes with Modifiers");

var records = [];

// Collect all selected keyframes
for (var i = 0; i < props.length; i++) {
    var p = props[i];
    if (!(p instanceof Property) || p.numKeys === 0) continue;

    for (var k = 1; k <= p.numKeys; k++) {
        if (p.keySelected(k)) {
            records.push({
                prop: p,
                time: p.keyTime(k),
                value: p.keyValue(k),
                inType: p.keyInInterpolationType(k),
                outType: p.keyOutInterpolationType(k),
                inEase: p.keyInTemporalEase(k),
                outEase: p.keyOutTemporalEase(k),
                label: p.keyLabel(k),
                layerIndex: p.propertyGroup(p.propertyDepth).index
            });
        }
    }
}

if (records.length === 0) {
    app.endUndoGroup();
    return;
}

var mode;
if (altKey && shiftKey) {
    mode = "align_last_all";
} else if (shiftKey) {
    mode = "align_first_all";
} else if (altKey && ctrlKey) {
    mode = "align_last_per_layer";
} else if (ctrlKey) {
    mode = "align_first_per_layer";
} else if (altKey) {
    mode = "align_last_per_prop";
} else {
    mode = "align_first_per_prop";
}

// Set newTimes
if (mode === "align_first_per_prop" || mode === "align_last_per_prop") {
    // Group by prop using array
    var groups = [];
    var currentGroup = null;
    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (!currentGroup || currentGroup.prop !== r.prop) {
            currentGroup = {prop: r.prop, records: []};
            groups.push(currentGroup);
        }
        currentGroup.records.push(r);
    }

    // For each group
    for (var g = 0; g < groups.length; g++) {
        var group = groups[g].records;
        if (mode === "align_first_per_prop") {
            var minTime = Infinity;
            for (var j = 0; j < group.length; j++) {
                if (group[j].time < minTime) minTime = group[j].time;
            }
            var shift = cti - minTime;
        } else { // align_last_per_prop
            var maxTime = -Infinity;
            for (var j = 0; j < group.length; j++) {
                if (group[j].time > maxTime) maxTime = group[j].time;
            }
            var shift = cti - maxTime;
        }
        for (var j = 0; j < group.length; j++) {
            group[j].newTime = group[j].time + shift;
        }
    }
} else if (mode === "align_first_per_layer" || mode === "align_last_per_layer") {
    // Group by layer
    var layerMap = {};
    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        if (!layerMap[r.layerIndex]) layerMap[r.layerIndex] = [];
        layerMap[r.layerIndex].push(r);
    }

    // For each layer group
    for (var li in layerMap) {
        var group = layerMap[li];
        if (mode === "align_first_per_layer") {
            var minTime = Infinity;
            for (var j = 0; j < group.length; j++) {
                if (group[j].time < minTime) minTime = group[j].time;
            }
            var shift = cti - minTime;
        } else { // align_last_per_layer
            var maxTime = -Infinity;
            for (var j = 0; j < group.length; j++) {
                if (group[j].time > maxTime) maxTime = group[j].time;
            }
            var shift = cti - maxTime;
        }
        for (var j = 0; j < group.length; j++) {
            group[j].newTime = group[j].time + shift;
        }
    }
} else {
    // Compute overall min and max
    var minTime = Infinity;
    var maxTime = -Infinity;
    for (var i = 0; i < records.length; i++) {
        if (records[i].time < minTime) minTime = records[i].time;
        if (records[i].time > maxTime) maxTime = records[i].time;
    }
    var shift;
    if (mode === "align_first_all") {
        shift = cti - minTime;
    } else { // align_last_all
        shift = cti - maxTime;
    }
    for (var i = 0; i < records.length; i++) {
        records[i].newTime = records[i].time + shift;
    }
}

// REMOVE OLD KEYS using time-based method to avoid index issues
for (var i = records.length - 1; i >= 0; i--) {
    var r = records[i];
    var idx = r.prop.nearestKeyIndex(r.time);
    if (Math.abs(r.prop.keyTime(idx) - r.time) < comp.frameDuration / 2) {
        r.prop.removeKey(idx);
    }
}

// ADD NEW KEYS
records.sort(function(a, b) { return a.newTime - b.newTime; });

var newKeys = [];
for (var i = 0; i < records.length; i++) {
    var r = records[i];
    var newIndex = r.prop.addKey(r.newTime);
    r.prop.setValueAtKey(newIndex, r.value);
    r.prop.setInterpolationTypeAtKey(newIndex, r.inType, r.outType);
    r.prop.setTemporalEaseAtKey(newIndex, r.inEase, r.outEase);
    r.prop.setLabelAtKey(newIndex, r.label);
    newKeys.push({ prop: r.prop, index: newIndex });
}

// Reselect all new keys
for (var i = 0; i < newKeys.length; i++) {
    newKeys[i].prop.setSelectedAtKey(newKeys[i].index, true);
}

app.endUndoGroup();})();

