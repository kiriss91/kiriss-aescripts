(function () {
    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var props = comp.selectedProperties;
    if (props.length === 0) return;

    // Detect Ctrl (Win) / Cmd (Mac) key
    var ctrlPressed = ScriptUI.environment.keyboardState.ctrlKey;
    if ($.os.indexOf("Mac") !== -1) {
        ctrlPressed = ScriptUI.environment.keyboardState.metaKey;
    }

    app.beginUndoGroup("Align Keyframes to Layer OutPoint");

    var records = [];

    // collect all selected keyframes
    for (var i = 0; i < props.length; i++) {
        var p = props[i];
        if (!(p instanceof Property) || p.numKeys === 0) continue;

        for (var k = 1; k <= p.numKeys; k++) {
            if (p.keySelected(k)) {
                var layer = p.propertyGroup(p.propertyDepth);
                records.push({
                    prop: p,
                    layer: layer,
                    index: k,
                    time: p.keyTime(k),
                    value: p.keyValue(k),
                    inType: p.keyInInterpolationType(k),
                    outType: p.keyOutInterpolationType(k),
                    inEase: p.keyInTemporalEase(k),
                    outEase: p.keyOutTemporalEase(k),
                    label: p.keyLabel(k)
                });
            }
        }
    }

    if (records.length === 0) {
        app.endUndoGroup();
        return;
    }

    // Group keyframes
    var groups = [];
    for (var i = 0; i < records.length; i++) {
        var r = records[i];
        var key = ctrlPressed ? r.prop : r.layer;
        var found = false;
        for (var j = 0; j < groups.length; j++) {
            if (groups[j].key === key) {
                groups[j].records.push(r);
                found = true;
                break;
            }
        }
        if (!found) {
            groups.push({key: key, records: [r]});
        }
    }

    var newKeys = [];

    // Process each group separately
    for (var g = 0; g < groups.length; g++) {
        var groupRecords = groups[g].records;

        // find latest keyframe in this group
        var maxTime = groupRecords[0].time;
        for (var i = 1; i < groupRecords.length; i++) {
            if (groupRecords[i].time > maxTime) maxTime = groupRecords[i].time;
        }

        var shiftAmount = groupRecords[0].layer.outPoint - maxTime;

        // Remove old keys (group by prop within the group)
        var subProps = [];
        for (var i = 0; i < groupRecords.length; i++) {
            var r = groupRecords[i];
            var found = false;
            for (var j = 0; j < subProps.length; j++) {
                if (subProps[j].prop === r.prop) {
                    subProps[j].indices.push(r.index);
                    found = true;
                    break;
                }
            }
            if (!found) {
                subProps.push({prop: r.prop, indices: [r.index]});
            }
        }

        for (var j = 0; j < subProps.length; j++) {
            var sp = subProps[j];
            sp.indices.sort(function(a, b){ return b - a; });
            for (var k = 0; k < sp.indices.length; k++) {
                sp.prop.removeKey(sp.indices[k]);
            }
        }

        // Recreate keys at new times, sorted ascending
        groupRecords.sort(function(a, b){ return a.time - b.time; });
        for (var i = 0; i < groupRecords.length; i++) {
            var r = groupRecords[i];
            var newTime = r.time + shiftAmount;
            var newIndex = r.prop.addKey(newTime);

            r.prop.setValueAtKey(newIndex, r.value);
            r.prop.setInterpolationTypeAtKey(newIndex, r.inType, r.outType);
            r.prop.setTemporalEaseAtKey(newIndex, r.inEase, r.outEase);
            r.prop.setLabelAtKey(newIndex, r.label);

            newKeys.push({ prop: r.prop, index: newIndex });
        }
    }

    // Reselect all new keys
    for (var i = 0; i < newKeys.length; i++) {
        newKeys[i].prop.setSelectedAtKey(newKeys[i].index, true);
    }

    app.endUndoGroup();
})();