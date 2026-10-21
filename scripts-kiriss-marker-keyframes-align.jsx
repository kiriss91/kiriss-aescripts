// ============================================================
// TEXT SEQUENCE BUILDER
// After Effects 2026
// ============================================================

(function () {

    // ========================================================
    // PERSISTENT SETTINGS
    // ========================================================

    var SETTINGS_SECTION = "TextSequenceBuilder";

    var DEFAULT_OUT_MODE = 0;      // 0 = Smart, 1 = Dynamic
    var DEFAULT_IN_SPEED = 100;
    var DEFAULT_OUT_SPEED = 140;
    var DEFAULT_IGNORE_TEXT = false;

    var MIN_IN_SPEED = 50;
    var MAX_IN_SPEED = 400;
    var MIN_OUT_SPEED = 50;
    var MAX_OUT_SPEED = 400;

    function loadIntSetting(key, fallback) {
        try {
            if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
                var v = parseInt(app.settings.getSetting(SETTINGS_SECTION, key), 10);
                if (!isNaN(v)) return v;
            }
        } catch (err) {}
        return fallback;
    }

    function loadFloatSetting(key, fallback) {
        try {
            if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
                var v = parseFloat(app.settings.getSetting(SETTINGS_SECTION, key));
                if (!isNaN(v)) return v;
            }
        } catch (err) {}
        return fallback;
    }

    function loadBoolSetting(key, fallback) {
        try {
            if (app.settings.haveSetting(SETTINGS_SECTION, key)) {
                var v = app.settings.getSetting(SETTINGS_SECTION, key);
                return v === "true" || v === "1";
            }
        } catch (err) {}
        return fallback;
    }

    function clamp(v, minV, maxV) {
        return Math.max(minV, Math.min(maxV, v));
    }

    var savedOutMode = clamp(loadIntSetting("outMode", DEFAULT_OUT_MODE), 0, 1);
    var savedInSpeed = clamp(loadFloatSetting("inSpeed", DEFAULT_IN_SPEED), MIN_IN_SPEED, MAX_IN_SPEED);
    var savedOutSpeed = clamp(loadFloatSetting("outSpeed", DEFAULT_OUT_SPEED), MIN_OUT_SPEED, MAX_OUT_SPEED);
    var savedIgnoreText = loadBoolSetting("ignoreText", DEFAULT_IGNORE_TEXT);


    // ========================================================
    // KEEP ONE WINDOW OPEN
    // ========================================================

    try {
        if ($.global.textSequenceBuilderWindow) {
            $.global.textSequenceBuilderWindow.show();
            $.global.textSequenceBuilderWindow.active = true;
            return;
        }
    } catch (ignore) {}


    // ========================================================
    // MAIN SETTINGS
    // ========================================================

    var DEFAULT_ITEM_COUNT = 4;
    var MAX_ITEM_COUNT = 6;

    // Existing base text timing. In Speed is applied on top of this.
    var TIME_MULTIPLIER = 2;

    // Dynamic text timing.
    var MIN_FRAMES = 12;
    var CHARS_PER_EXTRA_FRAME = 4;
    var EXTRA_FRAMES_PER_LINE = 2;
    var MAX_FRAMES = 28;

    // Dot timing.
    // Marker X = Dot-scale-X starts at 0.
    // 7 frames later it reaches 100.
    // Text-in-X starts 4 frames after the marker.
    var DOT_ANIM_FRAMES = 7;
    var TEXT_IN_DELAY_FRAMES = 4;

    // Prevent text animation from becoming absurdly short at high speed values.
    var MIN_TEXT_ANIM_FRAMES = 5;

    // Dynamic OUT.
    var DYNAMIC_OUT_DURATION = true;
    var OUT_DURATION_FRAMES = 8;
    var OUT_STAGGER_FRAMES = 2;

    // Smart OUT.
    var SMART_START_PROGRESS = 0.46;
    var SMART_STAGGER_ACCELERATION = 0.84;
    var SMART_MIN_PROGRESS = 0.26;
    var SMART_END_GAP_FRAMES = 1;
    var SMART_MIN_DURATION_FRAMES = 6;

    // Markers.
    var MARKER_SPACING_SECONDS = 2.0;
    var OUT_MARKER_AFTER_LAST_SECONDS = 4.0;


    // ========================================================
    // UI
    // ========================================================

    var win = new Window(
        "palette",
        "Text Sequence Builder",
        undefined,
        { resizeable: true }
    );

    $.global.textSequenceBuilderWindow = win;

    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 6;
    win.margins = 10;
    win.preferredSize.width = 620;
    win.minimumSize.width = 560;

    // Top buttons.
    var topButtons = win.add("group");
    topButtons.orientation = "row";
    topButtons.alignChildren = ["fill", "center"];
    topButtons.spacing = 5;

    var readButton = topButtons.add("button", undefined, "Read Text");
    readButton.preferredSize.height = 30;
    readButton.alignment = ["fill", "center"];

    var markerButton = topButtons.add("button", undefined, "Add Markers");
    markerButton.preferredSize.height = 30;
    markerButton.alignment = ["fill", "center"];

    // Ignore Text.
    var textHeader = win.add("group");
    textHeader.orientation = "row";
    textHeader.alignChildren = ["left", "center"];
    textHeader.spacing = 5;

    var ignoreTextCheckbox = textHeader.add("checkbox", undefined, "Ignore Text");
    ignoreTextCheckbox.value = savedIgnoreText;

    // Text panel.
    var textPanel = win.add("panel", undefined, "");
    textPanel.orientation = "column";
    textPanel.alignChildren = ["fill", "top"];
    textPanel.alignment = ["fill", "top"];
    textPanel.spacing = 4;
    textPanel.margins = 8;

    var textInputs = [];
    var textInputsAreAuthoritative = false;

    // Keep the input rows separate so new rows can be inserted
    // above the + button.
    var textRows = textPanel.add("group");
    textRows.orientation = "column";
    textRows.alignChildren = ["fill", "top"];
    textRows.spacing = 4;
    textRows.alignment = ["fill", "top"];

    function addTextInputRow() {
        if (textInputs.length >= MAX_ITEM_COUNT) return;

        var uiIndex = textInputs.length + 1;
        var row = textRows.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        row.spacing = 6;
        row.alignment = ["fill", "top"];

        var label = row.add("statictext", undefined, "Text " + uiIndex);
        label.preferredSize.width = 45;

        var input = row.add(
            "edittext",
            undefined,
            "",
            { multiline: true, scrolling: false }
        );

        input.characters = 44;
        input.preferredSize.height = 52;
        input.alignment = ["fill", "fill"];

        input.onChanging = function () {
            textInputsAreAuthoritative = true;
        };

        textInputs.push(input);
    }

    function getItemCount() {
        return textInputs.length;
    }

    for (var uiIndex = 1; uiIndex <= DEFAULT_ITEM_COUNT; uiIndex++) {
        addTextInputRow();
    }

    var addTextGroup = textPanel.add("group");
    addTextGroup.orientation = "row";
    addTextGroup.alignChildren = ["right", "center"];
    addTextGroup.alignment = ["fill", "top"];

    var addTextButton = addTextGroup.add("button", undefined, "+");
    addTextButton.preferredSize = [34, 24];
    addTextButton.helpTip = "Add another text input (maximum 6).";

    // IN speed.
    var inGroup = win.add("group");
    inGroup.orientation = "row";
    inGroup.alignChildren = ["left", "center"];
    inGroup.spacing = 6;

    inGroup.add("statictext", undefined, "In Speed:");

    var inSpeedSlider = inGroup.add(
        "slider",
        undefined,
        savedInSpeed,
        MIN_IN_SPEED,
        MAX_IN_SPEED
    );
    inSpeedSlider.preferredSize.width = 150;

    var inSpeedValue = inGroup.add(
        "statictext",
        undefined,
        Math.round(savedInSpeed) + "%"
    );
    inSpeedValue.preferredSize.width = 45;

    // OUT mode + speed.
    var outGroup = win.add("group");
    outGroup.orientation = "row";
    outGroup.alignChildren = ["left", "center"];
    outGroup.spacing = 6;

    outGroup.add("statictext", undefined, "Out:");

    var outModeDropdown = outGroup.add(
        "dropdownlist",
        undefined,
        ["Smart", "Dynamic"]
    );
    outModeDropdown.preferredSize.width = 90;
    outModeDropdown.selection = savedOutMode;

    outGroup.add("statictext", undefined, "Speed:");

    var outSpeedSlider = outGroup.add(
        "slider",
        undefined,
        savedOutSpeed,
        MIN_OUT_SPEED,
        MAX_OUT_SPEED
    );
    outSpeedSlider.preferredSize.width = 125;

    var outSpeedValue = outGroup.add(
        "statictext",
        undefined,
        Math.round(savedOutSpeed) + "%"
    );
    outSpeedValue.preferredSize.width = 45;

    // Bottom buttons.
    var bottomButtons = win.add("group");
    bottomButtons.orientation = "row";
    bottomButtons.alignChildren = ["fill", "center"];
    bottomButtons.spacing = 5;

    var closeButton = bottomButtons.add("button", undefined, "Close");
    closeButton.preferredSize.height = 32;
    closeButton.alignment = ["fill", "center"];

    var runButton = bottomButtons.add("button", undefined, "RUN");
    runButton.preferredSize.height = 32;
    runButton.alignment = ["fill", "center"];

    var statusText = win.add(
        "statictext",
        undefined,
        "Ready.",
        { multiline: true }
    );
    statusText.preferredSize.height = 28;


    // ========================================================
    // UI HELPERS / SETTINGS
    // ========================================================

    function setStatus(message) {
        statusText.text = message;
        win.layout.layout(true);
    }

    function updateTextUIState() {
        var ignore = ignoreTextCheckbox.value;
        textPanel.enabled = !ignore;
        readButton.enabled = !ignore;
    }

    function saveUISettings() {
        try {
            var modeIndex = 0;
            if (outModeDropdown.selection) modeIndex = outModeDropdown.selection.index;

            app.settings.saveSetting(SETTINGS_SECTION, "outMode", String(modeIndex));
            app.settings.saveSetting(SETTINGS_SECTION, "inSpeed", String(Math.round(inSpeedSlider.value)));
            app.settings.saveSetting(SETTINGS_SECTION, "outSpeed", String(Math.round(outSpeedSlider.value)));
            app.settings.saveSetting(SETTINGS_SECTION, "ignoreText", String(ignoreTextCheckbox.value));
        } catch (err) {}
    }

    updateTextUIState();

    addTextButton.onClick = function () {
        if (getItemCount() >= MAX_ITEM_COUNT) return;

        addTextInputRow();
        addTextButton.enabled = getItemCount() < MAX_ITEM_COUNT;

        win.layout.layout(true);

        // Grow the palette so the newly added row is immediately visible.
        try {
            win.size = [win.size.width, win.size.height + 56];
        } catch (err) {}

        win.layout.resize();
    };

    ignoreTextCheckbox.onClick = function () {
        updateTextUIState();
        saveUISettings();
    };

    inSpeedSlider.onChanging = function () {
        inSpeedValue.text = Math.round(inSpeedSlider.value) + "%";
    };

    inSpeedSlider.onChange = function () {
        inSpeedValue.text = Math.round(inSpeedSlider.value) + "%";
        saveUISettings();
    };

    outModeDropdown.onChange = function () {
        saveUISettings();
    };

    outSpeedSlider.onChanging = function () {
        outSpeedValue.text = Math.round(outSpeedSlider.value) + "%";
    };

    outSpeedSlider.onChange = function () {
        outSpeedValue.text = Math.round(outSpeedSlider.value) + "%";
        saveUISettings();
    };


    // ========================================================
    // AE HELPERS
    // ========================================================

    function getSelectedContext() {
        var comp = app.project.activeItem;

        if (!(comp && comp instanceof CompItem)) {
            return { valid: false, message: "Open a composition first." };
        }

        if (comp.selectedLayers.length !== 1) {
            return { valid: false, message: "Select exactly ONE precomp layer." };
        }

        return {
            valid: true,
            comp: comp,
            layer: comp.selectedLayers[0]
        };
    }

    function findPropertyByName(group, propertyName) {
        if (!group) return null;

        var targetName = propertyName.toLowerCase();

        for (var i = 1; i <= group.numProperties; i++) {
            var p = group.property(i);

            if (p.name.toLowerCase() === targetName) return p;

            if (p.propertyType !== PropertyType.PROPERTY) {
                var found = findPropertyByName(p, propertyName);
                if (found) return found;
            }
        }

        return null;
    }

    function getTextString(textProperty, compTime) {
        if (!textProperty) return "";

        var v;

        try {
            v = textProperty.valueAtTime(compTime, false);
        } catch (err) {
            try {
                v = textProperty.value;
            } catch (err2) {
                return "";
            }
        }

        if (v !== null && v !== undefined && v.text !== undefined) {
            return String(v.text);
        }

        return String(v);
    }

    function textHasContent(text) {
        if (text === null || text === undefined) return false;
        return String(text).replace(/\s/g, "").length > 0;
    }

    function textToUI(text) {
        return String(text)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");
    }


    // ========================================================
    // READ TEXT
    // ========================================================

    function readText() {
        if (ignoreTextCheckbox.value) return;

        var context = getSelectedContext();

        if (!context.valid) {
            setStatus(context.message);
            return;
        }

        var comp = context.comp;
        var layer = context.layer;
        var essentialGroup = layer.property("ADBE Layer Overrides");

        if (!essentialGroup) {
            setStatus("Selected layer has no Essential Properties.");
            return;
        }

        var missingItems = [];

        for (var i = 1; i <= getItemCount(); i++) {
            var textName = "main-text-" + i;
            var textProp = findPropertyByName(essentialGroup, textName);

            if (!textProp) {
                missingItems.push(textName);
                continue;
            }

            textInputs[i - 1].text = textToUI(
                getTextString(textProp, comp.time)
            );
        }

        if (missingItems.length > 0) {
            setStatus("Missing: " + missingItems.join(", "));
        } else {
            setStatus("Text loaded.");
        }

        textInputsAreAuthoritative = true;

        win.layout.layout(true);
    }


    // ========================================================
    // MARKERS
    // ========================================================

    function normalizeMarkerName(name) {
        if (name === null || name === undefined) return "";
        return String(name)
            .toLowerCase()
            .replace(/\s/g, "")
            .replace(/_/g, "");
    }

    function parseInMarkerIndex(name) {
        var normalized = normalizeMarkerName(name);

        if (!/^\d+$/.test(normalized)) return null;

        var itemIndex = parseInt(normalized, 10);

        if (itemIndex < 1 || itemIndex > MAX_ITEM_COUNT) return null;

        return itemIndex;
    }

    function makeItemRange(firstItem, lastItem, itemCount) {
        var items = [];
        var start = Math.max(1, firstItem);
        var end = Math.min(itemCount, lastItem);

        for (var i = start; i <= end; i++) {
            items.push(i);
        }

        return items;
    }

    function makeAllItems(itemCount) {
        return makeItemRange(1, itemCount, itemCount);
    }

    function parseOutMarker(name, itemCount) {
        var normalized = normalizeMarkerName(name);

        if (normalized === "all-") {
            return {
                name: normalized,
                items: makeAllItems(itemCount),
                isAll: true,
                isLegacy: false
            };
        }

        // Legacy range: 1-5_ / 1-6_.
        var legacyMatch = normalized.match(/^(\d+)-(\d+)$/);

        if (legacyMatch) {
            var firstItem = parseInt(legacyMatch[1], 10);
            var lastItem = parseInt(legacyMatch[2], 10);

            if (firstItem > lastItem) return null;

            return {
                name: normalized,
                items: makeItemRange(firstItem, lastItem, itemCount),
                isAll: false,
                isLegacy: true
            };
        }

        // New grouped format: 1,2,3- or even a single item such as 4-.
        var groupMatch = normalized.match(/^(\d+(?:,\d+)*)-$/);

        if (!groupMatch) return null;

        var parts = groupMatch[1].split(",");
        var items = [];
        var alreadyAdded = {};

        for (var p = 0; p < parts.length; p++) {
            var itemIndex = parseInt(parts[p], 10);

            if (
                itemIndex >= 1 &&
                itemIndex <= itemCount &&
                alreadyAdded[String(itemIndex)] !== true
            ) {
                items.push(itemIndex);
                alreadyAdded[String(itemIndex)] = true;
            }
        }

        return {
            name: normalized,
            items: items,
            isAll: false,
            isLegacy: false
        };
    }

    function addMarker(markerProperty, markerTime, name) {
        var marker = new MarkerValue(name);
        markerProperty.setValueAtTime(markerTime, marker);
    }

    function collectInMarkerTimes(markers) {
        var markerTimes = {};

        for (var i = 1; i <= markers.numKeys; i++) {
            var markerValue = markers.keyValue(i);
            var itemIndex = parseInMarkerIndex(markerValue.comment);

            if (itemIndex === null) continue;

            var itemKey = String(itemIndex);

            if (markerTimes[itemKey] === undefined) {
                markerTimes[itemKey] = markers.keyTime(i);
            }
        }

        return markerTimes;
    }

    function markerTimeIsOccupied(markers, markerTime, tolerance) {
        for (var i = 1; i <= markers.numKeys; i++) {
            if (Math.abs(markers.keyTime(i) - markerTime) <= tolerance) {
                return true;
            }
        }

        return false;
    }

    function findAvailableMarkerTime(markers, wantedTime, frameDuration) {
        var markerTime = wantedTime;
        var tolerance = frameDuration / 10;
        var safety = 0;

        while (
            markerTimeIsOccupied(markers, markerTime, tolerance) &&
            safety < 100
        ) {
            markerTime += frameDuration;
            safety++;
        }

        return markerTime;
    }

    function replaceFinalLegacyOutMarker(markers, itemCount) {
        if (!markers || markers.numKeys < 1) return false;

        var lastKeyIndex = markers.numKeys;
        var markerValue = markers.keyValue(lastKeyIndex);
        var parsed = parseOutMarker(markerValue.comment, itemCount);

        if (!parsed || !parsed.isLegacy) return false;

        var markerTime = markers.keyTime(lastKeyIndex);
        markers.removeKey(lastKeyIndex);
        addMarker(markers, markerTime, "all-");

        return true;
    }

    function hasOutMarker(markers, itemCount) {
        for (var i = 1; i <= markers.numKeys; i++) {
            var markerValue = markers.keyValue(i);

            if (parseOutMarker(markerValue.comment, itemCount)) {
                return true;
            }
        }

        return false;
    }

    function getMarkerTextForItem(comp, essentialGroup, itemIndex) {
        if (
            !ignoreTextCheckbox.value &&
            textInputsAreAuthoritative
        ) {
            return textInputs[itemIndex - 1].text;
        }

        var textProp = findPropertyByName(
            essentialGroup,
            "main-text-" + itemIndex
        );

        return textProp ? getTextString(textProp, comp.time) : "";
    }

    function addOrFixMarkers() {
        var context = getSelectedContext();

        if (!context.valid) {
            setStatus(context.message);
            return;
        }

        var comp = context.comp;
        var layer = context.layer;
        var markers = layer.property("ADBE Marker");
        var essentialGroup = layer.property("ADBE Layer Overrides");

        if (!markers) {
            setStatus("Could not access layer markers.");
            return;
        }

        if (!essentialGroup) {
            setStatus("Selected layer has no Essential Properties.");
            return;
        }

        app.beginUndoGroup("Add or Fix Text Sequence Markers");

        try {
            var startTime = comp.time;
            var itemCount = getItemCount();
            var visibleItems = [];
            var visibleItemMap = {};
            var i;

            for (i = 1; i <= itemCount; i++) {
                var currentText = getMarkerTextForItem(
                    comp,
                    essentialGroup,
                    i
                );

                if (textHasContent(currentText)) {
                    visibleItems.push(i);
                    visibleItemMap[String(i)] = true;
                }
            }

            // Existing numbered markers keep their exact positions.
            // Only markers belonging to empty text items are removed.
            var removedCount = removeEmptyInMarkers(
                layer,
                visibleItemMap
            );

            // Only the final legacy OUT marker is renamed. Its time is kept.
            var replacedLegacy = replaceFinalLegacyOutMarker(
                markers,
                itemCount
            );

            var existingInTimes = collectInMarkerTimes(markers);
            var baseTime = startTime;
            var anchorFound = false;

            for (i = 0; i < visibleItems.length; i++) {
                var anchorTime = existingInTimes[String(visibleItems[i])];

                if (anchorTime !== undefined) {
                    baseTime =
                        anchorTime - i * MARKER_SPACING_SECONDS;
                    anchorFound = true;
                    break;
                }
            }

            if (!anchorFound) {
                baseTime = startTime;
            }

            var addedCount = 0;
            var lastInMarkerTime = null;

            for (i = 0; i < visibleItems.length; i++) {
                var itemIndex = visibleItems[i];
                var oldInTime = existingInTimes[String(itemIndex)];
                var inMarkerTime;

                if (oldInTime !== undefined) {
                    inMarkerTime = oldInTime;
                } else {
                    var wantedTime =
                        baseTime + i * MARKER_SPACING_SECONDS;

                    inMarkerTime = findAvailableMarkerTime(
                        markers,
                        wantedTime,
                        comp.frameDuration
                    );

                    addMarker(
                        markers,
                        inMarkerTime,
                        "_" + itemIndex
                    );

                    existingInTimes[String(itemIndex)] = inMarkerTime;
                    addedCount++;
                }

                if (
                    lastInMarkerTime === null ||
                    inMarkerTime > lastInMarkerTime
                ) {
                    lastInMarkerTime = inMarkerTime;
                }
            }

            var addedAllMarker = false;

            if (!hasOutMarker(markers, itemCount)) {
                var defaultOutTime =
                    (lastInMarkerTime !== null ? lastInMarkerTime : startTime) +
                    OUT_MARKER_AFTER_LAST_SECONDS;

                defaultOutTime = findAvailableMarkerTime(
                    markers,
                    defaultOutTime,
                    comp.frameDuration
                );

                addMarker(
                    markers,
                    defaultOutTime,
                    "all-"
                );

                addedAllMarker = true;
            }

            setStatus(
                "Markers checked. Added " + addedCount +
                ", removed " + removedCount +
                (replacedLegacy ? ", legacy OUT -> all-" : "") +
                (addedAllMarker ? ", added all-" : "") +
                "."
            );

        } catch (err) {
            setStatus("Marker error: " + err.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function findMarkerTime(comp, layer, markerName) {
        var wantedName = normalizeMarkerName(markerName);
        var layerMarkers = layer.property("ADBE Marker");

        if (layerMarkers) {
            for (var i = 1; i <= layerMarkers.numKeys; i++) {
                var markerValue = layerMarkers.keyValue(i);

                if (normalizeMarkerName(markerValue.comment) === wantedName) {
                    return layerMarkers.keyTime(i);
                }
            }
        }

        var compMarkers = comp.markerProperty;

        if (compMarkers) {
            for (var j = 1; j <= compMarkers.numKeys; j++) {
                var compMarkerValue = compMarkers.keyValue(j);

                if (normalizeMarkerName(compMarkerValue.comment) === wantedName) {
                    return compMarkers.keyTime(j);
                }
            }
        }

        return null;
    }

    function collectOutMarkersFromProperty(markerProperty, itemCount, results) {
        if (!markerProperty) return;

        for (var i = 1; i <= markerProperty.numKeys; i++) {
            var markerValue = markerProperty.keyValue(i);
            var parsed = parseOutMarker(markerValue.comment, itemCount);

            if (parsed && parsed.items.length > 0) {
                results.push({
                    time: markerProperty.keyTime(i),
                    name: parsed.name,
                    items: parsed.items,
                    isAll: parsed.isAll,
                    isLegacy: parsed.isLegacy
                });
            }
        }
    }

    function collectOutMarkers(comp, layer, itemCount) {
        var results = [];

        collectOutMarkersFromProperty(
            layer.property("ADBE Marker"),
            itemCount,
            results
        );

        collectOutMarkersFromProperty(
            comp.markerProperty,
            itemCount,
            results
        );

        results.sort(function (a, b) {
            return a.time - b.time;
        });

        return results;
    }

    function resolveOutMarkerGroups(rawGroups, visibleItemMap) {
        var specificallyAssigned = {};
        var alreadyResolved = {};
        var resolved = [];
        var i;
        var j;

        // A specific marker wins over all-, regardless of marker order.
        for (i = 0; i < rawGroups.length; i++) {
            if (rawGroups[i].isAll) continue;

            for (j = 0; j < rawGroups[i].items.length; j++) {
                specificallyAssigned[String(rawGroups[i].items[j])] = true;
            }
        }

        for (i = 0; i < rawGroups.length; i++) {
            var group = rawGroups[i];
            var groupItems = [];

            for (j = 0; j < group.items.length; j++) {
                var itemIndex = group.items[j];
                var itemKey = String(itemIndex);

                if (visibleItemMap[itemKey] !== true) continue;
                if (alreadyResolved[itemKey] === true) continue;

                if (group.isAll && specificallyAssigned[itemKey] === true) {
                    continue;
                }

                groupItems.push(itemIndex);
                alreadyResolved[itemKey] = true;
            }

            if (groupItems.length > 0) {
                resolved.push({
                    time: group.time,
                    name: group.name,
                    items: groupItems,
                    isLegacy: group.isLegacy
                });
            }
        }

        return resolved;
    }

    function removeEmptyInMarkers(layer, visibleItemMap) {
        var markers = layer.property("ADBE Marker");
        if (!markers) return 0;

        var removedCount = 0;

        for (var i = markers.numKeys; i >= 1; i--) {
            var markerValue = markers.keyValue(i);
            var itemIndex = parseInMarkerIndex(markerValue.comment);

            if (
                itemIndex !== null &&
                visibleItemMap[String(itemIndex)] !== true
            ) {
                markers.removeKey(i);
                removedCount++;
            }
        }

        return removedCount;
    }


    // ========================================================
    // TEXT EXPRESSIONS
    // ========================================================

    function makeTextExpression(text) {
        if (text === null || text === undefined) text = "";

        text = String(text)
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n")
            .replace(/\\/g, "\\\\")
            .replace(/"/g, '\\"')
            .replace(/\n/g, "\\r");

        return '"' + text + '"';
    }

    function setTextPropertyExpression(prop, newText) {
        if (!prop) return false;

        try {
            if (prop.canSetExpression === false) return false;

            prop.expression = makeTextExpression(newText);

            if (prop.expressionError && prop.expressionError !== "") return false;

            return true;
        } catch (err) {
            return false;
        }
    }


    // ========================================================
    // DYNAMIC TEXT DURATION
    // ========================================================

    function getTextDurationFrames(text) {
        if (text === null || text === undefined) text = "";

        text = String(text);

        var normalizedText = text
            .replace(/\r\n/g, "\n")
            .replace(/\r/g, "\n");

        var characterCount = normalizedText.replace(/\s/g, "").length;
        var lineCount = normalizedText.length > 0 ? normalizedText.split("\n").length : 1;

        var frames = MIN_FRAMES;

        if (characterCount > 0) {
            frames += Math.ceil(characterCount / CHARS_PER_EXTRA_FRAME);
        }

        if (lineCount > 1) {
            frames += (lineCount - 1) * EXTRA_FRAMES_PER_LINE;
        }

        frames = Math.max(MIN_FRAMES, frames);
        frames = Math.min(MAX_FRAMES, frames);
        frames *= TIME_MULTIPLIER;

        return Math.round(frames);
    }


    // ========================================================
    // KEYFRAME STYLE
    // ========================================================

    function captureKeyStyle(prop, keyIndex) {
        var style = { valid: false };

        if (!prop || prop.numKeys < keyIndex) return style;

        style.valid = true;

        try {
            style.inInterpolation = prop.keyInInterpolationType(keyIndex);
            style.outInterpolation = prop.keyOutInterpolationType(keyIndex);
        } catch (err) {}

        try {
            style.inEase = prop.keyInTemporalEase(keyIndex);
            style.outEase = prop.keyOutTemporalEase(keyIndex);
        } catch (err) {}

        try {
            style.temporalContinuous = prop.keyTemporalContinuous(keyIndex);
        } catch (err) {}

        try {
            style.temporalAutoBezier = prop.keyTemporalAutoBezier(keyIndex);
        } catch (err) {}

        return style;
    }

    function applyKeyStyle(prop, keyIndex, style) {
        if (!style || !style.valid) return;

        try {
            prop.setInterpolationTypeAtKey(
                keyIndex,
                style.inInterpolation,
                style.outInterpolation
            );
        } catch (err) {}

        try {
            prop.setTemporalEaseAtKey(
                keyIndex,
                style.inEase,
                style.outEase
            );
        } catch (err) {}

        try {
            prop.setTemporalContinuousAtKey(
                keyIndex,
                style.temporalContinuous
            );
        } catch (err) {}

        try {
            prop.setTemporalAutoBezierAtKey(
                keyIndex,
                style.temporalAutoBezier
            );
        } catch (err) {}
    }

    function removeAllKeys(prop) {
        if (!prop) return;
        for (var i = prop.numKeys; i >= 1; i--) prop.removeKey(i);
    }

    function clearAnimationAndSetZero(prop) {
        if (!prop) return false;

        removeAllKeys(prop);

        try {
            prop.setValue(0);
            return true;
        } catch (err) {
            return false;
        }
    }

    function clearAllEmptyItemAnimations(comp, essentialGroup) {
        var clearedItems = [];

        // This deliberately checks all supported slots, not only the number
        // of text rows currently visible in the script UI.
        for (var item = 1; item <= MAX_ITEM_COUNT; item++) {
            var textProp = findPropertyByName(
                essentialGroup,
                "main-text-" + item
            );

            if (!textProp) continue;

            var currentText = getTextString(textProp, comp.time);

            if (textHasContent(currentText)) continue;

            var inProp = findPropertyByName(
                essentialGroup,
                "Text-in-" + item
            );

            var outProp = findPropertyByName(
                essentialGroup,
                "Text-out-" + item
            );

            var dotProp = findPropertyByName(
                essentialGroup,
                "Dot-scale-" + item
            );

            var hadKeys =
                (inProp && inProp.numKeys > 0) ||
                (outProp && outProp.numKeys > 0) ||
                (dotProp && dotProp.numKeys > 0);

            clearAnimationAndSetZero(inProp);
            clearAnimationAndSetZero(outProp);
            clearAnimationAndSetZero(dotProp);

            if (hadKeys) {
                clearedItems.push(item);
            }
        }

        return clearedItems;
    }

    function rebuildAnimation(prop, startTime, endTime) {
        if (!prop) return false;

        var firstStyle = captureKeyStyle(prop, 1);
        var secondStyle = captureKeyStyle(prop, 2);

        removeAllKeys(prop);

        prop.setValueAtTime(startTime, 0);
        prop.setValueAtTime(endTime, 100);

        applyKeyStyle(prop, 1, firstStyle);
        applyKeyStyle(prop, 2, secondStyle);

        return true;
    }


    // ========================================================
    // DOT SCALE ANIMATION
    // ========================================================
    //
    // Dot-scale-X is now a real Essential Property controller.
    //
    // IN:
    // marker X           = 0
    // marker X + 7f      = 100
    //
    // OUT:
    // Text-out-X start   = 100
    // + 7f               = 0
    //
    // ========================================================

    function rebuildDotInAnimation(prop, startTime, endTime) {
        if (!prop) return false;

        var firstStyle = captureKeyStyle(prop, 1);
        var secondStyle = captureKeyStyle(prop, 2);

        removeAllKeys(prop);

        prop.setValueAtTime(startTime, 0);
        prop.setValueAtTime(endTime, 100);

        applyKeyStyle(prop, 1, firstStyle);
        applyKeyStyle(prop, 2, secondStyle);

        return true;
    }

    function addDotOutAnimation(prop, startTime, endTime) {
        if (!prop) return false;

        // Reuse the dot's IN easing style for the OUT pair.
        var firstStyle = captureKeyStyle(prop, 1);
        var secondStyle = captureKeyStyle(prop, 2);

        prop.setValueAtTime(startTime, 100);
        prop.setValueAtTime(endTime, 0);

        var startKey = prop.nearestKeyIndex(startTime);
        var endKey = prop.nearestKeyIndex(endTime);

        applyKeyStyle(prop, startKey, firstStyle);
        applyKeyStyle(prop, endKey, secondStyle);

        return true;
    }


    // ========================================================
    // DYNAMIC OUT
    // ========================================================

    function buildDynamicOut(
        comp,
        essentialGroup,
        outMarkerTime,
        outItems,
        missingItems
    ) {
        var frameDuration = comp.frameDuration;
        var speedFactor = outSpeedSlider.value / 100;
        var visibleIndex = 0;

        for (var listIndex = 0; listIndex < outItems.length; listIndex++) {
            var outItem = outItems[listIndex];
            var outName = "Text-out-" + outItem;
            var textName = "main-text-" + outItem;
            var dotName = "Dot-scale-" + outItem;

            var outProp = findPropertyByName(essentialGroup, outName);
            var textProp = findPropertyByName(essentialGroup, textName);
            var dotProp = findPropertyByName(essentialGroup, dotName);

            if (!outProp) {
                missingItems.push(outName);
                continue;
            }

            if (!textProp) {
                missingItems.push(textName);
                continue;
            }

            if (!dotProp) {
                missingItems.push(dotName);
                continue;
            }

            var currentText = getTextString(textProp, comp.time);

            // Blank text = no animation keys at all.
            if (!textHasContent(currentText)) {
                clearAnimationAndSetZero(outProp);
                clearAnimationAndSetZero(dotProp);
                continue;
            }

            var outStagger =
                OUT_STAGGER_FRAMES * TIME_MULTIPLIER / speedFactor;

            var outStartTime =
                outMarkerTime + visibleIndex * outStagger * frameDuration;

            var outDurationFrames;

            if (DYNAMIC_OUT_DURATION) {
                outDurationFrames =
                    getTextDurationFrames(currentText) / speedFactor;
            } else {
                outDurationFrames =
                    OUT_DURATION_FRAMES * TIME_MULTIPLIER / speedFactor;
            }

            outDurationFrames = Math.max(
                SMART_MIN_DURATION_FRAMES,
                outDurationFrames
            );

            var outEndTime =
                outStartTime + outDurationFrames * frameDuration;

            rebuildAnimation(outProp, outStartTime, outEndTime);

            addDotOutAnimation(
                dotProp,
                outStartTime,
                outStartTime + DOT_ANIM_FRAMES * frameDuration
            );

            visibleIndex++;
        }
    }


    // ========================================================
    // SMART OUT
    // ========================================================

    function buildSmartOut(
        comp,
        essentialGroup,
        outMarkerTime,
        outItems,
        missingItems
    ) {
        var frameDuration = comp.frameDuration;
        var speedFactor = outSpeedSlider.value / 100;

        var previousStart = null;
        var previousEnd = null;
        var previousDurationFrames = null;
        var visibleIndex = 0;

        var smartEndGapFrames =
            SMART_END_GAP_FRAMES * TIME_MULTIPLIER / speedFactor;

        for (var listIndex = 0; listIndex < outItems.length; listIndex++) {
            var outItem = outItems[listIndex];
            var outName = "Text-out-" + outItem;
            var textName = "main-text-" + outItem;
            var dotName = "Dot-scale-" + outItem;

            var outProp = findPropertyByName(essentialGroup, outName);
            var textProp = findPropertyByName(essentialGroup, textName);
            var dotProp = findPropertyByName(essentialGroup, dotName);

            if (!outProp) {
                missingItems.push(outName);
                continue;
            }

            if (!textProp) {
                missingItems.push(textName);
                continue;
            }

            if (!dotProp) {
                missingItems.push(dotName);
                continue;
            }

            var currentText = getTextString(textProp, comp.time);

            // Blank text = no OUT keys and no dot keys.
            if (!textHasContent(currentText)) {
                clearAnimationAndSetZero(outProp);
                clearAnimationAndSetZero(dotProp);
                continue;
            }

            var durationFrames =
                getTextDurationFrames(currentText) / speedFactor;

            durationFrames = Math.max(
                SMART_MIN_DURATION_FRAMES,
                durationFrames
            );

            var startTime;

            if (previousStart === null) {
                startTime = outMarkerTime;
            } else {
                var progress =
                    SMART_START_PROGRESS *
                    Math.pow(
                        SMART_STAGGER_ACCELERATION,
                        visibleIndex - 1
                    );

                progress = Math.max(
                    SMART_MIN_PROGRESS,
                    progress
                );

                startTime =
                    previousStart +
                    previousDurationFrames *
                    progress *
                    frameDuration;

                var candidateEnd =
                    startTime + durationFrames * frameDuration;

                var minimumEnd =
                    previousEnd + smartEndGapFrames * frameDuration;

                if (candidateEnd < minimumEnd) {
                    startTime += minimumEnd - candidateEnd;
                }
            }

            var endTime =
                startTime + durationFrames * frameDuration;

            rebuildAnimation(outProp, startTime, endTime);

            // Dot scales out at the start of this item's OUT animation.
            addDotOutAnimation(
                dotProp,
                startTime,
                startTime + DOT_ANIM_FRAMES * frameDuration
            );

            previousStart = startTime;
            previousEnd = endTime;
            previousDurationFrames = durationFrames;
            visibleIndex++;
        }
    }


    // ========================================================
    // RUN
    // ========================================================

    function runSequence() {
        var context = getSelectedContext();

        if (!context.valid) {
            setStatus(context.message);
            return;
        }

        var comp = context.comp;
        var layer = context.layer;
        var frameDuration = comp.frameDuration;
        var essentialGroup = layer.property("ADBE Layer Overrides");

        if (!essentialGroup) {
            setStatus("Selected layer has no Essential Properties.");
            return;
        }

        saveUISettings();
        app.beginUndoGroup("Build Text Sequence");

        try {
            var missingItems = [];

            // =================================================
            // STEP 1 - WRITE TEXT
            // =================================================

            if (!ignoreTextCheckbox.value) {
                for (var textIndex = 1; textIndex <= getItemCount(); textIndex++) {
                    var inputText = textInputs[textIndex - 1].text;
                    var textPropertyName = "main-text-" + textIndex;
                    var textProp = findPropertyByName(
                        essentialGroup,
                        textPropertyName
                    );

                    if (!textProp) {
                        missingItems.push(textPropertyName);
                        continue;
                    }

                    if (!setTextPropertyExpression(textProp, inputText)) {
                        missingItems.push("Could not set " + textPropertyName);
                    }
                }
            }

            // =================================================
            // STEP 2 - DOT IN + TEXT IN
            // =================================================
            //
            // marker X:
            // Dot-scale-X starts 0 -> 100 over 7 frames.
            //
            // marker X + 4 frames:
            // Text-in-X starts 0 -> 100.
            //
            // In Speed changes only the text IN duration.
            // =================================================

            var inSpeedFactor = inSpeedSlider.value / 100;
            var visibleItemMap = {};

            for (var item = 1; item <= getItemCount(); item++) {
                var textName = "main-text-" + item;
                var inName = "Text-in-" + item;
                var outName = "Text-out-" + item;
                var dotName = "Dot-scale-" + item;

                var currentTextProp = findPropertyByName(
                    essentialGroup,
                    textName
                );

                var inProp = findPropertyByName(
                    essentialGroup,
                    inName
                );

                var outProp = findPropertyByName(
                    essentialGroup,
                    outName
                );

                var dotProp = findPropertyByName(
                    essentialGroup,
                    dotName
                );

                if (!currentTextProp) {
                    missingItems.push(textName);
                    continue;
                }

                if (!inProp) {
                    missingItems.push(inName);
                    continue;
                }

                if (!outProp) {
                    missingItems.push(outName);
                    continue;
                }

                if (!dotProp) {
                    missingItems.push(dotName);
                    continue;
                }

                var currentText = getTextString(
                    currentTextProp,
                    comp.time
                );

                // Blank text = no IN, OUT or DOT keyframes.
                if (!textHasContent(currentText)) {
                    clearAnimationAndSetZero(inProp);
                    clearAnimationAndSetZero(outProp);
                    clearAnimationAndSetZero(dotProp);
                    continue;
                }

                visibleItemMap[String(item)] = true;

                // Clear any OUT animation left by a marker that was removed
                // or changed since the previous run.
                clearAnimationAndSetZero(outProp);

                var markerTime = findMarkerTime(
                    comp,
                    layer,
                    String(item)
                );

                if (markerTime === null) {
                    missingItems.push("Marker _" + item);
                    continue;
                }

                // Dot IN starts exactly on the marker.
                rebuildDotInAnimation(
                    dotProp,
                    markerTime,
                    markerTime + DOT_ANIM_FRAMES * frameDuration
                );

                // Text starts 4 frames later.
                var textInStart =
                    markerTime + TEXT_IN_DELAY_FRAMES * frameDuration;

                var textInDurationFrames =
                    getTextDurationFrames(currentText) / inSpeedFactor;

                textInDurationFrames = Math.max(
                    MIN_TEXT_ANIM_FRAMES,
                    textInDurationFrames
                );

                var textInEnd =
                    textInStart +
                    textInDurationFrames *
                    frameDuration;

                rebuildAnimation(
                    inProp,
                    textInStart,
                    textInEnd
                );
            }

            var removedEmptyMarkers = removeEmptyInMarkers(
                layer,
                visibleItemMap
            );

            // =================================================
            // STEP 3 - TEXT OUT + DOT OUT
            // =================================================

            var hasVisibleText = false;

            for (var checkIndex = 1; checkIndex <= getItemCount(); checkIndex++) {
                if (visibleItemMap[String(checkIndex)] === true) {
                    hasVisibleText = true;
                    break;
                }
            }

            var rawOutGroups = collectOutMarkers(
                comp,
                layer,
                getItemCount()
            );

            var outGroups = resolveOutMarkerGroups(
                rawOutGroups,
                visibleItemMap
            );

            var usedLegacyOutMarker = false;

            if (hasVisibleText) {
                if (rawOutGroups.length === 0) {
                    missingItems.push(
                        "OUT marker all- or a grouped marker such as 1,2,3-"
                    );
                } else {
                    for (var groupIndex = 0; groupIndex < outGroups.length; groupIndex++) {
                        var outGroup = outGroups[groupIndex];

                        if (outGroup.isLegacy) {
                            usedLegacyOutMarker = true;
                        }

                        if (outModeDropdown.selection.index === 0) {
                            buildSmartOut(
                                comp,
                                essentialGroup,
                                outGroup.time,
                                outGroup.items,
                                missingItems
                            );
                        } else {
                            buildDynamicOut(
                                comp,
                                essentialGroup,
                                outGroup.time,
                                outGroup.items,
                                missingItems
                            );
                        }
                    }
                }
            }

            // Clean empty controllers across all 1-6 slots, including slots
            // that do not currently have a visible UI text row.
            var clearedEmptyItems = clearAllEmptyItemAnimations(
                comp,
                essentialGroup
            );

            // =================================================
            // STATUS
            // =================================================

            if (missingItems.length > 0) {
                setStatus(
                    "Finished. Missing/errors: " +
                    missingItems.join(", ")
                );
            } else {
                var textState =
                    ignoreTextCheckbox.value
                    ? " / Text ignored"
                    : "";

                var markerState =
                    usedLegacyOutMarker
                    ? " / Legacy OUT marker"
                    : "";

                var cleanupState =
                    removedEmptyMarkers > 0
                    ? " / Removed " + removedEmptyMarkers + " empty IN markers"
                    : "";

                var emptyAnimationState =
                    clearedEmptyItems.length > 0
                    ? " / Cleared empty animations: " + clearedEmptyItems.join(",")
                    : "";

                setStatus(
                    "Done. In " +
                    Math.round(inSpeedSlider.value) +
                    "% / Out " +
                    outModeDropdown.selection.text +
                    " " +
                    Math.round(outSpeedSlider.value) +
                    "%" +
                    textState +
                    markerState +
                    cleanupState +
                    emptyAnimationState
                );
            }

        } catch (err) {
            setStatus("Run error: " + err.toString());
        } finally {
            app.endUndoGroup();
        }
    }


    // ========================================================
    // BUTTONS / WINDOW
    // ========================================================

    readButton.onClick = function () {
        readText();
    };

    markerButton.onClick = function () {
        addOrFixMarkers();
    };

    closeButton.onClick = function () {
        saveUISettings();
        win.close();
    };

    runButton.onClick = function () {
        runSequence();
    };

    win.onClose = function () {
        saveUISettings();
        $.global.textSequenceBuilderWindow = null;
        return true;
    };

    win.onResizing =
    win.onResize = function () {
        this.layout.resize();
    };

    win.layout.layout(true);

    try {
        if (win.size.width < 620) {
            win.size = [620, win.size.height];
        }

        win.layout.resize();
    } catch (sizeError) {}

    win.center();
    win.show();

})();
