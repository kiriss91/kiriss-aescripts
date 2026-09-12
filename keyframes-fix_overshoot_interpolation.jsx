{
function clampOvershoot() {

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Select a composition.");
        return;
    }

    app.beginUndoGroup("Clamp Overshoot (Preserve Ease)");

    var props = comp.selectedProperties;

    // -------------------------
    // Vector helpers (spatial)
    // -------------------------
    function vecLength(v) {
        var sum = 0;
        for (var i = 0; i < v.length; i++)
            sum += v[i] * v[i];
        return Math.sqrt(sum);
    }

    function vecSub(a, b) {
        var r = [];
        for (var i = 0; i < a.length; i++)
            r.push(a[i] - b[i]);
        return r;
    }

    function vecScale(v, s) {
        var r = [];
        for (var i = 0; i < v.length; i++)
            r.push(v[i] * s);
        return r;
    }

    // -------------------------
    // Main loop
    // -------------------------
    for (var p = 0; p < props.length; p++) {

        var prop = props[p];
        if (!prop.isTimeVarying) continue;

        var selectedKeys = prop.selectedKeys;

        for (var k = 0; k < selectedKeys.length; k++) {

            var keyIndex = selectedKeys[k];

            // ==================================================
            // SPATIAL PROPERTIES (Position etc.)
            // ==================================================
            if (prop.propertyValueType === PropertyValueType.TwoD_SPATIAL ||
                prop.propertyValueType === PropertyValueType.ThreeD_SPATIAL) {

                var currentValue = prop.keyValue(keyIndex);
                var inTangent = prop.keyInSpatialTangent(keyIndex);
                var outTangent = prop.keyOutSpatialTangent(keyIndex);

                // Clamp IN tangent
                if (keyIndex > 1) {
                    var prevValue = prop.keyValue(keyIndex - 1);
                    var segment = vecSub(currentValue, prevValue);
                    var segmentLength = vecLength(segment);
                    var inLength = vecLength(inTangent);

                    if (inLength > segmentLength && inLength !== 0) {
                        inTangent = vecScale(inTangent, segmentLength / inLength);
                    }
                }

                // Clamp OUT tangent
                if (keyIndex < prop.numKeys) {
                    var nextValue = prop.keyValue(keyIndex + 1);
                    var segment2 = vecSub(nextValue, currentValue);
                    var segmentLength2 = vecLength(segment2);
                    var outLength = vecLength(outTangent);

                    if (outLength > segmentLength2 && outLength !== 0) {
                        outTangent = vecScale(outTangent, segmentLength2 / outLength);
                    }
                }

                prop.setSpatialTangentsAtKey(keyIndex, inTangent, outTangent);
            }

            // ==================================================
            // TEMPORAL PROPERTIES (Slider, Rotation, etc.)
            // ==================================================
            else {

                if (keyIndex < prop.numKeys) {

                    var currentVal = prop.keyValue(keyIndex);
                    var nextVal = prop.keyValue(keyIndex + 1);

                    var equal;

                    if (currentVal instanceof Array) {
                        equal = true;
                        for (var i = 0; i < currentVal.length; i++) {
                            if (currentVal[i] !== nextVal[i]) {
                                equal = false;
                                break;
                            }
                        }
                    } else {
                        equal = (currentVal === nextVal);
                    }

                    if (equal) {

                        // -------------------------
                        // FIRST KEY
                        // Keep incoming, zero outgoing
                        // -------------------------
                        var inEaseFirst = prop.keyInTemporalEase(keyIndex);
                        var outEaseFirst = prop.keyOutTemporalEase(keyIndex);

                        for (var e = 0; e < outEaseFirst.length; e++) {
                            outEaseFirst[e].influence = 0.1; // minimum allowed
                            outEaseFirst[e].speed = 0;
                        }

                        prop.setTemporalEaseAtKey(
                            keyIndex,
                            inEaseFirst,
                            outEaseFirst
                        );

                        // -------------------------
                        // SECOND KEY
                        // Zero incoming, keep outgoing
                        // -------------------------
                        var inEaseSecond = prop.keyInTemporalEase(keyIndex + 1);
                        var outEaseSecond = prop.keyOutTemporalEase(keyIndex + 1);

                        for (var e2 = 0; e2 < inEaseSecond.length; e2++) {
                            inEaseSecond[e2].influence = 0.1; // minimum allowed
                            inEaseSecond[e2].speed = 0;
                        }

                        prop.setTemporalEaseAtKey(
                            keyIndex + 1,
                            inEaseSecond,
                            outEaseSecond
                        );
                    }
                }
            }
        }
    }

    app.endUndoGroup();
}

clampOvershoot();
}