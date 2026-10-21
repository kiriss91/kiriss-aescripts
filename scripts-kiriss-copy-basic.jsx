#target aftereffects
#targetengine "LayerControlCopyPasteEngineV2"

(function LayerControlCopyPaste(thisObj) {

    var CACHE_KEY = "__LayerControlCopyPasteCache";

    // Native AE menu command IDs.
    // findMenuCommandId() is tried first; these are fallbacks.
    var COPY_COMMAND_FALLBACK = 19;
    var PASTE_COMMAND_FALLBACK = 20;

    function getCache() {
        return $.global[CACHE_KEY] || null;
    }

    function setCache(data) {
        $.global[CACHE_KEY] = data;
    }

    function getActiveComp() {
        var item = app.project.activeItem;
        return (item && item instanceof CompItem) ? item : null;
    }

    function getSelectedLayersSorted(comp) {
        var selected = comp.selectedLayers;
        var result = [];
        var i;

        for (i = 0; i < selected.length; i++) {
            result.push(selected[i]);
        }

        result.sort(function (a, b) {
            return a.index - b.index;
        });

        return result;
    }

    function isLayerInArray(layer, layers) {
        var i;

        for (i = 0; i < layers.length; i++) {
            if (layers[i] === layer) {
                return true;
            }
        }

        return false;
    }

    function findLayerSlot(layers, targetLayer) {
        var i;

        if (!targetLayer) {
            return -1;
        }

        for (i = 0; i < layers.length; i++) {
            if (layers[i] === targetLayer) {
                return i;
            }
        }

        return -1;
    }

    function getCommandId(name, fallback) {
        var id = 0;

        try {
            id = app.findMenuCommandId(name);
        } catch (err) {
            id = 0;
        }

        return id > 0 ? id : fallback;
    }

    function getPasteAtCurrentTimeCommandId() {
        var names = [
            "Paste Layers at Current Time",
            "Paste layers at current time"
        ];

        var i;
        var id = 0;

        for (i = 0; i < names.length; i++) {
            try {
                id = app.findMenuCommandId(names[i]);
            } catch (err) {
                id = 0;
            }

            if (id > 0) {
                return id;
            }
        }

        return 0;
    }

    function deselectPropertiesOnLayers(layers) {
        var i, j;

        for (i = 0; i < layers.length; i++) {
            var props;

            try {
                props = layers[i].selectedProperties;
            } catch (err) {
                props = [];
            }

            for (j = 0; j < props.length; j++) {
                try {
                    props[j].selected = false;
                } catch (propErr) {}
            }

            try {
                layers[i].selected = true;
            } catch (layerErr) {}
        }
    }

    function getLayerControlEffects(layer) {
        var result = [];
        var effects = layer.property("ADBE Effect Parade");
        var i;
        var ordinal = 0;

        if (!effects) {
            return result;
        }

        for (i = 1; i <= effects.numProperties; i++) {
            var effect = effects.property(i);

            if (effect && effect.matchName === "ADBE Layer Control") {
                result.push({
                    effect: effect,
                    effectIndex: i,
                    controlOrdinal: ordinal
                });

                ordinal++;
            }
        }

        return result;
    }

    function resolveLayerFromValue(comp, value) {
        var index;

        if (typeof value !== "number") {
            return null;
        }

        index = Math.round(value);

        if (index < 1 || index > comp.numLayers) {
            return null;
        }

        try {
            return comp.layer(index);
        } catch (err) {
            return null;
        }
    }

    function captureTarget(comp, selectedLayers, value) {
        var targetLayer = resolveLayerFromValue(comp, value);

        if (!targetLayer) {
            return {
                hasTarget: false,
                targetName: "",
                targetSlot: -1,
                targetLayerRef: null
            };
        }

        return {
            hasTarget: true,
            targetName: targetLayer.name,
            targetSlot: findLayerSlot(selectedLayers, targetLayer),
            targetLayerRef: targetLayer
        };
    }

    function captureLayerControl(comp, selectedLayers, effectInfo) {
        var effect = effectInfo.effect;
        var prop = effect.property(1);

        var data = {
            effectName: effect.name,
            effectIndex: effectInfo.effectIndex,
            controlOrdinal: effectInfo.controlOrdinal,
            keyframed: false,
            values: []
        };

        if (!prop) {
            return data;
        }

        if (prop.numKeys && prop.numKeys > 0) {
            data.keyframed = true;

            var k;

            for (k = 1; k <= prop.numKeys; k++) {
                data.values.push(
                    captureTarget(comp, selectedLayers, prop.keyValue(k))
                );
            }
        } else {
            data.values.push(
                captureTarget(comp, selectedLayers, prop.value)
            );
        }

        return data;
    }

    function copySelection(statusText) {
        var comp = getActiveComp();

        if (!comp) {
            statusText.text = "No active comp";
            return;
        }

        var selectedLayers = getSelectedLayersSorted(comp);

        if (selectedLayers.length === 0) {
            statusText.text = "Select layers";
            return;
        }

        var cache = {
            sourceComp: comp,
            sourceCompName: comp.name,
            layers: [],
            totalControls: 0
        };

        var i, j;

        for (i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            var controls = getLayerControlEffects(layer);
            var parentLayer = null;

            try {
                parentLayer = layer.parent;
            } catch (parentErr) {
                parentLayer = null;
            }

            var layerData = {
                sourceName: layer.name,
                sourceLayerRef: layer,
                sourceLayerId: getLayerId(layer),
                wasLocked: layer.locked,

                parentHasTarget: parentLayer !== null,
                parentName: parentLayer ? parentLayer.name : "",
                parentSlot: parentLayer
                    ? findLayerSlot(selectedLayers, parentLayer)
                    : -1,
                parentLayerRef: parentLayer,

                controls: []
            };

            for (j = 0; j < controls.length; j++) {
                layerData.controls.push(
                    captureLayerControl(
                        comp,
                        selectedLayers,
                        controls[j]
                    )
                );

                cache.totalControls++;
            }

            cache.layers.push(layerData);
        }

        /*
            IMPORTANT:
            Use AE's native Copy command instead of layer.copyToComp().

            copyToComp() copies layers one at a time. Some layers containing
            Essential Properties / Essential Graphics data can fail or behave
            differently when copied individually.

            Native Copy keeps the entire selected layer group together exactly
            like Ctrl+C, including Essential Graphics / Essential Properties.
        */
        deselectPropertiesOnLayers(selectedLayers);

        var copyId = getCommandId("Copy", COPY_COMMAND_FALLBACK);

        try {
            app.executeCommand(copyId);
        } catch (copyErr) {
            statusText.text = "Copy failed";
            return;
        }

        setCache(cache);

        statusText.text =
            "Copied " + cache.layers.length +
            " layer" + (cache.layers.length === 1 ? "" : "s") +
            "  |  " + cache.totalControls + " control" +
            (cache.totalControls === 1 ? "" : "s");
    }

    function getLayerId(layer) {
        try {
            if (layer.id !== undefined) {
                return layer.id;
            }
        } catch (err) {}

        return null;
    }

    function buildExistingLayerSnapshot(comp) {
        var result = [];
        var i;

        for (i = 1; i <= comp.numLayers; i++) {
            result.push({
                layer: comp.layer(i),
                id: getLayerId(comp.layer(i))
            });
        }

        return result;
    }

    function existedBeforePaste(layer, snapshot) {
        var id = getLayerId(layer);
        var i;

        // AE 22+ has stable layer IDs. This is the preferred path.
        if (id !== null) {
            for (i = 0; i < snapshot.length; i++) {
                if (snapshot[i].id !== null && snapshot[i].id === id) {
                    return true;
                }
            }

            return false;
        }

        // Fallback for older AE versions: compare object references.
        for (i = 0; i < snapshot.length; i++) {
            if (snapshot[i].layer === layer) {
                return true;
            }
        }

        return false;
    }

    function findNewLayersAfterPaste(comp, snapshot) {
        var result = [];
        var i;

        for (i = 1; i <= comp.numLayers; i++) {
            var layer = comp.layer(i);

            if (!existedBeforePaste(layer, snapshot)) {
                result.push(layer);
            }
        }

        result.sort(function (a, b) {
            return a.index - b.index;
        });

        return result;
    }

    function movePastedLayersToCurrentTime(comp, pastedLayers, pasteTime) {
        if (!pastedLayers || pastedLayers.length === 0) {
            return;
        }

        var earliestIn = null;
        var i;

        for (i = 0; i < pastedLayers.length; i++) {
            if (!pastedLayers[i]) {
                continue;
            }

            if (
                earliestIn === null ||
                pastedLayers[i].inPoint < earliestIn
            ) {
                earliestIn = pastedLayers[i].inPoint;
            }
        }

        if (earliestIn === null) {
            return;
        }

        var offset = pasteTime - earliestIn;

        if (Math.abs(offset) < 0.0000001) {
            return;
        }

        for (i = 0; i < pastedLayers.length; i++) {
            if (!pastedLayers[i]) {
                continue;
            }

            try {
                pastedLayers[i].startTime += offset;
            } catch (moveErr) {}
        }
    }

    function layerNameExists(comp, name, excludeLayers) {
        var i;
        var layer;

        for (i = 1; i <= comp.numLayers; i++) {
            layer = comp.layer(i);

            if (
                excludeLayers &&
                isLayerInArray(layer, excludeLayers)
            ) {
                continue;
            }

            if (layer.name === name) {
                return true;
            }
        }

        return false;
    }

    // Any trailing run of digits counts, whatever (if anything) comes before
    // it: "_1", "-1", " 3", "saf5", "name07" ...
    function hasTrailingNumericSuffix(name) {
        return /\d+$/.test(name);
    }

    function nameInArray(name, names) {
        var i;

        for (i = 0; i < names.length; i++) {
            if (names[i] === name) {
                return true;
            }
        }

        return false;
    }

    function nameIsTaken(comp, name, excludeLayers, reservedNames) {
        return (
            layerNameExists(comp, name, excludeLayers) ||
            nameInArray(name, reservedNames || [])
        );
    }

    function getIncrementedNumericSuffixName(
        comp,
        sourceName,
        pastedLayers,
        reservedNames
    ) {
        // Lazy prefix so the WHOLE trailing digit run lands in group 2.
        // Group 1 keeps the separator ("_", "-", "", ...) untouched.
        var match = sourceName.match(/^(.*?)(\d+)$/);

        if (!match) {
            return null;
        }

        var baseName = match[1];
        var digits = match[2];
        var number = parseInt(digits, 10) + 1;

        // Keep zero-padding: "clip_01" -> "clip_02".
        function build(n) {
            var s = String(n);

            while (s.length < digits.length) {
                s = "0" + s;
            }

            return baseName + s;
        }

        var candidate = build(number);

        while (
            nameIsTaken(
                comp,
                candidate,
                pastedLayers,
                reservedNames
            )
        ) {
            number++;
            candidate = build(number);
        }

        return candidate;
    }

    function chooseSameCompSuffix(
        comp,
        cachedLayers,
        pastedLayers,
        skipNumericSuffixNames,
        reservedNames
    ) {
        var suffixNumber = 1;
        var valid = false;
        var i;
        var candidate;

        while (!valid) {
            valid = true;

            for (i = 0; i < cachedLayers.length; i++) {
                if (
                    skipNumericSuffixNames &&
                    hasTrailingNumericSuffix(cachedLayers[i].sourceName)
                ) {
                    continue;
                }

                candidate =
                    cachedLayers[i].sourceName + "_" + suffixNumber;

                if (
                    nameIsTaken(
                        comp,
                        candidate,
                        pastedLayers,
                        reservedNames
                    )
                ) {
                    valid = false;
                    suffixNumber++;
                    break;
                }
            }
        }

        return "_" + suffixNumber;
    }

    function findLayerByExactName(comp, name, excludeLayers) {
        var i;
        var layer;

        for (i = 1; i <= comp.numLayers; i++) {
            layer = comp.layer(i);

            if (
                excludeLayers &&
                isLayerInArray(layer, excludeLayers)
            ) {
                continue;
            }

            if (layer.name === name) {
                return layer;
            }
        }

        return null;
    }

    function findLayerControlEffect(layer, controlData) {
        var effects = layer.property("ADBE Effect Parade");
        var effect;
        var i;
        var ordinal = 0;

        if (!effects) {
            return null;
        }

        // 1. Same effect position.
        if (
            controlData.effectIndex >= 1 &&
            controlData.effectIndex <= effects.numProperties
        ) {
            effect = effects.property(controlData.effectIndex);

            if (effect && effect.matchName === "ADBE Layer Control") {
                return effect;
            }
        }

        // 2. Same effect name.
        for (i = 1; i <= effects.numProperties; i++) {
            effect = effects.property(i);

            if (
                effect &&
                effect.matchName === "ADBE Layer Control" &&
                effect.name === controlData.effectName
            ) {
                return effect;
            }
        }

        // 3. Same Layer Control number on the layer.
        for (i = 1; i <= effects.numProperties; i++) {
            effect = effects.property(i);

            if (effect && effect.matchName === "ADBE Layer Control") {
                if (ordinal === controlData.controlOrdinal) {
                    return effect;
                }

                ordinal++;
            }
        }

        return null;
    }

    function resolveCachedTarget(
        targetComp,
        sourceComp,
        targetData,
        pastedLayers
    ) {
        if (!targetData.hasTarget) {
            return null;
        }

        // Target was included in the copied selection:
        // always point to its NEW pasted counterpart.
        if (
            targetData.targetSlot >= 0 &&
            targetData.targetSlot < pastedLayers.length &&
            pastedLayers[targetData.targetSlot]
        ) {
            return pastedLayers[targetData.targetSlot];
        }

        // Same-comp paste:
        // external target keeps pointing to the original exact layer.
        if (
            targetComp === sourceComp &&
            targetData.targetLayerRef
        ) {
            try {
                if (
                    targetData.targetLayerRef.containingComp === targetComp
                ) {
                    return targetData.targetLayerRef;
                }
            } catch (sameCompErr) {}
        }

        // Different comp:
        // external target is resolved by exact layer name.
        return findLayerByExactName(
            targetComp,
            targetData.targetName,
            pastedLayers
        );
    }

    function relinkControl(
        targetComp,
        sourceComp,
        pastedLayer,
        controlData,
        pastedLayers
    ) {
        var effect = findLayerControlEffect(
            pastedLayer,
            controlData
        );

        if (!effect) {
            return {
                linked: 0,
                missing: 1
            };
        }

        var prop = effect.property(1);

        if (!prop) {
            return {
                linked: 0,
                missing: 1
            };
        }

        var linked = 0;
        var missing = 0;
        var i;
        var targetLayer;
        var targetIndex;

        if (controlData.keyframed) {
            for (i = 0; i < controlData.values.length; i++) {
                targetLayer = resolveCachedTarget(
                    targetComp,
                    sourceComp,
                    controlData.values[i],
                    pastedLayers
                );

                targetIndex = targetLayer
                    ? targetLayer.index
                    : 0;

                try {
                    if (i + 1 <= prop.numKeys) {
                        prop.setValueAtKey(i + 1, targetIndex);

                        if (
                            controlData.values[i].hasTarget &&
                            !targetLayer
                        ) {
                            missing++;
                        } else {
                            linked++;
                        }
                    } else {
                        missing++;
                    }
                } catch (keyErr) {
                    missing++;
                }
            }
        } else {
            targetLayer = resolveCachedTarget(
                targetComp,
                sourceComp,
                controlData.values[0],
                pastedLayers
            );

            targetIndex = targetLayer
                ? targetLayer.index
                : 0;

            try {
                prop.setValue(targetIndex);

                if (
                    controlData.values[0].hasTarget &&
                    !targetLayer
                ) {
                    missing++;
                } else {
                    linked++;
                }
            } catch (setErr) {
                missing++;
            }
        }

        return {
            linked: linked,
            missing: missing
        };
    }

    function restoreParenting(
        targetComp,
        sourceComp,
        cachedLayer,
        pastedLayer,
        pastedLayers
    ) {
        if (!pastedLayer) {
            return;
        }

        var targetParent = null;

        if (cachedLayer.parentHasTarget) {
            if (
                cachedLayer.parentSlot >= 0 &&
                cachedLayer.parentSlot < pastedLayers.length
            ) {
                targetParent =
                    pastedLayers[cachedLayer.parentSlot];
            } else if (
                targetComp === sourceComp &&
                cachedLayer.parentLayerRef
            ) {
                try {
                    if (
                        cachedLayer.parentLayerRef.containingComp ===
                        targetComp
                    ) {
                        targetParent =
                            cachedLayer.parentLayerRef;
                    }
                } catch (parentRefErr) {}
            } else {
                targetParent = findLayerByExactName(
                    targetComp,
                    cachedLayer.parentName,
                    pastedLayers
                );
            }
        }

        try {
            if (targetParent) {
                pastedLayer.setParentWithJump(targetParent);
            } else {
                pastedLayer.setParentWithJump();
            }
        } catch (parentErr) {
            /*
                Native paste normally already preserves parenting.
                This is only a repair pass, so failure here should not
                abort the Layer Control relink.
            */
        }
    }

    function deselectAllLayers(comp) {
        var i;

        for (i = 1; i <= comp.numLayers; i++) {
            try {
                comp.layer(i).selected = false;
            } catch (err) {}
        }
    }

    function pasteAndRelink(statusText, keepOriginalTiming, detectXSuffix) {
        var cache = getCache();

        if (!cache || !cache.layers || cache.layers.length === 0) {
            statusText.text = "Nothing copied";
            return;
        }

        var targetComp = getActiveComp();

        if (!targetComp) {
            statusText.text = "No active comp";
            return;
        }

        var sourceComp = cache.sourceComp;
        var sameComp = targetComp === sourceComp;

        /*
            Snapshot every layer BEFORE native Paste.
            After Paste we detect only the newly-created layer IDs.
        */
        var beforePaste = buildExistingLayerSnapshot(targetComp);
        var pasteTime = targetComp.time;

        var pasteId = getCommandId("Paste", PASTE_COMMAND_FALLBACK);
        var pasteAtTimeId = keepOriginalTiming
            ? 0
            : getPasteAtCurrentTimeCommandId();

        var usedManualTimelineFallback =
            !keepOriginalTiming && pasteAtTimeId <= 0;

        app.beginUndoGroup("Paste Layers + Relink Controls");

        var pastedLayers = [];
        var linkedCount = 0;
        var missingCount = 0;
        var i, j;
        var result;

        try {
            /*
                Default behavior:
                use AE's native "Paste Layers at Current Time"
                (Ctrl+Alt+V on Windows / Cmd+Option+V on macOS).

                When "Keep original timing" is checked, use normal Paste,
                which keeps the layers at their original comp times.

                Both paths use AE's native clipboard paste, so Essential
                Graphics / Essential Properties stay intact.
            */
            try {
                if (!keepOriginalTiming && pasteAtTimeId > 0) {
                    app.executeCommand(pasteAtTimeId);
                } else {
                    app.executeCommand(pasteId);
                }
            } catch (pasteErr) {
                statusText.text = "Paste failed";
                return;
            }

            pastedLayers = findNewLayersAfterPaste(
                targetComp,
                beforePaste
            );

            /*
                We MUST get exactly the same number of layers.
                If not, do not guess which source layer matches which
                pasted layer, because that could create bad links.
            */
            if (pastedLayers.length !== cache.layers.length) {
                statusText.text =
                    "Paste " + pastedLayers.length +
                    "/" + cache.layers.length + " layers";
                return;
            }

            /*
                Fallback for installations where the menu command name
                cannot be resolved (for example, a localized AE UI).
                Shift the whole pasted group so the earliest In point
                lands on the CTI while preserving relative timing.
            */
            if (usedManualTimelineFallback) {
                movePastedLayersToCurrentTime(
                    targetComp,
                    pastedLayers,
                    pasteTime
                );
            }

            /*
                Same-comp naming.

                Detect _X OFF:
                    Original behavior:
                    name -> name_1 -> name_2 -> ...

                Detect _X ON:
                    If a source name already ends in _number,
                    increment that number instead:
                    "arrow-3 connectors_4" -> "arrow-3 connectors_5"

                    If that next name already exists, keep incrementing
                    until a free number is found.

                    Names without a trailing _number keep the original
                    shared _1, _2, _3... behavior.
            */
            if (sameComp) {
                var reservedNames = [];
                var suffix = "";

                if (detectXSuffix) {
                    /*
                        First reserve names for all layers that already end
                        in _number. This prevents collisions inside the newly
                        pasted group.
                    */
                    for (i = 0; i < pastedLayers.length; i++) {
                        if (
                            hasTrailingNumericSuffix(
                                cache.layers[i].sourceName
                            )
                        ) {
                            var incrementedName =
                                getIncrementedNumericSuffixName(
                                    targetComp,
                                    cache.layers[i].sourceName,
                                    pastedLayers,
                                    reservedNames
                                );

                            if (incrementedName) {
                                reservedNames.push(incrementedName);
                            }
                        }
                    }

                    /*
                        For names without _number, preserve the old shared
                        suffix behavior, while avoiding any names already
                        reserved above.
                    */
                    suffix = chooseSameCompSuffix(
                        targetComp,
                        cache.layers,
                        pastedLayers,
                        true,
                        reservedNames
                    );

                    var reservedIndex = 0;

                    for (i = 0; i < pastedLayers.length; i++) {
                        try {
                            if (
                                hasTrailingNumericSuffix(
                                    cache.layers[i].sourceName
                                )
                            ) {
                                pastedLayers[i].name =
                                    reservedNames[reservedIndex];
                                reservedIndex++;
                            } else {
                                pastedLayers[i].name =
                                    cache.layers[i].sourceName + suffix;
                            }
                        } catch (renameErr) {}
                    }
                } else {
                    suffix = chooseSameCompSuffix(
                        targetComp,
                        cache.layers,
                        pastedLayers,
                        false,
                        []
                    );

                    for (i = 0; i < pastedLayers.length; i++) {
                        try {
                            pastedLayers[i].name =
                                cache.layers[i].sourceName + suffix;
                        } catch (renameErr) {}
                    }
                }
            }

            /*
                Native Paste normally preserves internal parenting.
                Repair it anyway so the cached source relationship
                remains authoritative.
            */
            for (i = 0; i < cache.layers.length; i++) {
                restoreParenting(
                    targetComp,
                    sourceComp,
                    cache.layers[i],
                    pastedLayers[i],
                    pastedLayers
                );
            }

            // Repair every Layer Control from cached target data.
            for (i = 0; i < cache.layers.length; i++) {
                for (
                    j = 0;
                    j < cache.layers[i].controls.length;
                    j++
                ) {
                    result = relinkControl(
                        targetComp,
                        sourceComp,
                        pastedLayers[i],
                        cache.layers[i].controls[j],
                        pastedLayers
                    );

                    linkedCount += result.linked;
                    missingCount += result.missing;
                }
            }

            // Restore original lock states.
            for (i = 0; i < pastedLayers.length; i++) {
                try {
                    pastedLayers[i].locked =
                        cache.layers[i].wasLocked;
                } catch (lockErr) {}
            }

            // Leave only the new pasted group selected.
            deselectAllLayers(targetComp);

            for (i = 0; i < pastedLayers.length; i++) {
                try {
                    pastedLayers[i].selected = true;
                } catch (selectErr) {}
            }

            if (missingCount > 0) {
                statusText.text =
                    "Pasted " + pastedLayers.length +
                    "  |  Linked " + linkedCount +
                    "  |  Missing " + missingCount;
            } else {
                statusText.text =
                    "Pasted " + pastedLayers.length +
                    "  |  Linked " + linkedCount;
            }

        } finally {
            app.endUndoGroup();
        }
    }

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window(
                "palette",
                "Layer Copy + Relink",
                undefined,
                { resizeable: false }
            );

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 5;
        win.margins = 8;

        var buttons = win.add("group");
        buttons.orientation = "row";
        buttons.alignChildren = ["fill", "center"];
        buttons.spacing = 5;

        var copyBtn = buttons.add(
            "button",
            undefined,
            "Copy"
        );

        var pasteBtn = buttons.add(
            "button",
            undefined,
            "Paste"
        );

        copyBtn.preferredSize = [82, 25];
        pasteBtn.preferredSize = [82, 25];

        var keepTimingCheck = win.add(
            "checkbox",
            undefined,
            "Keep original timing"
        );

        keepTimingCheck.value = false;

        var detectXSuffixCheck = win.add(
            "checkbox",
            undefined,
            "Detect _X"
        );

        detectXSuffixCheck.value = true;

        var statusText = win.add(
            "statictext",
            undefined,
            "Ready"
        );

        statusText.alignment = ["fill", "top"];
        statusText.characters = 34;

        copyBtn.onClick = function () {
            try {
                copySelection(statusText);
            } catch (err) {
                statusText.text = "Copy failed";
            }
        };

        pasteBtn.onClick = function () {
            try {
                pasteAndRelink(
                    statusText,
                    keepTimingCheck.value,
                    detectXSuffixCheck.value
                );
            } catch (err) {
                statusText.text = "Paste failed";
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
