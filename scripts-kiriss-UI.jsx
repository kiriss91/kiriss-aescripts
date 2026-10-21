(function createTextDataUI(thisObj) {
    function padNumber(number) {
        return number < 10 ? "0" + number : String(number);
    }

    function getNextNullName(comp) {
        var number = 1;

        while (number < 1000) {
            var candidate = "C_TEXT_DATA_" + padNumber(number);
            var nameExists = false;

            for (var i = 1; i <= comp.numLayers; i++) {
                if (comp.layer(i).name === candidate) {
                    nameExists = true;
                    break;
                }
            }

            if (!nameExists) {
                return candidate;
            }

            number++;
        }

        return "C_TEXT_DATA_" + String(new Date().getTime());
    }

    function isTextLayer(layer) {
        return layer && layer.property("ADBE Text Properties") !== null;
    }

    function addSlider(nullLayer, sliderName, expressionText) {
        var slider = nullLayer
            .property("ADBE Effect Parade")
            .addProperty("ADBE Slider Control");

        slider.name = sliderName;
        slider.property("ADBE Slider Control-0001").expression = expressionText;
    }

    function createTextData() {
        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Open a composition, then run Create Text Data again.");
            return;
        }

        var selectedTextLayer = null;
        var selectedLayers = comp.selectedLayers;

        for (var i = 0; i < selectedLayers.length; i++) {
            if (isTextLayer(selectedLayers[i])) {
                selectedTextLayer = selectedLayers[i];
                break;
            }
        }

        app.beginUndoGroup("Create Text Data");

        try {
            var nullLayer = comp.layers.addNull();
            nullLayer.name = getNextNullName(comp);

            var layerControl = nullLayer
                .property("ADBE Effect Parade")
                .addProperty("ADBE Layer Control");

            layerControl.name = "Text Layer";

            if (selectedTextLayer !== null) {
                layerControl
                    .property("ADBE Layer Control-0001")
                    .setValue(selectedTextLayer.index);
            }

            var widthExpression = [
                "try {",
                "    var textLayer = effect(\"Text Layer\")(\"ADBE Layer Control-0001\");",
                "    var textBounds = textLayer.sourceRectAtTime(time, false);",
                "    textBounds.width * (textLayer.transform.scale[0] / 100);",
                "} catch (err) {",
                "    0;",
                "}"
            ].join("\r");

            var heightExpression = [
                "try {",
                "    var textLayer = effect(\"Text Layer\")(\"ADBE Layer Control-0001\");",
                "    var textBounds = textLayer.sourceRectAtTime(time, false);",
                "    textBounds.height * (textLayer.transform.scale[1] / 100);",
                "} catch (err) {",
                "    0;",
                "}"
            ].join("\r");

            var linesExpression = [
                "try {",
                "    var textLayer = effect(\"Text Layer\")(\"ADBE Layer Control-0001\");",
                "    var textValue = textLayer.text.sourceText.toString();",
                "    var textLines = textValue.split(/\\r\\n|\\r|\\n/);",
                "    textValue.length > 0 ? textLines.length : 0;",
                "} catch (err) {",
                "    0;",
                "}"
            ].join("\r");

            addSlider(nullLayer, "Text Width", widthExpression);
            addSlider(nullLayer, "Text Height", heightExpression);
            addSlider(nullLayer, "Text Lines", linesExpression);

            nullLayer.selected = true;
        } catch (err) {
            alert("Could not create the text data controls.\r\r" + err.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function buildUI(thisObj) {
        var panel = thisObj instanceof Panel
            ? thisObj
            : new Window("palette", "Text Data", undefined, { resizeable: true });

        panel.orientation = "column";
        panel.alignChildren = ["fill", "top"];
        panel.spacing = 8;
        panel.margins = 12;

        var createButton = panel.add("button", undefined, "Create Text Data");
        createButton.onClick = createTextData;

        panel.layout.layout(true);
        panel.layout.resize();
        panel.onResizing = panel.onResize = function () {
            this.layout.resize();
        };

        return panel;
    }

    var ui = buildUI(thisObj);

    if (ui instanceof Window) {
        ui.center();
        ui.show();
    }
})(this);
