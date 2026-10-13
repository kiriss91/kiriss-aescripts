{
    function getSelectedLayers() {
        var comp = app.project.activeItem;
        if (comp && comp instanceof CompItem && comp.selectedLayers.length > 0) {
            return comp.selectedLayers;
        }
        return null;
    }

    var layers = getSelectedLayers();

    if (!layers) {
        alert("Select one or more layers first.");
    } else {

        // Edit these lists to extend the system — buttons are generated from them.
        var TYPES = ["ic", "cp", "av", "bt", "cd", "gr"];
        var ROLES = ["root", "main", "bg", "fx", "bdg", "lbl", "msk", "grp"];

        // Words the Keywords box understands, mapped to a type code.
        var KEYWORD_TYPE_MAP = {
            icon: "ic", icons: "ic",
            comp: "cp", composition: "cp", precomp: "cp",
            avatar: "av", profile: "av", pfp: "av",
            button: "bt", btn: "bt",
            card: "cd",
            group: "gr", container: "gr"
        };

        function parseKeywords(text) {
            var words = text.toLowerCase().split(/[\s,]+/);
            var types = [];
            var extras = [];
            for (var i = 0; i < words.length; i++) {
                var w = words[i];
                if (!w) continue;
                var t = KEYWORD_TYPE_MAP[w];
                if (t) {
                    var already = false;
                    for (var j = 0; j < types.length; j++) {
                        if (types[j] === t) { already = true; break; }
                    }
                    if (!already) types.push(t);
                } else {
                    extras.push(w);
                }
            }
            return { types: types, extra: extras.join("-") };
        }

        var win = new Window("dialog", "Kiriss Renamer");
        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 8;
        win.margins = 14;

        var currentType = null;
        var currentRole = null;
        var typeButtons = {};
        var roleButtons = {};

        function pad(num, size) {
            var s = String(num);
            while (s.length < size) s = "0" + s;
            return s;
        }

        function buildName(type, role, index, extra) {
            if (!type || !role) return null;
            var name = type;
            if (index !== "" && index !== null && index !== undefined && !isNaN(index)) {
                name += pad(parseInt(index, 10), 2);
            }
            name += "-" + role;
            if (extra) name += "-" + extra;
            return name;
        }

        function updatePreview() {
            if (smartCheck.value) {
                previewText.text = "→ auto-detect per layer (ignores buttons)";
                return;
            }
            var name = buildName(currentType, currentRole, indexInput.text, extraInput.text);
            previewText.text = name ? ("→ " + name) : "→ pick a type and role";
        }

        function highlightSelection(buttonMap, activeCode) {
            for (var code in buttonMap) {
                if (buttonMap.hasOwnProperty(code)) {
                    buttonMap[code].text = (code === activeCode)
                        ? ("[" + code.toUpperCase() + "]")
                        : code.toUpperCase();
                }
            }
        }

        // ---- Type row ----
        win.add("statictext", undefined, "Type");
        var typeGroup = win.add("group");
        typeGroup.spacing = 4;
        for (var i = 0; i < TYPES.length; i++) {
            (function (code) {
                var b = typeGroup.add("button", undefined, code.toUpperCase());
                b.preferredSize.width = 46;
                typeButtons[code] = b;
                b.onClick = function () {
                    currentType = code;
                    highlightSelection(typeButtons, code);
                    updatePreview();
                };
            })(TYPES[i]);
        }

        // ---- Role rows (split so the dialog doesn't get too wide) ----
        win.add("statictext", undefined, "Role");
        var roleGroup1 = win.add("group");
        roleGroup1.spacing = 4;
        var roleGroup2 = win.add("group");
        roleGroup2.spacing = 4;
        var half = Math.ceil(ROLES.length / 2);
        for (var j = 0; j < ROLES.length; j++) {
            (function (code, targetGroup) {
                var b = targetGroup.add("button", undefined, code.toUpperCase());
                b.preferredSize.width = 56;
                roleButtons[code] = b;
                b.onClick = function () {
                    currentRole = code;
                    highlightSelection(roleButtons, code);
                    updatePreview();
                };
            })(ROLES[j], j < half ? roleGroup1 : roleGroup2);
        }

        // ---- Index + Extra ----
        var optRow = win.add("group");
        optRow.add("statictext", undefined, "Index:");
        var indexInput = optRow.add("edittext", undefined, "");
        indexInput.characters = 4;
        indexInput.helpTip = "Optional. Blank = no number. If set, auto-increments across the selection.";
        indexInput.onChanging = updatePreview;

        optRow.add("statictext", undefined, "  Extra:");
        var extraInput = optRow.add("edittext", undefined, "");
        extraInput.characters = 10;
        extraInput.helpTip = "Optional extra suffix, e.g. 'shape' for icX-bdg-shape.";
        extraInput.onChanging = updatePreview;

        // ---- Preview ----
        var previewText = win.add("statictext", undefined, "→ pick a type and role");
        previewText.graphics.font = ScriptUI.newFont(previewText.graphics.font.name, "BOLD", 13);

        // ---- Smart renamer ----
        var smartCheck = win.add("checkbox", undefined, "Smart Rename (auto-detect per layer, ignores everything above)");
        smartCheck.value = true;

        var keywordGroup = win.add("group");
        keywordGroup.add("statictext", undefined, "Keywords:");
        var keywordInput = keywordGroup.add("edittext", undefined, "");
        keywordInput.characters = 30;
        keywordInput.helpTip = "e.g. \"icon avatar\" — recognized words: " + (function () {
            var out = [];
            for (var w in KEYWORD_TYPE_MAP) if (KEYWORD_TYPE_MAP.hasOwnProperty(w)) out.push(w);
            return out.join(", ");
        })();

        function updateEnabledState() {
            var enabled = !smartCheck.value;
            for (var c in typeButtons) typeButtons[c].enabled = enabled;
            for (var c2 in roleButtons) roleButtons[c2].enabled = enabled;
            indexInput.enabled = enabled;
            extraInput.enabled = enabled;
            updatePreview();
        }
        smartCheck.onClick = updateEnabledState;

        // ---- Action buttons ----
        var btnGroup = win.add("group");
        btnGroup.alignment = "center";
        var cancelBtn = btnGroup.add("button", undefined, "Cancel");
        var renameBtn = btnGroup.add("button", undefined, "Rename");

        function detectAuto(layer, keywordTypes) {
            var defaultType = (keywordTypes && keywordTypes.length > 0) ? keywordTypes[0] : null;
            var hasKeyword = function (t) {
                if (!keywordTypes) return false;
                for (var i = 0; i < keywordTypes.length; i++) if (keywordTypes[i] === t) return true;
                return false;
            };

            if (layer.nullLayer) {
                return { type: defaultType || "nl", role: "root" };
            }
            if (layer instanceof TextLayer) {
                return { type: defaultType || "tx", role: "lbl" };
            }
            if (layer instanceof ShapeLayer) {
                return { type: defaultType || "sh", role: "shape" };
            }
            if (layer instanceof AVLayer && layer.source) {
                if (layer.source instanceof CompItem) {
                    return { type: defaultType || "cp", role: "main" };
                }
                var main = layer.source.mainSource;
                if (main) {
                    if (main instanceof SolidSource) return { type: defaultType || "sl", role: "bg" };
                    if (main.isStill) {
                        // Still images are the most likely candidate for a specific
                        // keyword like "avatar" — prefer that over the general type.
                        var imgType = hasKeyword("av") ? "av" : (defaultType || "im");
                        return { type: imgType, role: "main" };
                    }
                    return { type: defaultType || "vi", role: "main" };
                }
            }
            return { type: defaultType || "ly", role: "main" };
        }

        function renameAll() {
            app.beginUndoGroup("Kiriss Renamer");

            if (smartCheck.value) {
                var parsed = parseKeywords(keywordInput.text);
                for (var i = 0; i < layers.length; i++) {
                    var guess = detectAuto(layers[i], parsed.types);
                    layers[i].name = buildName(guess.type, guess.role, "", parsed.extra);
                }
            } else {
                if (!currentType || !currentRole) {
                    alert("Pick a Type and a Role first.");
                    app.endUndoGroup();
                    return;
                }
                var useIndex = indexInput.text !== "";
                var startIdx = useIndex ? parseInt(indexInput.text, 10) : null;
                if (useIndex && isNaN(startIdx)) startIdx = 1;

                for (var k = 0; k < layers.length; k++) {
                    var idxVal = useIndex ? (startIdx + k) : "";
                    layers[k].name = buildName(currentType, currentRole, idxVal, extraInput.text);
                }
            }

            app.endUndoGroup();
            win.close();
        }

        renameBtn.onClick = renameAll;
        cancelBtn.onClick = function () { win.close(); };

        win.defaultElement = renameBtn;
        win.cancelElement = cancelBtn;

        win.onKeyDown = function (k) {
            if (k.keyName === "Escape") win.close();
        };

        updateEnabledState();
        win.center();
        win.show();
    }
}
