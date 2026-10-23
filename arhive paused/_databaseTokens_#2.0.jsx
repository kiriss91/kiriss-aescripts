// _DynamicDataLayerCreator_v28_fixed.jsx
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

    function getOrCreateComp(name, folder, w, h, duration) {
        if (!name || name === "") name = "Data_Comp";
        var c = findItemByName(name);
        if (c instanceof CompItem) { c.parentFolder = folder; return c; }

        var comp = app.project.items.addComp(name, w || COMP_WIDTH, h || COMP_HEIGHT, 1, duration || COMP_DURATION, COMP_FPS);
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
        var jsonTxt = g1.add("edittext", undefined, "C:\\Users\\kissr\\PyCharmMiscProject\\cryptoData\\cryptoData_2025-11-29_#1.json"); 
        jsonTxt.characters = 50;
        var browse = g1.add("button", undefined, "Browse"); browse.size = [100,32];

        var g2 = win.add("group");
        g2.add("statictext", undefined, "Comp Name:").preferredSize.width = 100;
        var compNameTxt = g2.add("edittext", undefined, "data"); compNameTxt.characters = 50;

        var g3 = win.add("group");
        g3.add("statictext", undefined, "Identifier Key:").preferredSize.width = 100;
        var idKeyTxt = g3.add("edittext", undefined, "symbol"); idKeyTxt.characters = 30;

        var g4 = win.add("group");
        var allChk = g4.add("checkbox", undefined, "Process All"); allChk.value = true;
        var limitTxt = g4.add("edittext", undefined, "10"); limitTxt.characters = 6; limitTxt.enabled = false;
        allChk.onClick = function(){ limitTxt.enabled = !this.value; };

        var g5 = win.add("group");
        var previewChk = g5.add("checkbox", undefined, "Show preview"); previewChk.value = true;

        // ================ ADD IMAGES ==================
        var g6 = win.add("group");
        var addImagesChk = g6.add("checkbox", undefined, "Add images"); addImagesChk.value = false;

        var g7 = win.add("group");
        g7.add("statictext", undefined, "Images Folder:").preferredSize.width = 100;
        var imagesFolderTxt = g7.add("edittext", undefined, "C:\\Users\\kissr\\PyCharmMiscProject\\tokensLogoImages"); 
        imagesFolderTxt.characters = 50; 
        imagesFolderTxt.enabled = false;
        var imagesBrowseBtn = g7.add("button", undefined, "Browse"); imagesBrowseBtn.size = [100,32]; imagesBrowseBtn.enabled = false;

        var g8 = win.add("group");
        g8.add("statictext", undefined, "Extension:").preferredSize.width = 100;
        var extTxt = g8.add("edittext", undefined, ".png"); extTxt.characters = 10; extTxt.enabled = false;

        var g9 = win.add("group");
        g9.add("statictext", undefined, "Format:").preferredSize.width = 100;
        var formatTxt = g9.add("edittext", undefined, "{symbol}");
        formatTxt.characters = 30;
        formatTxt.enabled = false;

        var g10 = win.add("group");
        g10.add("statictext", undefined, "Prefix for logo comps:").preferredSize.width = 150;
        var prefixTxt = g10.add("edittext", undefined, "coinLogo_"); prefixTxt.characters = 20; prefixTxt.enabled = false;

        addImagesChk.onClick = function(){
            var en = this.value;
            imagesFolderTxt.enabled = en;
            imagesBrowseBtn.enabled = en;
            extTxt.enabled = en;
            formatTxt.enabled = en;
            prefixTxt.enabled = en;
        };

        imagesBrowseBtn.onClick = function(){
            var f = Folder.selectDialog("Select folder with images");
            if(f) imagesFolderTxt.text = f.fsName;
        };

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
                showPreview: previewChk.value,
                addImages: addImagesChk.value,
                imagesFolder: imagesFolderTxt.text,
                extension: extTxt.text || ".png",
                format: formatTxt.text || "{symbol}",
                prefix: prefixTxt.text || "coinLogo_"
            };
            win.close();
        };

        cancel.onClick = function(){ win.close(); };

        win.center();
        win.show();
        return result;
    }

    function buildLabelAndPreview(comp, keys, headerLayer) {
        var lineHeight = 64;
        var startX_label   = 140;
        var startX_preview = 140 + 600;

        var hRect = headerLayer.sourceRectAtTime(0,false);
        var baseY = headerLayer.position.value[1] + hRect.height + 20;

        for (var i = 0; i < keys.length; i++) {
            var key = keys[i];
            var cleanKey = sanitizeName(key);

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

            var expr = "";
            expr += 'item = thisComp.layer("' + comp.dataKey + '").text.sourceText;\n';
            expr += "try {\n";

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

        var logoCompsArray = [];
        var maxWidth = 0;
        var maxHeight = 0;

        for (var f = 0; f < ui.jsonPaths.length; f++) {
            var json = readJSON(ui.jsonPaths[f]);
            if (!json) continue;

            var data = detectArrayKey(json);
            if (!data || data.array.length === 0) continue;

            var items = data.array;

            var imagesFolderAE = null;
            var imagesFolderFS = null;
            var compsFolderAE = null;
            if(ui.addImages){
                var folderNameAE = "images" + data.key;
                imagesFolderAE = findItemByName(folderNameAE);
                if (!(imagesFolderAE instanceof FolderItem)) {
                    imagesFolderAE = app.project.items.addFolder(folderNameAE);
                    imagesFolderAE.parentFolder = db;
                }

                var compsFolderName = "images" + data.key + "Comps";
                compsFolderAE = findItemByName(compsFolderName);
                if (!(compsFolderAE instanceof FolderItem)) {
                    compsFolderAE = app.project.items.addFolder(compsFolderName);
                    compsFolderAE.parentFolder = db;
                }

                imagesFolderFS = Folder(ui.imagesFolder);
                if (!imagesFolderFS.exists) {
                    alert("Image folder does not exist: " + ui.imagesFolder);
                    imagesFolderFS = null;
                }
            }

            var compName = (ui.jsonPaths.length > 1)
                ? (new File(ui.jsonPaths[f])).name.replace(/\.json$/i, "")
                : ui.compName || "data";

            var comp = getOrCreateComp(compName, db);
            comp.dataKey = data.key;
            comp.numericKeys = {};

            var limit = ui.processAll ? items.length : Math.min(ui.limit, items.length);

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

                // ====== IMPORT IMAGE LAYER ======
                var symbol = item.symbol;
                if(ui.addImages && imagesFolderFS && imagesFolderAE && symbol){
                    var fileName = ui.format.replace("{symbol}", symbol) + ui.extension;
                    var filePath = new File(imagesFolderFS.fsName + "/" + fileName);
                    if(filePath.exists){
                        var imported = app.project.importFile(new ImportOptions(filePath));
                        imported.parentFolder = imagesFolderAE;

                        if(compsFolderAE){
                            var subCompName = ui.prefix + symbol;
                            var subComp = getOrCreateComp(subCompName, compsFolderAE, imported.width, imported.height, COMP_DURATION);
                            subComp.layers.add(imported).position.setValue([imported.width/2, imported.height/2]);
                            logoCompsArray.push(subComp);

                            maxWidth = Math.max(maxWidth, imported.width);
                            maxHeight = Math.max(maxHeight, imported.height);
                        }
                    }
                }
            }

            var headerLayerName = data.key;
            var headerLayer = findLayer(comp, headerLayerName);
            if(!headerLayer){
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

            if(ui.showPreview && items.length>0){
                var k = Object.keys(items[0]);
                buildLabelAndPreview(comp, k, headerLayer);
            }
        }

        // ====== CREATE OR UPDATE SELECTOR COMP ======
        if(ui.addImages && logoCompsArray.length>0){
            var selectorCompName = ui.prefix + "selector";
            var selectorComp = findItemByName(selectorCompName);

            if(!(selectorComp instanceof CompItem)){
                selectorComp = app.project.items.addComp(selectorCompName, maxWidth, maxHeight, 1, COMP_DURATION, COMP_FPS);
                selectorComp.parentFolder = db;
            } else {
                selectorComp.width = Math.max(selectorComp.width, maxWidth);
                selectorComp.height = Math.max(selectorComp.height, maxHeight);
            }

            // ====== coinLogo_ TEXT LAYER ======
            var guideText = findLayer(selectorComp, "coinLogo_");
            if(!guideText){
                guideText = selectorComp.layers.addText("coinLogo_");
                guideText.guideLayer = true;

                var fontSize = Math.max(20, Math.round(selectorComp.height * 0.03));
                var textDoc = guideText.property("ADBE Text Properties").property("ADBE Text Document").value;
                textDoc.fontSize = fontSize;
                textDoc.justification = ParagraphJustification.LEFT_JUSTIFY;
                guideText.property("ADBE Text Properties").property("ADBE Text Document").setValue(textDoc);

                guideText.position.setValue([fontSize*0.5, fontSize*0.5 + 10]);
                guideText.moveToBeginning();
            } else {
                guideText.moveToBeginning();
                var fontSize = Math.max(20, Math.round(selectorComp.height * 0.03));
                var textDoc = guideText.property("ADBE Text Properties").property("ADBE Text Document").value;
                textDoc.fontSize = fontSize;
                guideText.property("ADBE Text Properties").property("ADBE Text Document").setValue(textDoc);
                guideText.position.setValue([fontSize*0.5, fontSize*0.5 + 10]);
            }

            // ============================
            // ⭐ ADD TO ESSENTIAL GRAPHICS
            // ============================
            try {
                var src = guideText.property("Source Text");
                if (src && src.canAddToMotionGraphicsTemplate(selectorComp)) {
                    src.addToMotionGraphicsTemplateAs(selectorComp, "coinLogo_ Selector");
                }
            } catch (err) {
                alert("Error adding coinLogo_ text to Essential Graphics:\n" + err.toString());
            }

            // ====== ADD LOGO COMP LAYERS ======
            for(var i=0;i<logoCompsArray.length;i++){
                var logoComp = logoCompsArray[i];
                var exists = false;
                for(var l=1;l<=selectorComp.numLayers;l++){
                    if(selectorComp.layer(l).source===logoComp){ exists=true; break; }
                }
                if(!exists){
                    var layer = selectorComp.layers.add(logoComp);
                    layer.position.setValue([selectorComp.width/2, selectorComp.height/2]);

                    // opacity expression
                    layer.property("ADBE Transform Group").property("ADBE Opacity").expression =
                    "try {\n" +
                    "  var tokenMatch = thisLayer.name.match(/_(\\w+)$/);\n" +
                    "  var token = tokenMatch ? tokenMatch[1] : '';\n" +
                    "  var sourceText = thisComp.layer('coinLogo_').text.sourceText;\n" +
                    "  token == sourceText ? 100 : 0;\n" +
                    "} catch (err) { 0; }";
                }
            }
        }

        app.endUndoGroup();
        alert("Labels aligned, images & logo comps & selector comp created successfully!\nEssential Graphics updated!");
    }

    if(parseFloat(app.version)<16){
        alert("After Effects 2020+ required");
    } else {
        main();
    }

})();
