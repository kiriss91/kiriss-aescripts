(function() {
    // Helper function to wait for initialization
    function wait(ms) {
        var start = new Date().getTime();
        while (new Date().getTime() < start + ms) {}
    }

    // Create UI pop-up
    var dialog = new Window("dialog", "Text Controls Setup");
    dialog.orientation = "column";
    dialog.alignChildren = "left";
    dialog.spacing = 10;
    dialog.margins = 16;

    var checkGroup = dialog.add("group");
    var addPrePostCheckbox = checkGroup.add("checkbox", undefined, "Add pre/post text");
    addPrePostCheckbox.value = true; // Default checked

    var rememberYGroup = dialog.add("group");
    var rememberYCheckbox = rememberYGroup.add("checkbox", undefined, "Remember Y Position");
    rememberYCheckbox.value = true; // Default checked

    var rememberXGroup = dialog.add("group");
    var rememberXCheckbox = rememberXGroup.add("checkbox", undefined, "Remember X Position");
    rememberXCheckbox.value = false; // Default unchecked

    var resolutionGroup = dialog.add("group");
    resolutionGroup.orientation = "row";
    resolutionGroup.add("statictext", undefined, "Resolution (e.g., 800x120 or 'auto'):");
    var resolutionInput = resolutionGroup.add("edittext", undefined, "auto");
    resolutionInput.characters = 10; // Set input box width

    var buttonGroup = dialog.add("group");
    var okButton = buttonGroup.add("button", undefined, "OK", {name: "ok"});
    var cancelButton = buttonGroup.add("button", undefined, "Cancel", {name: "cancel"});

    okButton.onClick = function() { dialog.close(1); };
    cancelButton.onClick = function() { dialog.close(0); };

    // Show dialog and capture result
    var dialogResult = dialog.show();
    if (dialogResult !== 1) return; // Exit if Cancel is clicked

    var addPrePostText = addPrePostCheckbox.value;
    var snapAlign = true; // always on now
    var rememberY = rememberYCheckbox.value;
    var rememberX = rememberXCheckbox.value;
    var resolutionText = resolutionInput.text.trim().toLowerCase();

    // Parse resolution input
    var compWidth = 800;
    var compHeight = 120;
    var useOriginalResolution = false;
    if (resolutionText === "auto") {
        useOriginalResolution = true;
    } else {
        var resMatch = resolutionText.match(/^(\d+)x(\d+)$/);
        if (resMatch) {
            compWidth = parseInt(resMatch[1]);
            compHeight = parseInt(resMatch[2]);
            if (isNaN(compWidth) || isNaN(compHeight) || compWidth <= 0 || compHeight <= 0) {
                alert("Invalid resolution format. Using default 800x120.");
                compWidth = 800;
                compHeight = 120;
            }
        } else {
            alert("Invalid resolution format. Using default 800x120.");
            compWidth = 800;
            compHeight = 120;
        }
    }

    // Check if selected layers are text layers
    try {
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            throw new Error("Please select a composition with at least one text layer.");
        }

        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            throw new Error("Please select at least one text layer.");
        }

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];
            if (layer.property("Source Text") === undefined) {
                alert("Warning: Layer '" + layer.name + "' is not a text layer.");
                return; // Exit script
            }
        }
    } catch (e) {
        alert("Error: " + e.toString());
        return;
    }

    app.beginUndoGroup("Add Text Controls");

    try {
        // Get the active composition
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            throw new Error("Please select a composition with at least one text layer.");
        }

        // Get selected layers
        var selectedLayers = comp.selectedLayers;
        if (selectedLayers.length === 0) {
            throw new Error("Please select at least one text layer.");
        }

        // Store precomps and text layers for Essential Graphics
        var precomps = [];
        var mainTextLayers = [];
        var preTextLayers = [];
        var postTextLayers = [];

        // Function to apply Stick Left positioning
        function applyStickLeft(preTextLayer, textLayerInPrecomp, postTextLayer, layerName) {
            if (addPrePostText) {
                var textDocPre = preTextLayer.property("Source Text").value;
                textDocPre.justification = ParagraphJustification.LEFT_JUSTIFY;
                preTextLayer.property("Source Text").setValue(textDocPre);

                var textDocMain = textLayerInPrecomp.property("Source Text").value;
                textDocMain.justification = ParagraphJustification.LEFT_JUSTIFY;
                textLayerInPrecomp.property("Source Text").setValue(textDocMain);

                var textDocPost = postTextLayer.property("Source Text").value;
                textDocPost.justification = ParagraphJustification.LEFT_JUSTIFY;
                postTextLayer.property("Source Text").setValue(textDocPost);

                // Clear position expression for Pre Text (parent, freely moving)
                preTextLayer.transform.position.expression = "";
                // Position expression for Main Text ([n]) to stick to right of Pre Text
                textLayerInPrecomp.transform.position.expression = [
                    "try {",
                    "  var preLayer = effect('Text Layer')('Layer');",
                    "  var padding = effect('Padding')('Slider');",
                    "  var xOffset = effect('X Offset')('Slider');",
                    "  var yOffset = effect('Y Offset')('Slider');",
                    "  var preRect = preLayer.sourceRectAtTime(time, false);",
                    "  var preWidth = preRect.width;",
                    "  var prePos = preLayer.transform.position;",
                    "  var preAnchor = preLayer.transform.anchorPoint;",
                    "  var preScale = preLayer.transform.scale / 100;",
                    "  var preRightEdge = prePos[0] + (preRect.left + preWidth - preAnchor[0]) * preScale[0];",
                    "  var textBaselineY = prePos[1] + yOffset;",
                    "  var textLeftEdge = preRightEdge + padding + xOffset;",
                    "  [textLeftEdge, textBaselineY];",
                    "} catch (e) {",
                    "  transform.position;",
                    "}"
                ].join("\n");
                // Position expression for Post Text to stick to right of Main Text
                postTextLayer.transform.position.expression = [
                    "try {",
                    "  var textLayer = effect('Text Layer')('Layer');",
                    "  var padding = effect('Padding')('Slider');",
                    "  var xOffset = effect('X Offset')('Slider');",
                    "  var yOffset = effect('Y Offset')('Slider');",
                    "  var thisRect = sourceRectAtTime(time, false);",
                    "  var thisAnchor = transform.anchorPoint;",
                    "  var thisScale = transform.scale / 100;",
                    "  if (textLayer != null) {",
                    "    var textRect = textLayer.sourceRectAtTime(time, false);",
                    "    var textWidth = textRect.width;",
                    "    var textPos = textLayer.transform.position;",
                    "    var textAnchor = textLayer.transform.anchorPoint;",
                    "    var textScale = textLayer.transform.scale / 100;",
                    "    var textLeftEdge = textPos[0] + (textRect.left - textAnchor[0]) * textScale[0];",
                    "    var textRightEdge = textLeftEdge + textWidth * textScale[0];",
                    "    var textBaselineY = textPos[1] + yOffset;",
                    "    var x = textRightEdge + padding + xOffset;",
                    "    var y = textBaselineY;",
                    "    [x, y];",
                    "  } else {",
                    "    transform.position;",
                    "  }",
                    "} catch (e) {",
                    "  transform.position;",
                    "}"
                ].join("\n");
            } else {
                var textDocMain = textLayerInPrecomp.property("Source Text").value;
                textDocMain.justification = ParagraphJustification.LEFT_JUSTIFY;
                textLayerInPrecomp.property("Source Text").setValue(textDocMain);
            }
        }

        // Function to apply Stick Right positioning
        function applyStickRight(preTextLayer, textLayerInPrecomp, postTextLayer, layerName) {
            if (addPrePostText) {
                var textDocPre = preTextLayer.property("Source Text").value;
                textDocPre.justification = ParagraphJustification.RIGHT_JUSTIFY;
                preTextLayer.property("Source Text").setValue(textDocPre);

                var textDocMain = textLayerInPrecomp.property("Source Text").value;
                textDocMain.justification = ParagraphJustification.RIGHT_JUSTIFY;
                textLayerInPrecomp.property("Source Text").setValue(textDocMain);

                var textDocPost = postTextLayer.property("Source Text").value;
                textDocPost.justification = ParagraphJustification.RIGHT_JUSTIFY;
                postTextLayer.property("Source Text").setValue(textDocPost);

                // Clear position expression for Post Text (parent, freely moving)
                postTextLayer.transform.position.expression = "";
                // Position expression for Main Text ([n]) to stick to left of Post Text
                textLayerInPrecomp.transform.position.expression = [
                    "try {",
                    "  var postLayer = effect('Text Layer')('Layer');",
                    "  var padding = effect('Padding')('Slider');",
                    "  var xOffset = effect('X Offset')('Slider');",
                    "  var yOffset = effect('Y Offset')('Slider');",
                    "  var postRect = postLayer.sourceRectAtTime(time, false);",
                    "  var postPos = postLayer.transform.position;",
                    "  var postAnchor = postLayer.transform.anchorPoint;",
                    "  var postScale = postLayer.transform.scale / 100;",
                    "  var postLeftEdge = postPos[0] + (postRect.left - postAnchor[0]) * postScale[0];",
                    "  var textBaselineY = postPos[1] + yOffset;",
                    "  var textRightEdge = postLeftEdge - padding + xOffset;",
                    "  [textRightEdge, textBaselineY];",
                    "} catch (e) {",
                    "  transform.position;",
                    "}"
                ].join("\n");
                // Position expression for Pre Text to stick to left of Main Text
                preTextLayer.transform.position.expression = [
                    "try {",
                    "  var mainLayer = effect('Text Layer')('Layer');",
                    "  var padding = effect('Padding')('Slider');",
                    "  var xOffset = effect('X Offset')('Slider');",
                    "  var yOffset = effect('Y Offset')('Slider');",
                    "  var mainRect = mainLayer.sourceRectAtTime(time, false);",
                    "  var mainPos = mainLayer.transform.position;",
                    "  var mainAnchor = mainLayer.transform.anchorPoint;",
                    "  var mainScale = mainLayer.transform.scale / 100;",
                    "  var mainLeftEdge = mainPos[0] + (mainRect.left - mainAnchor[0]) * mainScale[0];",
                    "  var preRightEdge = mainLeftEdge - padding + xOffset;",
                    "  var textBaselineY = mainPos[1] + yOffset;",
                    "  [preRightEdge, textBaselineY];",
                    "} catch (e) {",
                    "  transform.position;",
                    "}"
                ].join("\n");
            } else {
                var textDocMain = textLayerInPrecomp.property("Source Text").value;
                textDocMain.justification = ParagraphJustification.RIGHT_JUSTIFY;
                textLayerInPrecomp.property("Source Text").setValue(textDocMain);
            }
        }

        // Function to apply Stick Middle positioning
        function applyStickMiddle(preTextLayer, textLayerInPrecomp, postTextLayer, layerName) {
            if (addPrePostText) {
                var textDocPre = preTextLayer.property("Source Text").value;
                textDocPre.justification = ParagraphJustification.RIGHT_JUSTIFY;
                preTextLayer.property("Source Text").setValue(textDocPre);

                var textDocMain = textLayerInPrecomp.property("Source Text").value;
                textDocMain.justification = ParagraphJustification.CENTER_JUSTIFY;
                textLayerInPrecomp.property("Source Text").setValue(textDocMain);

                var textDocPost = postTextLayer.property("Source Text").value;
                textDocPost.justification = ParagraphJustification.LEFT_JUSTIFY;
                postTextLayer.property("Source Text").setValue(textDocPost);

                // Clear position expression for Main Text (freely moving)
                textLayerInPrecomp.transform.position.expression = "";
                // Position expression for Pre Text to stick to left of Main Text
                preTextLayer.transform.position.expression = [
                    "try {",
                    "  var mainLayer = effect('Text Layer')('Layer');",
                    "  var padding = effect('Padding')('Slider');",
                    "  var xOffset = effect('X Offset')('Slider');",
                    "  var yOffset = effect('Y Offset')('Slider');",
                    "  var mainRect = mainLayer.sourceRectAtTime(time, false);",
                    "  var mainPos = mainLayer.transform.position;",
                    "  var mainAnchor = mainLayer.transform.anchorPoint;",
                    "  var mainScale = mainLayer.transform.scale / 100;",
                    "  var mainLeftEdge = mainPos[0] + (mainRect.left - mainAnchor[0]) * mainScale[0];",
                    "  var preRightEdge = mainLeftEdge - padding + xOffset;",
                    "  var textBaselineY = mainPos[1] + yOffset;",
                    "  [preRightEdge, textBaselineY];",
                    "} catch (e) {",
                    "  transform.position;",
                    "}"
                ].join("\n");
                // Position expression for Post Text to stick to right of Main Text
                postTextLayer.transform.position.expression = [
                    "try {",
                    "  var mainLayer = effect('Text Layer')('Layer');",
                    "  var padding = effect('Padding')('Slider');",
                    "  var xOffset = effect('X Offset')('Slider');",
                    "  var yOffset = effect('Y Offset')('Slider');",
                    "  var mainRect = mainLayer.sourceRectAtTime(time, false);",
                    "  var mainPos = mainLayer.transform.position;",
                    "  var mainAnchor = mainLayer.transform.anchorPoint;",
                    "  var mainScale = mainLayer.transform.scale / 100;",
                    "  var mainWidth = mainRect.width;",
                    "  var mainRightEdge = mainPos[0] + (mainRect.left + mainWidth - mainAnchor[0]) * mainScale[0];",
                    "  var postLeftEdge = mainRightEdge + padding + xOffset;",
                    "  var textBaselineY = mainPos[1] + yOffset;",
                    "  [postLeftEdge, textBaselineY];",
                    "} catch (e) {",
                    "  transform.position;",
                    "}"
                ].join("\n");
            } else {
                var textDocMain = textLayerInPrecomp.property("Source Text").value;
                textDocMain.justification = ParagraphJustification.CENTER_JUSTIFY;
                textLayerInPrecomp.property("Source Text").setValue(textDocMain);
            }
        }

        // Function to apply Force Align positioning
        function applyForceAlign(preTextLayer, textLayerInPrecomp, postTextLayer, precomp, stickingMode) {
            if (!snapAlign) return; // Skip if Snap to Edges/Center is unchecked

            var compWidth = precomp.width;
            var compHeight = precomp.height; // Use comp height for centering

            var alignLayer;
            if (stickingMode === 1) {
                alignLayer = addPrePostText ? preTextLayer : textLayerInPrecomp;
            } else if (stickingMode === 2) {
                alignLayer = addPrePostText ? postTextLayer : textLayerInPrecomp;
            } else if (stickingMode === 3) {
                alignLayer = textLayerInPrecomp;
            }

            if (alignLayer) {
                var rect = alignLayer.sourceRectAtTime(0, false);
                var anchor = alignLayer.transform.anchorPoint.value;
                var scale = alignLayer.transform.scale.value / 100;
                var textHeight = rect.height * scale[1]; // Account for scale
                var centerY = compHeight / 2; // Fixed to center without adding textHeight/2
                var xPos;
                if (stickingMode === 1) {
                    xPos = (anchor[0] - rect.left) * scale[0];
                } else if (stickingMode === 2) {
                    xPos = compWidth + (anchor[0] - (rect.left + rect.width)) * scale[0];
                } else if (stickingMode === 3) {
                    xPos = compWidth / 2 + (anchor[0] - (rect.left + rect.width / 2)) * scale[0];
                }
                alignLayer.transform.position.setValue([xPos, centerY]);
                alignLayer.transform.position.expression = "";
            }
        }

        for (var i = 0; i < selectedLayers.length; i++) {
            var layer = selectedLayers[i];

            // Check if the layer is a text layer
            if (layer.property("Source Text") !== undefined) {
                var textDoc = layer.property("Source Text").value;
                var justification = textDoc.justification;
                var stickingMode;
                if (justification === ParagraphJustification.LEFT_JUSTIFY) {
                    stickingMode = 1;
                } else if (justification === ParagraphJustification.RIGHT_JUSTIFY) {
                    stickingMode = 2;
                } else if (justification === ParagraphJustification.CENTER_JUSTIFY) {
                    stickingMode = 3;
                } else {
                    alert("Unsupported paragraph alignment for layer '" + layer.name + "'.");
                    continue;
                }

                // Step 1: Get the original text color
                var originalTextColor = [0.6, 0.6, 0.6, 1];
                try {
                    var textDoc = layer.property("Source Text").value;
                    if (textDoc.fillColor) {
                        originalTextColor = textDoc.fillColor; // Should be RGBA
                    }
                } catch (e) {}

                // Remember original positions if checkboxes checked
                var originalX;
                var originalY;
                if (rememberX || rememberY) {
                    var originalPos = layer.transform.position.value;
                    if (rememberX) originalX = originalPos[0];
                    if (rememberY) originalY = originalPos[1];
                }

                // Step 2: Store the parent and unparent
                var originalParent = layer.parent;
                layer.parent = null;

                // Step 3: Precompose the layer with specified or original resolution
                var layerName = layer.name.replace(/"/g, '\\"').replace(/'/g, "\\'").replace(/\[/g, "\\[").replace(/\]/g, "\\]");
                var layerIndices = [layer.index];
                var precompName = layerName;
                var precomp;
                if (useOriginalResolution) {
                    precomp = comp.layers.precompose(layerIndices, precompName, true);
                } else {
                    precomp = comp.layers.precompose(layerIndices, precompName, true);
                    precomp.width = compWidth;
                    precomp.height = compHeight;
                }

                // Step 4: Get the precomp layer and text layer
                var precompLayer = comp.layer(precompName);
                var textLayerInPrecomp = precomp.layer(1);
                textLayerInPrecomp.name = "[n] " + layerName;

                // Set anchor point based on sticking mode
                var mainTextRect = textLayerInPrecomp.sourceRectAtTime(0, false);
                var standardHeight = 0; // Keep anchor point at top
                if (stickingMode === 1) {
                    textLayerInPrecomp.transform.anchorPoint.setValue([mainTextRect.left, standardHeight]);
                } else if (stickingMode === 2) {
                    textLayerInPrecomp.transform.anchorPoint.setValue([mainTextRect.left + mainTextRect.width, standardHeight]);
                } else if (stickingMode === 3) {
                    textLayerInPrecomp.transform.anchorPoint.setValue([mainTextRect.left + mainTextRect.width / 2, standardHeight]);
                }

                // Store for Essential Graphics
                precomps.push(precomp);
                mainTextLayers.push(textLayerInPrecomp);

                // Step 5: Create Control layer and apply preset
                var controlLayer = precomp.layers.addNull();
                controlLayer.name = "kiriss-counter";

                // Get the folder where this script is located
                var scriptFile = new File($.fileName);
                var scriptFolder = scriptFile.parent;

                // Build the path to the preset in the same folder as the script
                var presetPath = scriptFolder.fsName + "/scripts-kiriss_counter.ffx";
                var presetFile = new File(presetPath);

                if (presetFile.exists) {
                    controlLayer.applyPreset(presetFile);
                } else {
                    alert("kiriss-counter.ffx not found at:\n" + presetPath);
                    continue; // Skip to next layer if preset not found
                }

                // Reorder layers to set Control at index 1
                controlLayer.moveToBeginning();

                // Set default values and expressions on the preset params
                var kirissCounter = controlLayer.effect("kiriss_Counter");
                if (kirissCounter) {
                    // Set defaults with checks
                    if (kirissCounter("Preview")) kirissCounter("Preview").setValue(0);
                    if (kirissCounter("Proxy Value")) kirissCounter("Proxy Value").setValue(10);
                    if (kirissCounter("Posterize Frames")) kirissCounter("Posterize Frames").setValue(1);
                    if (kirissCounter("offsetPosterizeFrame")) kirissCounter("offsetPosterizeFrame").setValue(0);
                    if (kirissCounter("value")) kirissCounter("value").setValue(10);
                    if (kirissCounter("decimals")) kirissCounter("decimals").setValue(2);
                    if (kirissCounter("decimal (0-1)")) kirissCounter("decimal (0-1)").setValue(4);
                    if (kirissCounter("thousands separator")) kirissCounter("thousands separator").setValue(1);
                    if (kirissCounter("short format")) kirissCounter("short format").setValue(0);
                    if (kirissCounter("show zero")) kirissCounter("show zero").setValue(1);
                    if (kirissCounter("show -")) kirissCounter("show -").setValue(0);
                    if (kirissCounter("show +")) kirissCounter("show +").setValue(0);
                    if (kirissCounter("Type")) kirissCounter("Type").setValue(1);
                    if (kirissCounter("Single color")) kirissCounter("Single color").setValue(originalTextColor);
                    if (kirissCounter("Direction up/positive")) kirissCounter("Direction up/positive").setValue([56/255, 178/255, 111/255, 1]);
                    if (kirissCounter("Direction down/negative")) kirissCounter("Direction down/negative").setValue([1, 0, 0, 1]);
                    if (kirissCounter("preText")) kirissCounter("preText").setValue([0.6, 0.6, 0.6, 1]);
                    if (kirissCounter("postText")) kirissCounter("postText").setValue([0.6, 0.6, 0.6, 1]);
                    if (kirissCounter("Link Text")) kirissCounter("Link Text").setValue(1);

                    // Set expression on value with check
                    if (kirissCounter("value")) {
                        kirissCounter("value").expression = [
                            'var previewMode = effect("kiriss_Counter")("Preview").value;',
                            'if (previewMode) {',
                            '  effect("kiriss_Counter")("Proxy Value").value;',
                            '} else {',
                            '  try {',
                            '    var proxyValue = effect("kiriss_Counter")("Proxy Value");',
                            '    var valuePercent = effect("kiriss_Counter")("value %") / 100;',
                            '    var posterizeFrames = Math.max(1, Math.round(effect("kiriss_Counter")("Posterize Frames").value));',
                            '    var offsetPosterizeFrame = Math.round(effect("kiriss_Counter")("offsetPosterizeFrame").value);',
                            '    var frameDuration = thisComp.frameDuration;',
                            '    var currentFrame = Math.floor(time / frameDuration);',
                            '    var posterizedFrame = Math.floor((currentFrame - offsetPosterizeFrame) / posterizeFrames) * posterizeFrames + offsetPosterizeFrame;',
                            '    var posterizedTime = posterizedFrame * frameDuration;',
                            '    proxyValue.valueAtTime(posterizedTime) * valuePercent;',
                            '  } catch (e) { 10; }',
                            '}'
                        ].join("\n");
                    }

                    // Set expression on Last Direction with check
                    if (kirissCounter("Last Direction")) {
                        kirissCounter("Last Direction").expression = [
                            'var previewMode = effect("kiriss_Counter")("Preview").value;',
                            'if (previewMode) {',
                            '  0;',
                            ' } else {',
                            '  try {',
                            '    var valueSlider = effect("kiriss_Counter")("value");',
                            '    var currentValue = valueSlider.value;',
                            '    var prevValue = valueSlider.valueAtTime(time - thisComp.frameDuration);',
                            '    var frameTime = thisComp.frameDuration;',
                            '    var lookBackTime = time - frameTime;',
                            '    var trend = 0;',
                            '    if (currentValue > prevValue) {',
                            '      trend = 1;',
                            '    } else if (currentValue < prevValue) {',
                            '      trend = -1;',
                            '    } else {',
                            '      while (lookBackTime > 0 && trend == 0) {',
                            '        currentValue = valueSlider.valueAtTime(lookBackTime);',
                            '        prevValue = valueSlider.valueAtTime(lookBackTime - frameTime);',
                            '        if (currentValue > prevValue) {',
                            '          trend = 1;',
                            '        } else if (currentValue < prevValue) {',
                            '          trend = -1;',
                            '        }',
                            '        lookBackTime -= frameTime;',
                            '      }',
                            '    }',
                            '    trend;',
                            '  } catch (e) { 0; }',
                            '}'
                        ].join("\n");
                    }

                    // Set expression on Text Width (if param exists)
                    if (kirissCounter("Text Width")) {
                        kirissCounter("Text Width").expression = 'try { thisComp.layer("[n] ' + layerName + '").sourceRectAtTime(time, false).width; } catch (e) { 0; }';
                    }
                } else {
                    throw new Error("kiriss_Counter effect not found on the control layer. Please check the preset file.");
                }

                // Step 11: Color animator for Main Text
                var colorAnimator = textLayerInPrecomp.property("Text").property("Animators").addProperty("ADBE Text Animator");
                colorAnimator.name = "color animator";
                var fillColorProp = colorAnimator.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
                fillColorProp.expression = [
                    'try {',
                    '  var control = thisComp.layer("kiriss-counter");',
                    '  var previewMode = control.effect("kiriss_Counter")("Preview").value;',
                    '  var type = control.effect("kiriss_Counter")("Type").value;',
                    '  var singleColor = control.effect("kiriss_Counter")("Single color").value;',
                    '  var upColor = control.effect("kiriss_Counter")("Direction up/positive").value;',
                    '  var downColor = control.effect("kiriss_Counter")("Direction down/negative").value;',
                    '  var finalColor = singleColor;',
                    '  if (previewMode) {',
                    '    finalColor = singleColor;',
                    '  } else {',
                    '    var frameDuration = thisComp.frameDuration;',
                    '    var val = control.effect("kiriss_Counter")("value").value;',
                    '    var prevVal = control.effect("kiriss_Counter")("value").valueAtTime(time - frameDuration);',
                    '    var direction = control.effect("kiriss_Counter")("Last Direction").value;',
                    '    if (type == 3) {',
                    '      finalColor = val >= 0 ? upColor : downColor;',
                    '    } else if (type == 2 && time > frameDuration) {',
                    '      if (val > prevVal) {',
                    '        finalColor = upColor;',
                    '      } else if (val < prevVal) {',
                    '        finalColor = downColor;',
                    '      } else {',
                    '        finalColor = direction == 1 ? upColor : (direction == -1 ? downColor : upColor);',
                    '      }',
                    '    }',
                    '  }',
                    '  finalColor;',
                    '} catch (e) {',
                    '  [0.6, 0.6, 0.6, 1];',
                    '}'
                ].join("\n");

                // Step 7: Add pre/post text layers if checkbox is checked
                var preTextLayer = null;
                var postTextLayer = null;
                if (addPrePostText) {
                    // Create Pre Text layer
                    preTextLayer = precomp.layers.addText("");
                    preTextLayer.name = "preText";
                    preTextLayers.push(preTextLayer);

                    // Set anchor point based on sticking mode
                    var preTextRect = preTextLayer.sourceRectAtTime(0, false);
                    var standardHeight = 0; // Keep anchor point at top
                    if (stickingMode === 1) {
                        preTextLayer.transform.anchorPoint.setValue([preTextRect.left + preTextRect.width / 2, standardHeight]);
                    } else if (stickingMode === 2 || stickingMode === 3) {
                        preTextLayer.transform.anchorPoint.setValue([preTextRect.left + preTextRect.width, standardHeight]);
                    }

                    // Add color animator for Pre Text
                    var preColorAnimator = preTextLayer.property("Text").property("Animators").addProperty("ADBE Text Animator");
                    preColorAnimator.name = "color animator";
                    var preFillColorProp = preColorAnimator.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
                    preFillColorProp.expression = [
                        'try {',
                        '  var control = thisComp.layer("kiriss-counter");',
                        '  var syncColor = control.effect("kiriss_Counter")("Link Text").value;',
                        '  var mainColor = thisComp.layer("[n] ' + layerName + '").text.animator("color animator").property.fillColor;',
                        '  var preTextColor = control.effect("kiriss_Counter")("preText");',
                        '  syncColor ? mainColor : preTextColor;',
                        '} catch (e) { [0.6, 0.6, 0.6, 1]; }'
                    ].join("\n");

                    // Position expression for Pre Text (adjusted for user-provided)
                    preTextLayer.transform.position.expression = [
                        'try {',
                        '  var mainLayer = effect(\'Text Layer\')(\'Layer\');',
                        '  var padding = effect(\'Padding\')(\'Slider\');',
                        '  var xOffset = effect(\'X Offset\')(\'Slider\');',
                        '  var yOffset = effect(\'Y Offset\')(\'Slider\');',
                        '  var mainRect = mainLayer.sourceRectAtTime(time, false);',
                        '  var mainPos = mainLayer.transform.position;',
                        '  var mainAnchor = mainLayer.transform.anchorPoint;',
                        '  var mainScale = mainLayer.transform.scale / 100;',
                        '  var mainLeftEdge = mainPos[0] + (mainRect.left - mainAnchor[0]) * mainScale[0];',
                        '  var preRightEdge = mainLeftEdge - padding + xOffset;',
                        '  var textBaselineY = mainPos[1] + yOffset;',
                        '  [preRightEdge, textBaselineY];',
                        '} catch (e) {',
                        '  transform.position;',
                        '}'
                    ].join("\n");

                    // Create Post Text layer
                    postTextLayer = precomp.layers.addText("");
                    postTextLayer.name = "postText";
                    postTextLayers.push(postTextLayer);

                    // Set anchor point based on sticking mode
                    var postTextRect = postTextLayer.sourceRectAtTime(0, false);
                    if (stickingMode === 1 || stickingMode === 3) {
                        postTextLayer.transform.anchorPoint.setValue([postTextRect.left, standardHeight]);
                    } else if (stickingMode === 2) {
                        postTextLayer.transform.anchorPoint.setValue([postTextRect.left + postTextRect.width, standardHeight]);
                    }

                    // Add color animator for Post Text
                    var postColorAnimator = postTextLayer.property("Text").property("Animators").addProperty("ADBE Text Animator");
                    postColorAnimator.name = "color animator";
                    var postFillColorProp = postColorAnimator.property("ADBE Text Animator Properties").addProperty("ADBE Text Fill Color");
                    postFillColorProp.expression = [
                        'try {',
                        '  var control = thisComp.layer("kiriss-counter");',
                        '  var syncColor = control.effect("kiriss_Counter")("Link Text").value;',
                        '  var mainColor = thisComp.layer("[n] ' + layerName + '").text.animator("color animator").property.fillColor;',
                        '  var postTextColor = control.effect("kiriss_Counter")("postText");',
                        '  syncColor ? mainColor : postTextColor;',
                        '} catch (e) { [0.6, 0.6, 0.6, 1]; }'
                    ].join("\n");

                    // Position expression for Post Text (adjusted for user-provided)
                    postTextLayer.transform.position.expression = [
                        'try {',
                        '  var mainLayer = effect(\'Text Layer\')(\'Layer\');',
                        '  var padding = effect(\'Padding\')(\'Slider\');',
                        '  var xOffset = effect(\'X Offset\')(\'Slider\');',
                        '  var yOffset = effect(\'Y Offset\')(\'Slider\');',
                        '  var mainRect = mainLayer.sourceRectAtTime(time, false);',
                        '  var mainPos = mainLayer.transform.position;',
                        '  var mainAnchor = mainLayer.transform.anchorPoint;',
                        '  var mainScale = mainLayer.transform.scale / 100;',
                        '  var mainWidth = mainRect.width;',
                        '  var mainRightEdge = mainPos[0] + (mainRect.left + mainWidth - mainAnchor[0]) * mainScale[0];',
                        '  var postLeftEdge = mainRightEdge + padding + xOffset;',
                        '  var textBaselineY = mainPos[1] + yOffset;',
                        '  [postLeftEdge, textBaselineY];',
                        '} catch (e) {',
                        '  transform.position;',
                        '}'
                    ].join("\n");

                    // Add controllers to Pre and Post Text layers for Stick Middle, or to appropriate layers for Stick Left/Right
                    if (stickingMode === 3) {
                        var preTextEffects = preTextLayer.property("Effects");
                        var postTextEffects = postTextLayer.property("Effects");

                        var preTextLayerControl = preTextEffects.addProperty("ADBE Layer Control");
                        preTextLayerControl.name = "Text Layer";
                        preTextLayerControl.property("ADBE Layer Control-0001").setValue(textLayerInPrecomp.index);

                        var prePaddingControl = preTextEffects.addProperty("ADBE Slider Control");
                        prePaddingControl.name = "Padding";
                        prePaddingControl.property("Slider").setValue(5);

                        var preXOffsetControl = preTextEffects.addProperty("ADBE Slider Control");
                        preXOffsetControl.name = "X Offset";
                        preXOffsetControl.property("Slider").setValue(0);

                        var preYOffsetControl = preTextEffects.addProperty("ADBE Slider Control");
                        preYOffsetControl.name = "Y Offset";
                        preYOffsetControl.property("Slider").setValue(0);

                        var postTextLayerControl = postTextEffects.addProperty("ADBE Layer Control");
                        postTextLayerControl.name = "Text Layer";
                        postTextLayerControl.property("ADBE Layer Control-0001").setValue(textLayerInPrecomp.index);

                        var postPaddingControl = postTextEffects.addProperty("ADBE Slider Control");
                        postPaddingControl.name = "Padding";
                        postPaddingControl.property("Slider").setValue(5);

                        var postXOffsetControl = postTextEffects.addProperty("ADBE Slider Control");
                        postXOffsetControl.name = "X Offset";
                        postXOffsetControl.property("Slider").setValue(0);

                        var postYOffsetControl = postTextEffects.addProperty("ADBE Slider Control");
                        postYOffsetControl.name = "Y Offset";
                        postYOffsetControl.property("Slider").setValue(0);
                    } else {
                        var mainTextEffects = textLayerInPrecomp.property("Effects");

                        var mainTextLayerControl = mainTextEffects.addProperty("ADBE Layer Control");
                        mainTextLayerControl.name = "Text Layer";
                        mainTextLayerControl.property("ADBE Layer Control-0001").setValue(stickingMode === 1 ? preTextLayer.index : postTextLayer.index);

                        var mainPaddingControl = mainTextEffects.addProperty("ADBE Slider Control");
                        mainPaddingControl.name = "Padding";
                        mainPaddingControl.property("Slider").setValue(5);

                        var mainXOffsetControl = mainTextEffects.addProperty("ADBE Slider Control");
                        mainXOffsetControl.name = "X Offset";
                        mainXOffsetControl.property("Slider").setValue(0);

                        var mainYOffsetControl = mainTextEffects.addProperty("ADBE Slider Control");
                        mainYOffsetControl.name = "Y Offset";
                        mainYOffsetControl.property("Slider").setValue(0);

                        if (stickingMode === 1) {
                            var postTextEffects = postTextLayer.property("Effects");

                            var postTextLayerControl = postTextEffects.addProperty("ADBE Layer Control");
                            postTextLayerControl.name = "Text Layer";
                            postTextLayerControl.property("ADBE Layer Control-0001").setValue(textLayerInPrecomp.index);

                            var postPaddingControl = postTextEffects.addProperty("ADBE Slider Control");
                            postPaddingControl.name = "Padding";
                            postPaddingControl.property("Slider").setValue(5);

                            var postXOffsetControl = postTextEffects.addProperty("ADBE Slider Control");
                            postXOffsetControl.name = "X Offset";
                            postXOffsetControl.property("Slider").setValue(0);

                            var postYOffsetControl = postTextEffects.addProperty("ADBE Slider Control");
                            postYOffsetControl.name = "Y Offset";
                            postYOffsetControl.property("Slider").setValue(0);
                        } else if (stickingMode === 2) {
                            var preTextEffects = preTextLayer.property("Effects");

                            var preTextLayerControl = preTextEffects.addProperty("ADBE Layer Control");
                            preTextLayerControl.name = "Text Layer";
                            preTextLayerControl.property("ADBE Layer Control-0001").setValue(textLayerInPrecomp.index);

                            var prePaddingControl = preTextEffects.addProperty("ADBE Slider Control");
                            prePaddingControl.name = "Padding";
                            prePaddingControl.property("Slider").setValue(5);

                            var preXOffsetControl = preTextEffects.addProperty("ADBE Slider Control");
                            preXOffsetControl.name = "X Offset";
                            preXOffsetControl.property("Slider").setValue(0);

                            var preYOffsetControl = preTextEffects.addProperty("ADBE Slider Control");
                            preYOffsetControl.name = "Y Offset";
                            preYOffsetControl.property("Slider").setValue(0);
                        }
                    }

                    // Reorder layers
                    preTextLayer.moveAfter(controlLayer);
                    postTextLayer.moveAfter(preTextLayer);
                    textLayerInPrecomp.moveAfter(postTextLayer);
                }

                // Step 8: Apply sticking settings based on mode
                if (stickingMode === 1) {
                    applyStickLeft(preTextLayer, textLayerInPrecomp, postTextLayer, layerName);
                } else if (stickingMode === 2) {
                    applyStickRight(preTextLayer, textLayerInPrecomp, postTextLayer, layerName);
                } else if (stickingMode === 3) {
                    applyStickMiddle(preTextLayer, textLayerInPrecomp, postTextLayer, layerName);
                }

                // Step 9: Apply Force Align if enabled
                applyForceAlign(preTextLayer, textLayerInPrecomp, postTextLayer, precomp, stickingMode);

                // Step 9.5: Link master layer to Control null
                var masterLayer;
                if (addPrePostText) {
                    if (stickingMode === 1) {
                        masterLayer = preTextLayer;
                    } else if (stickingMode === 2) {
                        masterLayer = postTextLayer;
                    } else if (stickingMode === 3) {
                        masterLayer = textLayerInPrecomp;
                    }
                } else {
                    masterLayer = textLayerInPrecomp;
                }
                if (masterLayer) {
                    var masterPos = masterLayer.transform.position.value;
                    controlLayer.transform.position.setValue(masterPos);
                    masterLayer.transform.position.expression = 'thisComp.layer("kiriss-counter").transform.position;';
                }

                // If rememberY or rememberX, set controlLayer positions to original
                if ((rememberX || rememberY) && (originalX !== undefined || originalY !== undefined)) {
                    var currentPos = controlLayer.transform.position.value;
                    var newX = rememberX ? originalX : currentPos[0];
                    var newY = rememberY ? originalY : currentPos[1];
                    controlLayer.transform.position.setValue([newX, newY]);
                }

                // Step 10: Source Text expression for Main Text
                var textExpr = [
                    'try {',
                    '  var control = thisComp.layer("kiriss-counter");',
                    '  var previewMode = control.effect("kiriss_Counter")("Preview").value;',
                    '  var template = thisLayer.name;',
                    '  var frameDuration = thisComp.frameDuration;',
                    '  var posterizeFrames = Math.max(1, Math.round(control.effect("kiriss_Counter")("Posterize Frames").value));',
                    '  var offsetPosterizeFrame = Math.round(control.effect("kiriss_Counter")("offsetPosterizeFrame").value);',
                    '  var currentFrame = Math.floor(time / frameDuration);',
                    '  var posterizedFrame = Math.floor((currentFrame - offsetPosterizeFrame) / posterizeFrames) * posterizeFrames + offsetPosterizeFrame;',
                    '  var posterizedTime = posterizedFrame * frameDuration;',
                    '  var val = Number(control.effect("kiriss_Counter")("value").valueAtTime(posterizedTime));',
                    '  var decAbove = clamp(Math.round(control.effect("kiriss_Counter")("decimals").value), 0, 6);',
                    '  var decBetween = clamp(Math.round(control.effect("kiriss_Counter")("decimal (0-1)").value), 0, 6);',
                    '  var decimals = (val > 0 && val < 1) ? decBetween : decAbove;',
                    '  if (previewMode) {',
                    '    var formatted = Math.abs(val).toFixed(decimals);',
                    '    formatted;',
                    '  } else {',
                    '    var useComma = control.effect("kiriss_Counter")("thousands separator").value == 1;',
                    '    var useShort = control.effect("kiriss_Counter")("short format").value == 1;',
                    '    var showZero = control.effect("kiriss_Counter")("show zero").value == 1;',
                    '    var showMinus = control.effect("kiriss_Counter")("show -").value == 1;',
                    '    var showPlus = control.effect("kiriss_Counter")("show +").value == 1;',
                    '    function formatShort(n) {',
                    '      if (n < 1 && n > -1) return n.toFixed(decimals);',
                    '      var suffix = \'\';',
                    '      var num;',
                    '      if (n >= 1e12) { num = n / 1e12; suffix = \'T\'; }',
                    '      else if (n >= 1e9) { num = n / 1e9; suffix = \'B\'; }',
                    '      else if (n >= 1e6) { num = n / 1e6; suffix = \'M\'; }',
                    '      else if (n >= 1e3) { num = n / 1e3; suffix = \'K\'; }',
                    '      else return n.toFixed(decimals);',
                    '      var formatted = num.toFixed(1);',
                    '      if (showZero || formatted.match(/\\.\\d$/)) return formatted + suffix;',
                    '      return formatted.replace(/\\.0$/, \'\') + suffix;',
                    '    }',
                    '    var parts = template.split(/(\\[.*?\\])/);',
                    '    var output = \'\';',
                    '    for (var i = 0; i < parts.length; i++) {',
                    '      var p = parts[i];',
                    '      if (p.match(/^\\[n(\\.\\d+)?\\]$/)) {',
                    '        var d = p.match(/\\.(\\d+)/);',
                    '        if (d) decimals = parseInt(d[1]);',
                    '        var formatted = useShort ? formatShort(Math.abs(val)) : Math.abs(val).toFixed(decimals);',
                    '        if (!showZero) {',
                    '          formatted = formatted.replace(/\\.0+$/, \'\');',
                    '          formatted = formatted.replace(/\\.$/, \'\');',
                    '        }',
                    '        if (useComma && !useShort) {',
                    '          var fParts = formatted.split(\'.\');',
                    '          fParts[0] = fParts[0].replace(/\\B(?=(\\d{3})+(?!\\d))/g, \',\');',
                    '          formatted = fParts.length > 1 ? fParts.join(\'.\') : fParts[0];',
                    '        }',
                    '        output += formatted;',
                    '      } else if (p.match(/^\\[(show \\+|show -)\\]$/)) {',
                    '        if (p == \'[show +]\' && showPlus && val >= 0) {',
                    '          output += \'+\';',
                    '        } else if (p == \'[show -]\' && showMinus && val < 0) {',
                    '          output += \'-\';',
                    '        }',
                    '      } else if (p.match(/^\\[[^n].*\\]$/)) {',
                    '        var txt = p.substring(1, p.length - 1);',
                    '        if (txt.length > 0) output += txt.replace(/\\$\\$/g, \'$\');',
                    '      }',
                    '    }',
                    '    output;',
                    '  }',
                    '} catch (e) {',
                    '  thisLayer.name;',
                    '}'
                ].join("\n");
                textLayerInPrecomp.property("Source Text").expression = textExpr;

                // Step 12: Reparent the precomp layer
                if (originalParent) {
                    precompLayer.parent = originalParent;
                }
            }
        }

        // Step 13: Add controllers to Essential Graphics for each precomp
        for (var k = 0; k < precomps.length; k++) {
            var precomp = precomps[k];
            var mainTextLayer = mainTextLayers[k];
            var preTextLayer = addPrePostText && k < preTextLayers.length ? preTextLayers[k] : null;
            var postTextLayer = addPrePostText && k < postTextLayers.length ? postTextLayers[k] : null;
            var controlLayer = null;

            for (var j = 1; j <= precomp.numLayers; j++) {
                if (precomp.layer(j).name === "kiriss-counter" && precomp.layer(j).nullLayer) {
                    controlLayer = precomp.layer(j);
                    break;
                }
            }

            if (controlLayer) {
                try {
                    precomp.motionGraphicsTemplateName = precomp.name;
                    var kirissCounter = controlLayer.effect("kiriss_Counter");
                    if (kirissCounter) {
                        // ────────────────────────────────────────────────
                        // Changed only here: removed Value, added Proxy Value
                        // ────────────────────────────────────────────────
                        if (kirissCounter("Proxy Value")) {
                            kirissCounter("Proxy Value").addToMotionGraphicsTemplateAs(precomp, "Proxy Value");
                        }
                        if (addPrePostText && preTextLayer) {
                            preTextLayer.property("Source Text").addToMotionGraphicsTemplateAs(precomp, "preText");
                        }
                        if (addPrePostText && postTextLayer) {
                            postTextLayer.property("Source Text").addToMotionGraphicsTemplateAs(precomp, "postText");
                        }
                        if (kirissCounter("Posterize Frames")) {
                            kirissCounter("Posterize Frames").addToMotionGraphicsTemplateAs(precomp, "Posterize X Frames");
                        }
                        if (kirissCounter("offsetPosterizeFrame")) {
                            kirissCounter("offsetPosterizeFrame").addToMotionGraphicsTemplateAs(precomp, "Offset Posterize X Frames");
                        }
                        if (kirissCounter("Preview")) {
                            kirissCounter("Preview").addToMotionGraphicsTemplateAs(precomp, "Preview");
                        }
                        // ────────────────────────────────────────────────

                    }
                    precomp.openInEssentialGraphics();
                } catch (e) {}
            }
        }

    } catch (e) {
        alert("Error: " + e.toString());
    } finally {
        app.endUndoGroup();
    }
})();