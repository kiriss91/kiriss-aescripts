// _DynamicDataLayerCreator_v21.jsx
#target aftereffects

(function () {
    var COMP_WIDTH      = 1080;
    var COMP_HEIGHT     = 1920;
    var COMP_FPS        = 30;
    var COMP_DURATION   = 60;
    var DATABASE_FOLDER = "_database";

    // ====================== HELPERS ======================
    function sanitizeName(str) {
        if (str == null) return "UNKNOWN";
        return str.toString().replace(/[^a-zA-Z0-9_]/g, "_");
    }

    function findItemByName(name) {
        for (var i = 1; i <= app.project.numItems; i++) {
            if (app.project.item(i).name === name) return app.project.item(i);
        }
        return null;
    }

    function getOrCreateFolder(name) {
        var f = findItemByName(name);
        if (f instanceof FolderItem) return f;
        return app.project.items.addFolder(name);
    }

    function getOrCreateComp(name, folder) {
        if (!name || name === "") name = "Data_Comp";
        var c = findItemByName(name);
        if (c instanceof CompItem) { c.parentFolder = folder; return c; }

        var comp = app.project.items.addComp(name, COMP_WIDTH, COMP_HEIGHT, 1, COMP_DURATION, COMP_FPS);
        comp.parentFolder = folder;
        return comp;
    }

    function findLayer(comp, name) {
        for (var i = 1; i <= comp.numLayers; i++) {
            if (comp.layer(i).name === name) return comp.layer(i);
        }
        return null;
    }

    function addOrUpdateEffect(layer, matchName, displayName, value) {
        var fx = layer.property("ADBE Effect Parade").property(displayName);
        if (!fx) {
            fx = layer.property("ADBE Effect Parade").addProperty(matchName);
            fx.name = displayName;
        }
        fx(1).setValue(matchName === "ADBE Checkbox Control" ? (value ? 1 : 0) : value);
    }

    function readJSON(path) {
        var file = new File(path);
        if (!file.exists) return null;
        file.open("r"); var txt = file.read(); file.close();
        try { return JSON.parse(txt); } catch(e) { return null; }
    }

    function detectArrayKey(obj) {
        for (var k in obj) {
            if (obj.hasOwnProperty(k) && Array.isArray(obj[k])) {
                return {key: k, array: obj[k]};
            }
        }
        return null;
    }

    // ====================== UI ======================
    function showUI() {
        var win = new Window("dialog", "Data Importer RAW");
        win.orientation = "column";
        win.alignChildren = ["fill","top"];
        win.spacing = 12;
        win.margins = 20;

        var g1 = win.add("group");
        g1.add("statictext", undefined, "JSON File(s):").preferredSize.width = 100;
        var jsonTxt = g1.add("edittext", undefined, Folder.desktop.fsName + "/data.json"); jsonTxt.characters = 50;
        var browse = g1.add("button", undefined, "Browse"); browse.size = [100,32];

        var g2 = win.add("group");
        g2.add("statictext", undefined, "Comp Name:").preferredSize.width = 100;
        var compNameTxt = g2.add("edittext", undefined, "data"); compNameTxt.characters = 50;

        var g3 = win.add("group");
        g3.add("statictext", undefined, "Identifier Key:").preferredSize.width = 100;
        var idKeyTxt = g3.add("edittext", undefined, "symbol"); idKeyTxt.characters = 30;

        var g4 = win.add("group");
        var allChk = g4.add("checkbox", undefined, "Process All Items"); allChk.value = true;
        var limitTxt = g4.add("edittext", undefined, "10"); limitTxt.characters = 6; limitTxt.enabled = false;
        allChk.onClick = function(){ limitTxt.enabled = !this.value; };

        var g5 = win.add("group");
        var previewChk = g5.add("checkbox", undefined, "Show Preview Field Titles"); previewChk.value = true;

        var btns = win.add("group");
        btns.alignment = "right";
        var cancel = btns.add("button", undefined, "Cancel");
        var ok = btns.add("button", undefined, "Create Layers"); ok.size = [140,38];

        browse.onClick = function(){
            var files = File.openDialog("Select JSON(s)", "*.json", true);
            if (files) jsonTxt.text = files.map(function(f){return f.fsName;}).join("; ");
        };

        var result = {cancelled: true};
        ok.onClick = function(){
            var paths = jsonTxt.text.split(";").map(function(s){return s.trim();}).filter(Boolean);
            if (paths.length === 0) { alert("Select JSON file."); return; }
            result = {
                cancelled: false,
                jsonPaths: paths,
                compName: compNameTxt.text.trim() || "data",
                idKey: idKeyTxt.text.trim() || "symbol",
                processAll: allChk.value,
                limit: parseInt(limitTxt.text)||10,
                showPreview: previewChk.value
            };
            win.close();
        };

        cancel.onClick = function(){ win.close(); };

        win.center();
        win.show();
        return result;
    }

    // ====================== CREATE STATIC LABEL + PREVIEW ======================
    function buildLabelAndPreview(comp, keys, headerLayer) {

        var lineHeight = 64;
        var startX_label   = 140;
        var startX_preview = 140 + 600;

        // Base Y = header bottom + margin
        var hRect = headerLayer.sourceRectAtTime(0,false);
        var baseY = headerLayer.position.value[1] + hRect.height + 20;

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var cleanKey = sanitizeName(key);

            // ----------------- STATIC LABEL LAYER -----------------
            var labelName = "label_" + cleanKey;
            var label = findLayer(comp, labelName);
            if (!label) {
                label = comp.layers.addText(key);
                label.name = labelName;

                var doc = label.property("ADBE Text Properties").property("ADBE Text Document").value;
                doc.fontSize = 32;
                doc.font = "Arial-Bold";
                doc.fillColor = [1,1,1];
                doc.justification = ParagraphJustification.LEFT_JUSTIFY;
                doc.text = key;
                label.property("ADBE Text Properties").property("ADBE Text Document").setValue(doc);
            }

            var lRect = label.sourceRectAtTime(0,false);
            label.position.setValue([
                startX_label,
                baseY + i * lineHeight + lRect.height/2
            ]);
            label.moveAfter(headerLayer);

            // ----------------- PREVIEW LAYER -----------------
            var previewName = "preview_" + cleanKey;
            var preview = findLayer(comp, previewName);
            if (!preview) {
                preview = comp.layers.addText("...");

                preview.name = previewName;

                var pdoc = preview.property("ADBE Text Properties").property("ADBE Text Document").value;
                pdoc.fontSize = 32;
                pdoc.font = "Arial-Bold";
                pdoc.fillColor = [1,1,1];
                pdoc.justification = ParagraphJustification.LEFT_JUSTIFY;
                preview.property("ADBE Text Properties").property("ADBE Text Document").setValue(pdoc);
            }

            var pRect = preview.sourceRectAtTime(0,false);
            preview.position.setValue([
                startX_preview,
                baseY + i * lineHeight + pRect.height/2
            ]);

            preview.moveAfter(label);

            // ----------------- EXPRESSIONS -----------------
            var expr = "";
            expr += 'item = thisComp.layer("' + comp.dataKey + '").text.sourceText;\n';
            expr += "try {\n";

            // numeric?
            if (comp.numericKeys[key] === true) {
                expr += '    layerToken = thisComp.layer("' + comp.dataKey + '[" + item + "]").effect("' + cleanKey + '")("Slider");\n';
            } else {
                expr += '    layerToken = thisComp.layer("' + comp.dataKey + '[' + key + '][" + item + "]");\n';
                expr += '    layerToken.text.sourceText;\n';
            }

            expr += "} catch (err) {\n";
            expr += "    value;\n";
            expr += "}";

            preview.property("ADBE Text Properties").property("ADBE Text Document").expression = expr;
        }
    }

    // ====================== MAIN ======================
    function main() {
        app.beginUndoGroup("Data Importer RAW");

        var ui = showUI();
        if (ui.cancelled) { app.endUndoGroup(); return; }

        var db = getOrCreateFolder(DATABASE_FOLDER);

        for (var f = 0; f < ui.jsonPaths.length; f++) {
            var json = readJSON(ui.jsonPaths[f]);
            if (!json) continue;

            var data = detectArrayKey(json);
            if (!data || data.array.length === 0) continue;

            var items = data.array;

            var compName = (ui.jsonPaths.length > 1)
                ? (new File(ui.jsonPaths[f])).name.replace(/\.json$/i, "")
                : ui.compName || "data";

            var comp = getOrCreateComp(compName, db);

            comp.dataKey = data.key;
            comp.numericKeys = {};

            var limit = ui.processAll ? items.length : Math.min(ui.limit, items.length);

            // ------------------- CREATE NULL LAYERS -------------------
            for (var i = 0; i < limit; i++) {
                var item = items[i];
                var idVal = item[ui.idKey] || item.symbol || item.id || item.name || item.slug || ("item_" + (i+1));
                var safeID = sanitizeName(idVal);

                var nullName = data.key + "[" + safeID + "]";
                var nullL = findLayer(comp, nullName);
                if (!nullL) {
                    nullL = comp.layers.addNull();
                    nullL.name = nullName;
                }
                nullL.shy = true;
                nullL.enabled = false;
                nullL.label = 5;

                var keys = Object.keys(item);
                for (var ki = 0; ki < keys.length; ki++) {
                    var k = keys[ki];
                    var v = item[k];
                    var cleanK = sanitizeName(k);

                    if (typeof v === "number") {
                        comp.numericKeys[k] = true;
                        addOrUpdateEffect(nullL, "ADBE Slider Control", cleanK, v);
                    }
                    else if (typeof v === "string") {
                        comp.numericKeys[k] = false;
                        var txtName = data.key + "[" + k + "][" + safeID + "]";
                        var txtL = findLayer(comp, txtName);
                        if (!txtL) {
                            txtL = comp.layers.addText(v);
                            txtL.parent = nullL;
                            txtL.shy = true;
                            txtL.enabled = false;
                            txtL.name = txtName;
                        }
                    }
                    else if (typeof v === "boolean") {
                        comp.numericKeys[k] = true;
                        addOrUpdateEffect(nullL, "ADBE Checkbox Control", cleanK, v);
                    }
                }
            }

            // ------------------- HEADER -------------------
            var headerLayerName = data.key;
            var headerLayer = findLayer(comp, headerLayerName);
            if (!headerLayer) {
                headerLayer = comp.layers.addText(data.key);
                headerLayer.name = headerLayerName;

                var hdoc = headerLayer.property("ADBE Text Properties").property("ADBE Text Document").value;
                hdoc.fontSize = 40;
                hdoc.font = "Arial-Bold";
                hdoc.fillColor = [1,1,1];
                hdoc.justification = ParagraphJustification.LEFT_JUSTIFY;
                hdoc.text = data.key;
                headerLayer.property("ADBE Text Properties").property("ADBE Text Document").setValue(hdoc);

                headerLayer.position.setValue([140, 120]);
                headerLayer.moveToBeginning();
            }

            // ------------------- LABELS + PREVIEW -------------------
            if (ui.showPreview && items.length > 0) {
                var k = Object.keys(items[0]);
                buildLabelAndPreview(comp, k, headerLayer);
            }
        }

        app.endUndoGroup();
        alert("Labels aligned & expressions fixed.");
    }

    if (parseFloat(app.version) < 16) {
        alert("After Effects 2020+ required");
        return;
    }

    main();
})();
