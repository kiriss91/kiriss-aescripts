// After Effects Script to Set Up Mini Value Display on Null Layer with Clear Control Names
(function() {
    // Start an undo group
    app.beginUndoGroup("Setup Value Display");

    try {
        // Get the active composition
        var comp = app.project.activeItem;
        if (!comp || !(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        // Get selected layers
        var selectedLayers = comp.selectedLayers;
        var controlsLayer = null;

        // Define clear, descriptive control names
        var controlNames = [
            "base_value",
            "animation_scale",
            "value_change",
            "percent_change",
            "current_value",
            "token_quantity",
            "token_price",
            "total_token_value",
            "investment_amount",
            "tokens_needed",
            "gain_loss_input",
            "total_gain_loss",
            "min_value",
            "max_value",
            "gain_loss_indicator"
        ];

        if (selectedLayers.length === 0) {
            // No selection: create a new null layer with controls but no expressions
            controlsLayer = comp.layers.addNull();
            if (!controlsLayer) {
                alert("Failed to create null layer.");
                return;
            }
            controlsLayer.name = "value_controls";

            // Remove existing effects
            var effects = controlsLayer.property("Effects");
            if (!effects) {
                alert("Failed to access Effects property on null layer.");
                return;
            }
            while (effects.numProperties > 0) {
                try {
                    effects.property(1).remove();
                } catch (e) {
                    alert("Error removing existing effect: " + e.toString());
                }
            }

            // Add controls to the null layer
            for (var i = 0; i < controlNames.length; i++) {
                try {
                    var control;
                    if (controlNames[i] === "animation_scale") {
                        // Add Slider Control for animation scaling
                        control = effects.addProperty("Slider Control");
                        if (!control) {
                            alert("Failed to add Slider Control for 'animation_scale'.");
                            throw new Error("Control creation failed.");
                        }
                        control.name = "animation_scale";
                        var controlProp = control.property("Slider");
                        if (!controlProp) {
                            alert("Failed to access Slider property for 'animation_scale'.");
                            throw new Error("Control property access failed.");
                        }
                        controlProp.setValue(100); // Default to 100 (full value)
                    } else {
                        // Add Angle Control for other properties
                        control = effects.addProperty("Angle Control");
                        if (!control) {
                            alert("Failed to add Angle Control for '" + controlNames[i] + "'.");
                            throw new Error("Control creation failed.");
                        }
                        control.name = controlNames[i];
                        var controlProp = control.property("Angle");
                        if (!controlProp) {
                            alert("Failed to access Angle property for '" + controlNames[i] + "'.");
                            throw new Error("Control property access failed.");
                        }
                        // Set default values (in degrees; adjust as needed)
                        if (controlNames[i] === "base_value") {
                            controlProp.setValue(10); // Default starting value
                        } else if (controlNames[i] === "token_quantity") {
                            controlProp.setValue(1); // Default to 1 token
                        } else if (controlNames[i] === "investment_amount") {
                            controlProp.setValue(1000); // Default to $1000
                        } else {
                            controlProp.setValue(0); // Others start at 0
                        }
                    }
                } catch (e) {
                    alert("Error adding control '" + controlNames[i] + "': " + e.toString());
                    throw e;
                }
            }

            alert("Value Controls null layer created with controls. Select the layer and run the script again to apply expressions.");
        } else if (selectedLayers.length === 1 && selectedLayers[0].nullLayer) {
            // Null layer selected: apply expressions to existing controls
            controlsLayer = selectedLayers[0];
            var effects = controlsLayer.property("Effects");
            if (!effects) {
                alert("Failed to access Effects property on selected null layer.");
                return;
            }

            // Verify all required controls exist
            var controls = [];
            for (var i = 0; i < controlNames.length; i++) {
                var found = false;
                for (var j = 1; j <= effects.numProperties; j++) {
                    var effect = effects.property(j);
                    if (effect && effect.name === controlNames[i]) {
                        var propertyName = (controlNames[i] === "animation_scale") ? "Slider" : "Angle";
                        controls[i] = effect.property(propertyName);
                        if (!controls[i]) {
                            alert("Failed to access " + propertyName + " property for '" + controlNames[i] + "'.");
                            return;
                        }
                        found = true;
                        break;
                    }
                }
                if (!found) {
                    alert("Control '" + controlNames[i] + "' not found on the selected null layer.");
                    return;
                }
            }

            // Expression for current_value
            var currentValueExpression = [
                "// Retrieve control values",
                "var baseValue = effect(\"base_value\")(\"Angle\");",
                "var animationScale = effect(\"animation_scale\")(\"Slider\");",
                "var valueChange = effect(\"value_change\")(\"Angle\");",
                "var percentChange = effect(\"percent_change\")(\"Angle\");",
                "",
                "// Apply animation scale as a percentage (animation_scale% * base_value)",
                "var animatedValue = (animationScale / 100) * baseValue;",
                "",
                "// Calculate current value: apply percentage change, then absolute change",
                "var intermediateValue = animatedValue * (1 + percentChange / 100);",
                "intermediateValue + valueChange;"
            ].join("\n");

            // Expression for token_price
            var tokenPriceExpression = [
                "// Retrieve current_value as token price",
                "var currentValue = effect(\"current_value\")(\"Angle\");",
                "currentValue;"
            ].join("\n");

            // Expression for total_token_value
            var totalTokenValueExpression = [
                "// Retrieve token price and token quantity",
                "var tokenPrice = effect(\"token_price\")(\"Angle\");",
                "var tokenQuantity = effect(\"token_quantity\")(\"Angle\");",
                "",
                "// Calculate total value of tokens",
                "tokenQuantity * tokenPrice;"
            ].join("\n");

            // Expression for tokens_needed
            var tokensNeededExpression = [
                "// Retrieve investment amount and token price",
                "var investmentAmount = effect(\"investment_amount\")(\"Angle\");",
                "var tokenPrice = effect(\"token_price\")(\"Angle\");",
                "",
                "// Calculate required tokens: investment amount / token price",
                "tokenPrice == 0 ? 0 : investmentAmount / tokenPrice;"
            ].join("\n");

            // Expression for total_gain_loss
            var totalGainLossExpression = [
                "// Retrieve control values",
                "var baseValue = effect(\"base_value\")(\"Angle\");",
                "var gainLossInput = effect(\"gain_loss_input\")(\"Angle\");",
                "var currentValue = effect(\"current_value\")(\"Angle\");",
                "",
                "// Prevent division by zero",
                "if (baseValue == 0 || (1 + gainLossInput / 100) == 0) {",
                "    0;",
                "} else {",
                "    // Calculate original value before gain/loss input",
                "    var originalValue = baseValue / (1 + gainLossInput / 100);",
                "",
                "    // Calculate total percentage change using current_value",
                "    if (originalValue == 0) {",
                "        0;",
                "    } else {",
                "        ((currentValue - originalValue) / originalValue) * 100;",
                "    }",
                "}"
            ].join("\n");

            // Expression for min_value
            var minValueExpression = [
                "// Retrieve current value",
                "var currentValue = effect(\"current_value\")(\"Angle\");",
                "",
                "// Initialize with current value at time 0",
                "var minValue = currentValue;",
                "",
                "// Check previous frame's lowest value",
                "var prevTime = time - thisComp.frameDuration;",
                "if (time > 0) {",
                "    var prevMin = valueAtTime(prevTime);",
                "    minValue = Math.min(prevMin, currentValue);",
                "}",
                "",
                "minValue;"
            ].join("\n");

            // Expression for max_value
            var maxValueExpression = [
                "// Retrieve current value",
                "var currentValue = effect(\"current_value\")(\"Angle\");",
                "",
                "// Initialize with current value at time 0",
                "var maxValue = currentValue;",
                "",
                "// Check previous frame's highest value",
                "var prevTime = time - thisComp.frameDuration;",
                "if (time > 0) {",
                "    var prevMax = valueAtTime(prevTime);",
                "    maxValue = Math.max(prevMax, currentValue);",
                "}",
                "",
                "maxValue;"
            ].join("\n");

            // Expression for gain_loss_indicator
            var gainLossIndicatorExpression = [
                "// Retrieve total gain/loss",
                "var totalGainLoss = effect(\"total_gain_loss\")(\"Angle\");",
                "",
                "// Output 1 for gains, -1 for losses, 0 for neutral",
                "if (totalGainLoss > 0) {",
                "    1;",
                "} else if (totalGainLoss < 0) {",
                "    -1;",
                "} else {",
                "    0;",
                "}"
            ].join("\n");

            // Apply expressions with retry mechanism
            var maxRetries = 5;
            var retryDelay = 300; // 300ms delay
            function applyExpression(control, expression, controlName) {
                if (!control) {
                    alert("Control for '" + controlName + "' is undefined.");
                    throw new Error("Undefined control for " + controlName);
                }
                for (var attempt = 1; attempt <= maxRetries; attempt++) {
                    try {
                        control.expression = expression;
                        return true;
                    } catch (e) {
                        if (attempt === maxRetries) {
                            alert("Failed to apply expression to '" + controlName + "' after " + maxRetries + " attempts: " + e.toString() + "\nExpression:\n" + expression);
                            throw new Error("Expression error for " + controlName + ": " + e.toString());
                        }
                        $.sleep(retryDelay);
                    }
                }
            }

            // Apply expressions in dependency order
            applyExpression(controls[4], currentValueExpression, "current_value");
            applyExpression(controls[6], tokenPriceExpression, "token_price");
            applyExpression(controls[7], totalTokenValueExpression, "total_token_value");
            applyExpression(controls[9], tokensNeededExpression, "tokens_needed");
            applyExpression(controls[11], totalGainLossExpression, "total_gain_loss");
            applyExpression(controls[12], minValueExpression, "min_value");
            applyExpression(controls[13], maxValueExpression, "max_value");
            applyExpression(controls[14], gainLossIndicatorExpression, "gain_loss_indicator");

            alert("Expressions applied to controls on the selected null layer.");
        } else {
            alert("Please select exactly one null layer or no layers.");
            return;
        }

    } catch (e) {
        alert("Error during setup: " + e.toString());
    } finally {
        app.endUndoGroup();
    }
})();