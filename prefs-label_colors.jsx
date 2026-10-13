{
    // Label colors/names live under the MACHINE_INDEPENDENT pref file
    // (Prefs-indep-general.txt), not the default MACHINE_SPECIFIC one — that's the
    // parameter every earlier attempt was missing. Confirmed by reading the real file
    // directly: its "Label Preference Color Section 5" / "Label Preference Text Section 7"
    // hold the actual live values (matched hand-typed names like "Red"/"Yellow" exactly).
    var PT = PREFType.PREF_Type_MACHINE_INDEPENDENT;
    var COLOR_SECTION = "Label Preference Color Section 5";
    var NAME_SECTION_A = "Label Preference Text Section 5";
    var NAME_SECTION_B = "Label Preference Text Section 7";
    var KEY_PREFIX = "Label Color ID 2 # ";
    var NAME_KEY_PREFIX = "Label Text ID 2 # ";

    // Hardcoded to this exact install — adjust the version folder if AE updates.
    var PREFS_FILE_PATH = "C:/Users/kissr/AppData/Roaming/Adobe/After Effects/26.5/Adobe After Effects 26.5 Prefs-indep-general.txt";

    // app.preferences.savePrefAsString/Long always serializes quoted — but the real,
    // working entries in this file are unquoted hex ("FFE8920D", no quotes). This patches
    // the text directly to match that exact native format, bypassing the API's own writer
    // for just this one value.
    function patchColorInFile(sectionName, key, newValueUnquoted) {
        var f = new File(PREFS_FILE_PATH);
        if (!f.exists) throw new Error("Prefs file not found: " + PREFS_FILE_PATH);

        f.encoding = "UTF-8";
        f.open("r");
        var content = f.read();
        f.close();

        var lines = content.split("\n");
        var inSection = false;
        var found = false;
        var keyPattern = "\"" + key + "\"";

        for (var i = 0; i < lines.length; i++) {
            var line = lines[i];
            if (line.indexOf("[\"" + sectionName + "\"]") === 0) {
                inSection = true;
                continue;
            }
            if (inSection && line.length > 0 && line.charAt(0) === "[") {
                inSection = false;
            }
            if (inSection && line.indexOf(keyPattern) !== -1) {
                lines[i] = "\t" + keyPattern + " = " + newValueUnquoted;
                found = true;
                break;
            }
        }

        if (!found) throw new Error("Key not found in file: " + key);

        f.open("w");
        f.write(lines.join("\n"));
        f.close();
    }

    function backupPrefsFile() {
        var src = new File(PREFS_FILE_PATH);
        src.copy(PREFS_FILE_PATH + ".kiriss-backup");
    }

    // Adobe's genuine factory defaults — verified against the actual raw prefs file bytes.
    var DEFAULT_NAMES = [
        "Red", "Yellow", "Aqua", "Pink", "Lavender", "Peach", "Sea Foam", "Blue",
        "Green", "Purple", "Orange", "Brown", "Fuchsia", "Cyan", "Sandstone", "Dark Green"
    ];
    var DEFAULT_COLORS = [
        [0xB5, 0x38, 0x38], [0xE4, 0xD8, 0x4C], [0xA9, 0xCB, 0xC7], [0xE5, 0xBC, 0xC9],
        [0xA9, 0xA9, 0xCA], [0xE7, 0xC1, 0x9E], [0xB3, 0xC7, 0xB3], [0x67, 0x7D, 0xE0],
        [0x4A, 0xA4, 0x4C], [0x8E, 0x2C, 0x9A], [0xE8, 0x92, 0x0D], [0x7F, 0x45, 0x2A],
        [0xF4, 0x6D, 0xD6], [0x3D, 0xA2, 0xA5], [0xA8, 0x96, 0x77], [0x1E, 0x40, 0x1E]
    ];

    function clampByte(v) {
        v = Math.round(v);
        if (isNaN(v)) return 128;
        if (v < 0) return 0;
        if (v > 255) return 255;
        return v;
    }

    function toHex2(v) {
        var s = clampByte(v).toString(16).toUpperCase();
        return s.length < 2 ? "0" + s : s;
    }

    function readLabelName(n) {
        try {
            var raw = app.preferences.getPrefAsString(NAME_SECTION_B, NAME_KEY_PREFIX + n, PT);
            return raw ? raw : DEFAULT_NAMES[n - 1];
        } catch (e) {
            return DEFAULT_NAMES[n - 1];
        }
    }

    // Colors on disk can now be in two shapes depending on how they were last written:
    // unquoted hex text ("FFE93D82", from our raw file patch or AE's own native writer)
    // or a quoted Long (from the earlier savePrefAsLong attempt). Try hex-as-string first
    // since that's what Apply produces now and what genuine entries use, then fall back.
    function readLabelColor(n) {
        try {
            var raw = app.preferences.getPrefAsString(COLOR_SECTION, KEY_PREFIX + n, PT);
            var hex = raw ? raw.replace(/[^0-9A-Fa-f]/g, "") : "";
            if (hex.length >= 8) {
                return [clampByte(parseInt(hex.substr(2, 2), 16)), clampByte(parseInt(hex.substr(4, 2), 16)), clampByte(parseInt(hex.substr(6, 2), 16))];
            } else if (hex.length >= 6) {
                return [clampByte(parseInt(hex.substr(0, 2), 16)), clampByte(parseInt(hex.substr(2, 2), 16)), clampByte(parseInt(hex.substr(4, 2), 16))];
            }
        } catch (e) {}
        try {
            var packed = app.preferences.getPrefAsLong(COLOR_SECTION, KEY_PREFIX + n, PT);
            if (packed) {
                return [(packed >> 16) & 0xFF, (packed >> 8) & 0xFF, packed & 0xFF];
            }
        } catch (e2) {}
        return [128, 128, 128];
    }

    function writeLabelName(n, name) {
        app.preferences.savePrefAsString(NAME_SECTION_A, NAME_KEY_PREFIX + n, name, PT);
        app.preferences.savePrefAsString(NAME_SECTION_B, NAME_KEY_PREFIX + n, name, PT);
    }

    function writeLabelColor(n, rgb) {
        var r = clampByte(rgb[0]), g = clampByte(rgb[1]), b = clampByte(rgb[2]);
        var packed = (0xFF << 24) | (r << 16) | (g << 8) | b;
        app.preferences.savePrefAsLong(COLOR_SECTION, KEY_PREFIX + n, packed, PT);
    }

    // Same temp-shape + "Edit Value..." trick as select-comp_background_custom.jsx.
    function pickColor(startRGB255) {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Open/select a composition first — a temporary layer is needed to host the color picker.");
            return null;
        }
        var tempLayer = comp.layers.addShape();
        var colorEffect = tempLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
        var colorProp = colorEffect.property("ADBE Color Control-0001");
        colorProp.setValue([startRGB255[0] / 255, startRGB255[1] / 255, startRGB255[2] / 255, 1]);
        colorProp.selected = true;
        app.executeCommand(2240); // Edit Value...
        var picked = colorProp.value;
        tempLayer.remove();
        return [Math.round(picked[0] * 255), Math.round(picked[1] * 255), Math.round(picked[2] * 255)];
    }

    function setSwatch(entry) {
        var g = entry.swatch.graphics;
        var r = clampByte(entry.rgb[0]) / 255;
        var gr = clampByte(entry.rgb[1]) / 255;
        var b = clampByte(entry.rgb[2]) / 255;
        g.backgroundColor = g.newBrush(g.BrushType.SOLID_COLOR, [r, gr, b, 1]);
    }

    var win = new Window("dialog", "Kiriss Label Palette");
    win.orientation = "column";
    win.alignChildren = ["fill", "top"];
    win.spacing = 10;
    win.margins = 14;

    var infoText = win.add("statictext", undefined,
        "Click a color swatch to change it. Save/Load Template to reuse a palette as JSON. " +
        "Apply to After Effects writes all 16 into Preferences > Labels directly — verify " +
        "it took by reopening that panel afterward.",
        { multiline: true }
    );
    infoText.preferredSize.width = 480;

    var columnsGroup = win.add("group");
    columnsGroup.spacing = 20;

    var colA = columnsGroup.add("group");
    colA.orientation = "column";
    colA.alignChildren = ["left", "top"];
    colA.spacing = 5;

    var colB = columnsGroup.add("group");
    colB.orientation = "column";
    colB.alignChildren = ["left", "top"];
    colB.spacing = 5;

    var rows = [];

    function hexOf(rgb) {
        return "#" + toHex2(rgb[0]) + toHex2(rgb[1]) + toHex2(rgb[2]);
    }

    function makeRow(container, id) {
        var row = container.add("group");
        row.orientation = "row";
        row.alignChildren = ["left", "center"];
        row.spacing = 6;

        var nameInput = row.add("edittext", undefined, readLabelName(id));
        nameInput.characters = 11;

        var swatch = row.add("panel");
        swatch.preferredSize = [40, 20];
        swatch.helpTip = "Click to change this color";

        var hexText = row.add("edittext", undefined, "");
        hexText.characters = 8;
        hexText.helpTip = "Hex code — select and copy to paste into AE's real color picker";

        var entry = { id: id, nameInput: nameInput, swatch: swatch, hexText: hexText, rgb: readLabelColor(id) };
        setSwatch(entry);
        hexText.text = hexOf(entry.rgb);

        swatch.addEventListener("click", function () {
            var result = pickColor(entry.rgb);
            if (result) {
                entry.rgb = result;
                setSwatch(entry);
                hexText.text = hexOf(entry.rgb);
            }
        });

        rows.push(entry);
    }

    for (var n = 1; n <= 8; n++) makeRow(colA, n);
    for (var n2 = 9; n2 <= 16; n2++) makeRow(colB, n2);

    var templateGroup = win.add("group");
    templateGroup.alignment = "center";
    var refreshBtn = templateGroup.add("button", undefined, "Refresh from AE");
    var defaultsBtn = templateGroup.add("button", undefined, "Load AE Defaults");
    var saveTemplateBtn = templateGroup.add("button", undefined, "Save Template…");
    var loadTemplateBtn = templateGroup.add("button", undefined, "Load Template…");

    defaultsBtn.onClick = function () {
        for (var i = 0; i < rows.length; i++) {
            rows[i].nameInput.text = DEFAULT_NAMES[i];
            rows[i].rgb = DEFAULT_COLORS[i].slice();
            setSwatch(rows[i]);
            rows[i].hexText.text = hexOf(rows[i].rgb);
        }
    };

    refreshBtn.onClick = function () {
        for (var i = 0; i < rows.length; i++) {
            var name = readLabelName(rows[i].id);
            var rgb = readLabelColor(rows[i].id);
            rows[i].nameInput.text = name;
            rows[i].rgb = rgb;
            setSwatch(rows[i]);
            rows[i].hexText.text = hexOf(rgb);
        }
    };

    function parseHexColor(hex) {
        hex = (hex || "").replace(/^#/, "");
        if (hex.length >= 6) {
            return [
                clampByte(parseInt(hex.substr(0, 2), 16)),
                clampByte(parseInt(hex.substr(2, 2), 16)),
                clampByte(parseInt(hex.substr(4, 2), 16))
            ];
        }
        return [128, 128, 128];
    }

    // Saves in the same {app, assignments, labels:[{name,color}], designer, url} shape
    // Labels v4 uses for its .theme exports, so files are cross-compatible either way.
    saveTemplateBtn.onClick = function () {
        var file = File.saveDialog("Save label theme", "*.theme");
        if (!file) return;
        if (!/\.theme$/i.test(file.fsName)) file = new File(file.fsName + ".theme");

        var data = {
            app: { name: "Adobe After Effects", version: "" },
            assignments: {},
            labels: [],
            designer: "",
            url: ""
        };
        for (var i = 0; i < rows.length; i++) {
            data.labels.push({ name: rows[i].nameInput.text, color: hexOf(rows[i].rgb) });
        }

        file.encoding = "UTF-8";
        file.open("w");
        file.write(JSON.stringify(data, null, 4));
        file.close();
        alert("Saved: " + file.fsName);
    };

    // Reads either our own format ({id, name, rgb}) or a Labels v4 .theme file
    // ({name, color: "#RRGGBB"}, matched by array position instead of an id).
    loadTemplateBtn.onClick = function () {
        var file = File.openDialog("Load label theme/template", "*.theme;*.json;*.*");
        if (!file) return;

        file.encoding = "UTF-8";
        file.open("r");
        var text = file.read();
        file.close();

        var data;
        try {
            data = JSON.parse(text);
        } catch (e) {
            alert("Couldn't read that file: " + e.message);
            return;
        }

        if (!data || !data.labels) {
            alert("That file doesn't look like a label theme/template.");
            return;
        }

        for (var i = 0; i < data.labels.length; i++) {
            var item = data.labels[i];
            var id = (item.id !== undefined) ? item.id : (i + 1);
            var rgb = item.rgb ? item.rgb : parseHexColor(item.color);

            for (var j = 0; j < rows.length; j++) {
                if (rows[j].id === id) {
                    rows[j].nameInput.text = item.name;
                    rows[j].rgb = rgb;
                    setSwatch(rows[j]);
                    rows[j].hexText.text = hexOf(rgb);
                    break;
                }
            }
        }
    };

    var actionGroup = win.add("group");
    actionGroup.alignment = "center";
    var closeBtn = actionGroup.add("button", undefined, "Close");
    var kandoBtn = actionGroup.add("button", undefined, "Update Kando Labels");
    var applyBtn = actionGroup.add("button", undefined, "Apply to After Effects");

    closeBtn.onClick = function () { win.close(); };

    // Renders each row's color as a 50x50 PNG (matching the existing files exactly) via
    // AE's own render pipeline, plus a matching hex-code list — no names, colors only.
    kandoBtn.onClick = function () {
        var outDir = "W:/_personal_online/kiriss_ae/labels/";
        if (!new Folder(outDir).exists) {
            alert("Folder not found: " + outDir);
            return;
        }

        app.beginUndoGroup("Kiriss Update Kando Labels");

        var tempComp = app.project.items.addComp("KirissTempLabelRender", 50, 50, 1, 1, 1);
        tempComp.openInViewer();
        var shapeLayer = tempComp.layers.addShape();
        var group = shapeLayer.property("ADBE Root Vectors Group").addProperty("ADBE Vector Group");
        var groupContents = group.property("ADBE Vectors Group");
        var rect = groupContents.addProperty("ADBE Vector Shape - Rect");
        rect.property("ADBE Vector Rect Size").setValue([50, 50]);
        rect.property("ADBE Vector Rect Position").setValue([0, 0]);
        var fill = groupContents.addProperty("ADBE Vector Graphic - Fill");
        shapeLayer.property("ADBE Transform Group").property("ADBE Position").setValue([25, 25]);

        var hexLines = [];
        var failures = [];

        for (var i = 0; i < rows.length; i++) {
            var rgb = rows[i].rgb;
            fill.property("ADBE Vector Fill Color").setValue([
                clampByte(rgb[0]) / 255, clampByte(rgb[1]) / 255, clampByte(rgb[2]) / 255
            ]);

            var pngPath = outDir + "color" + rows[i].id + ".png";
            var pngFile = new File(pngPath);
            try {
                if (pngFile.exists) pngFile.remove();
                tempComp.saveFrameToPng(0, pngFile);
                // Fresh File instance for the check — .exists can be stale on the same
                // object right after an external write.
                if (!new File(pngPath).exists) failures.push(String(rows[i].id));
            } catch (e) {
                failures.push(rows[i].id + " (" + e.message + ")");
            }

            hexLines.push(hexOf(rgb).toLowerCase());
        }

        tempComp.remove();
        app.endUndoGroup();

        var txtFile = new File(outDir + "labels_1 .txt");
        txtFile.encoding = "UTF-8";
        txtFile.open("w");
        txtFile.write(hexLines.join("\n"));
        txtFile.close();

        if (failures.length === 0) {
            alert("Updated 16 color PNGs + labels_1 .txt in:\n" + outDir);
        } else {
            alert("labels_1 .txt updated, but these PNGs failed: " + failures.join(", ") + "\nCheck permissions/availability of " + outDir);
        }
    };

    applyBtn.onClick = function () {
        // Names go through the normal, working API first and get properly persisted.
        app.beginUndoGroup("Kiriss Label Palette Apply");
        for (var i = 0; i < rows.length; i++) {
            writeLabelName(rows[i].id, rows[i].nameInput.text);
        }
        app.preferences.saveToDisk();
        app.endUndoGroup();

        // Colors: patch the file directly (unquoted hex, matching AE's own native
        // format) as the LAST write, so saveToDisk() above can't clobber it. Then
        // reload() so app.preferences' own cache re-syncs with our edit.
        var patchOk = true;
        var patchError = "";
        try {
            backupPrefsFile();
            for (var k = 0; k < rows.length; k++) {
                var hex = "FF" + toHex2(rows[k].rgb[0]) + toHex2(rows[k].rgb[1]) + toHex2(rows[k].rgb[2]);
                patchColorInFile(COLOR_SECTION, KEY_PREFIX + rows[k].id, hex);
            }
            try { app.preferences.reload(); } catch (e2) {}
        } catch (e) {
            patchOk = false;
            patchError = e.message;
        }

        if (patchOk) {
            alert("Applied. Names via the API; colors via a direct file patch matching AE's native unquoted-hex format (a backup of the prefs file was saved alongside it). This is genuinely new territory — check Edit > Preferences > Labels now and verify carefully.");
        } else {
            alert("Names applied. Color file patch failed: " + patchError);
        }
    };

    win.center();
    win.show();
}
