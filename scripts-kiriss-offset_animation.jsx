(function DynamicTimeOffset(thisObj) {

    var TOOL_NAME = "Dynamic Time Offset";
    var MARKER = "__KIRISS_DYNAMIC_TIME_OFFSET__";
    var DEFAULT_FRAMES = -2;
    var MIN_FRAMES = -10;
    var MAX_FRAMES = 10;

    // ------------------------------------------------------------
    // Small helpers
    // ------------------------------------------------------------

    function trimString(s) {
        return String(s).replace(/^\s+|\s+$/g, "");
    }

    function clamp(v, minV, maxV) {
        return Math.max(minV, Math.min(maxV, v));
    }

    function isIdentifierStart(ch) {
        return /[A-Za-z_$]/.test(ch);
    }

    function isIdentifierPart(ch) {
        return /[A-Za-z0-9_$]/.test(ch);
    }

    function previousNonWhitespace(src, index) {
        var i;
        for (i = index; i >= 0; i--) {
            if (!/\s/.test(src.charAt(i))) {
                return src.charAt(i);
            }
        }
        return "";
    }

    // Replaces a standalone identifier only in executable code.
    // It ignores quoted strings and comments, and it will not replace
    // property members such as key(1).time or someObject.value.
    function replaceCodeIdentifier(src, identifier, replacement) {
        var out = "";
        var i = 0;
        var len = src.length;
        var state = "code";
        var quote = "";
        var changed = false;

        while (i < len) {
            var ch = src.charAt(i);
            var next = (i + 1 < len) ? src.charAt(i + 1) : "";

            if (state === "code") {
                if (ch === "/" && next === "/") {
                    out += "//";
                    i += 2;
                    state = "lineComment";
                    continue;
                }

                if (ch === "/" && next === "*") {
                    out += "/*";
                    i += 2;
                    state = "blockComment";
                    continue;
                }

                if (ch === "\"" || ch === "'" || ch === "`") {
                    quote = ch;
                    out += ch;
                    i++;
                    state = "string";
                    continue;
                }

                if (isIdentifierStart(ch)) {
                    var start = i;
                    var j = i + 1;
                    while (j < len && isIdentifierPart(src.charAt(j))) {
                        j++;
                    }

                    var word = src.substring(start, j);
                    var prev = previousNonWhitespace(src, start - 1);

                    if (word === identifier && prev !== ".") {
                        out += replacement;
                        changed = true;
                    } else {
                        out += word;
                    }

                    i = j;
                    continue;
                }

                out += ch;
                i++;
                continue;
            }

            if (state === "string") {
                out += ch;

                if (ch === "\\") {
                    if (i + 1 < len) {
                        out += src.charAt(i + 1);
                        i += 2;
                    } else {
                        i++;
                    }
                    continue;
                }

                if (ch === quote) {
                    state = "code";
                }

                i++;
                continue;
            }

            if (state === "lineComment") {
                out += ch;
                i++;
                if (ch === "\n" || ch === "\r") {
                    state = "code";
                }
                continue;
            }

            if (state === "blockComment") {
                if (ch === "*" && next === "/") {
                    out += "*/";
                    i += 2;
                    state = "code";
                } else {
                    out += ch;
                    i++;
                }
                continue;
            }
        }

        return {
            text: out,
            changed: changed
        };
    }

    function scrubStringsAndComments(src) {
        var out = "";
        var i = 0;
        var len = src.length;
        var state = "code";
        var quote = "";

        while (i < len) {
            var ch = src.charAt(i);
            var next = (i + 1 < len) ? src.charAt(i + 1) : "";

            if (state === "code") {
                if (ch === "/" && next === "/") {
                    out += "  ";
                    i += 2;
                    state = "lineComment";
                    continue;
                }

                if (ch === "/" && next === "*") {
                    out += "  ";
                    i += 2;
                    state = "blockComment";
                    continue;
                }

                if (ch === "\"" || ch === "'" || ch === "`") {
                    quote = ch;
                    out += " ";
                    i++;
                    state = "string";
                    continue;
                }

                out += ch;
                i++;
                continue;
            }

            if (state === "string") {
                if (ch === "\\") {
                    out += " ";
                    if (i + 1 < len) {
                        out += " ";
                        i += 2;
                    } else {
                        i++;
                    }
                    continue;
                }

                out += " ";
                if (ch === quote) {
                    state = "code";
                }
                i++;
                continue;
            }

            if (state === "lineComment") {
                if (ch === "\n" || ch === "\r") {
                    out += ch;
                    state = "code";
                } else {
                    out += " ";
                }
                i++;
                continue;
            }

            if (state === "blockComment") {
                if (ch === "*" && next === "/") {
                    out += "  ";
                    i += 2;
                    state = "code";
                } else {
                    out += (ch === "\n" || ch === "\r") ? ch : " ";
                    i++;
                }
                continue;
            }
        }

        return out;
    }

    function containsOwnValueDeclaration(src) {
        var scrubbed = scrubStringsAndComments(src);
        return /\b(?:var|let|const)\s+value\b/.test(scrubbed) ||
               /function\s*\([^\)]*\bvalue\b[^\)]*\)/.test(scrubbed);
    }

    function isDirectPropertyReferenceExpression(src) {
        var s = trimString(src);
        if (s === "") {
            return false;
        }

        s = s.replace(/;\s*$/, "");

        if (/\r|\n/.test(s)) {
            return false;
        }

        var scrubbed = scrubStringsAndComments(s);

        // Direct property links should not contain assignments, math,
        // comparisons, ternaries, or control-flow syntax.
        if (/[=+\-*\/%?:<>&|!]/.test(scrubbed)) {
            return false;
        }

        if (/\b(?:var|let|const|if|else|for|while|function|return|try|catch)\b/.test(scrubbed)) {
            return false;
        }

        // If the original already explicitly samples time, treat it as a
        // complex expression so the existing timing is not overwritten.
        if (/\.valueAtTime\s*\(/.test(scrubbed)) {
            return false;
        }

        // Common property names, including transform, masks, paths and text.
        if (/\.(?:anchorPoint|position|scale|orientation|rotation|xRotation|yRotation|zRotation|opacity|skew|skewAxis|pointOfInterest|zoom|focusDistance|aperture|blurLevel|maskPath|maskOpacity|maskFeather|maskExpansion|path|color|sourceText|size|strokeWidth|start|end|offset|amount)\s*$/.test(scrubbed)) {
            return true;
        }

        // Effect/property/content chains commonly end in (...) and return a Property.
        if (/\)\s*$/.test(scrubbed) && /(?:\.effect\s*\(|\beffect\s*\(|\.property\s*\(|\bproperty\s*\(|\.content\s*\(|\bcontent\s*\()/.test(scrubbed)) {
            return true;
        }

        return false;
    }

    // Adds valueAtTime() to common inline property references, so expressions
    // such as "source.position + [20,0]" can also be shifted in many cases.
    function retimeCommonPropertyReferences(src) {
        var changed = false;

        function applyPattern(re) {
            src = src.replace(re, function (match) {
                var args = arguments;
                var offset = args[args.length - 2];
                var whole = args[args.length - 1];
                var tail = whole.substring(offset + match.length);

                // If the matched property is being used as an object for one of
                // its methods/attributes, do not force it to a value here.
                // Existing .valueAtTime(...time...) calls are already handled by
                // the global time-token replacement.
                if (/^\s*\./.test(tail)) {
                    return match;
                }

                changed = true;
                return match + ".valueAtTime(__DTO_t)";
            });
        }

        var transformProps = "anchorPoint|position|scale|orientation|rotation|xRotation|yRotation|zRotation|opacity|skew|skewAxis|pointOfInterest|zoom|focusDistance|aperture|blurLevel";

        applyPattern(new RegExp("thisComp\\.layer\\s*\\([^\\)]*\\)(?:\\.transform)?\\.(?:" + transformProps + ")\\b", "g"));
        applyPattern(new RegExp("thisLayer(?:\\.transform)?\\.(?:" + transformProps + ")\\b", "g"));
        applyPattern(new RegExp("transform\\.(?:" + transformProps + ")\\b", "g"));

        // Common expression-control pick-whip chains.
        applyPattern(/thisComp\.layer\s*\([^\)]*\)\.effect\s*\([^\)]*\)\s*\([^\)]*\)/g);
        applyPattern(/thisLayer\.effect\s*\([^\)]*\)\s*\([^\)]*\)/g);
        applyPattern(/(^|[^A-Za-z0-9_$.])effect\s*\([^\)]*\)\s*\([^\)]*\)/g);

        return {
            text: src,
            changed: changed
        };
    }

    function buildHeader(originalExpression, originalEnabled, frames) {
        var encoded = "";

        try {
            encoded = encodeURIComponent(originalExpression);
        } catch (err) {
            encoded = escape(originalExpression);
        }

        return "// " + MARKER + "\r" +
               "// __DTO_ORIGINAL__:" + encoded + "\r" +
               "// __DTO_ENABLED__:" + (originalEnabled ? "1" : "0") + "\r" +
               "var __DTO_frames = " + frames + ";\r" +
               "var __DTO_t = time - framesToTime(__DTO_frames);\r";
    }

    function buildOffsetExpression(originalExpression, originalEnabled, frames, hasKeyframes) {
        var header = buildHeader(originalExpression, originalEnabled, frames);
        var original = String(originalExpression || "");

        // No old expression: sample the untouched keyframes at the shifted time.
        if (trimString(original) === "") {
            if (!hasKeyframes) {
                return {
                    supported: false,
                    reason: "No keyframes or expression"
                };
            }

            return {
                supported: true,
                mode: "keyframes",
                expression: header + "valueAtTime(__DTO_t);"
            };
        }

        // Best case: a direct pick-whip/property link.
        // Example:
        // thisComp.layer("Midpoint Null..").transform.position
        if (isDirectPropertyReferenceExpression(original)) {
            var direct = trimString(original).replace(/;\s*$/, "");
            var directTime = replaceCodeIdentifier(direct, "time", "__DTO_t");
            direct = directTime.text;

            return {
                supported: true,
                mode: "direct link",
                expression: header + "(" + direct + ").valueAtTime(__DTO_t);"
            };
        }

        // Some loop methods do not expose a custom time argument. Blindly
        // modifying them can change the expression incorrectly, so skip them.
        var scrubbedOriginal = scrubStringsAndComments(original);
        if (/\b(?:loopIn|loopOut|loopInDuration|loopOutDuration)\s*\(/.test(scrubbedOriginal)) {
            return {
                supported: false,
                reason: "Loop expression needs custom handling"
            };
        }

        var transformed = original;
        var changed = false;

        // Shift explicit uses of the global `time` variable, while leaving
        // properties such as key(1).time untouched.
        var timeResult = replaceCodeIdentifier(transformed, "time", "__DTO_t");
        transformed = timeResult.text;
        changed = changed || timeResult.changed;

        // Shift the property's own keyed `value`, unless the user declared a
        // custom variable literally named `value`.
        if (!containsOwnValueDeclaration(original)) {
            var valueResult = replaceCodeIdentifier(transformed, "value", "valueAtTime(__DTO_t)");
            transformed = valueResult.text;
            changed = changed || valueResult.changed;
        }

        // Shift common property references used inside larger expressions.
        var propResult = retimeCommonPropertyReferences(transformed);
        transformed = propResult.text;
        changed = changed || propResult.changed;

        if (!changed) {
            return {
                supported: false,
                reason: "Expression could not be retimed safely"
            };
        }

        return {
            supported: true,
            mode: "smart expression",
            expression: header + transformed
        };
    }

    function expressionHasMarker(expr) {
        return String(expr || "").indexOf(MARKER) !== -1;
    }

    function updateExistingOffsetExpression(expr, frames) {
        var re = /var\s+__DTO_frames\s*=\s*[-+]?(?:\d+(?:\.\d*)?|\.\d+)\s*;/;
        if (!re.test(expr)) {
            return null;
        }
        return expr.replace(re, "var __DTO_frames = " + frames + ";");
    }

    function getOriginalFromManagedExpression(expr) {
        var m = /\/\/\s*__DTO_ORIGINAL__:([^\r\n]*)/.exec(expr);
        if (!m) {
            return null;
        }

        try {
            return decodeURIComponent(m[1]);
        } catch (err) {
            try {
                return unescape(m[1]);
            } catch (err2) {
                return null;
            }
        }
    }

    function getOriginalEnabledFromManagedExpression(expr) {
        var m = /\/\/\s*__DTO_ENABLED__:(0|1)/.exec(expr);
        if (!m) {
            return true;
        }
        return m[1] === "1";
    }

    function getSelectedExpressibleProperties(comp) {
        var result = [];
        var selected = comp.selectedProperties;
        var i;

        for (i = 0; i < selected.length; i++) {
            var p = selected[i];
            try {
                if (p.propertyType === PropertyType.PROPERTY && p.canSetExpression) {
                    result.push(p);
                }
            } catch (err) {
                // Ignore property groups and unsupported property types.
            }
        }

        return result;
    }

    function getExpressionEnabledSafe(prop) {
        try {
            return prop.expressionEnabled;
        } catch (err) {
            return false;
        }
    }

    function restoreExpression(prop, expressionText, enabledState) {
        try {
            prop.expression = expressionText;
            if (trimString(expressionText) !== "") {
                prop.expressionEnabled = enabledState;
            }
        } catch (err) {
            // Nothing else to do here; caller will report failure.
        }
    }

    function applyOffset(frames, statusText) {
        var comp = app.project.activeItem;

        if (!(comp && comp instanceof CompItem)) {
            statusText.text = "Open a comp and select a property.";
            return;
        }

        var props = getSelectedExpressibleProperties(comp);
        if (props.length === 0) {
            statusText.text = "Select one or more properties first.";
            return;
        }

        var applied = 0;
        var updated = 0;
        var skipped = 0;
        var errors = 0;
        var skippedNames = [];

        app.beginUndoGroup(TOOL_NAME + " - Apply");

        var i;
        for (i = 0; i < props.length; i++) {
            var prop = props[i];
            var oldExpression = "";
            var oldEnabled = false;

            try {
                oldExpression = prop.expression || "";
                oldEnabled = getExpressionEnabledSafe(prop);

                var newExpression = null;

                if (expressionHasMarker(oldExpression)) {
                    newExpression = updateExistingOffsetExpression(oldExpression, frames);

                    if (newExpression === null) {
                        skipped++;
                        skippedNames.push(prop.name);
                        continue;
                    }

                    prop.expression = newExpression;
                    prop.expressionEnabled = true;

                    if (prop.expressionError && prop.expressionError !== "") {
                        restoreExpression(prop, oldExpression, oldEnabled);
                        errors++;
                    } else {
                        updated++;
                    }

                    continue;
                }

                var built = buildOffsetExpression(
                    oldExpression,
                    oldEnabled,
                    frames,
                    prop.numKeys > 0
                );

                if (!built.supported) {
                    skipped++;
                    skippedNames.push(prop.name);
                    continue;
                }

                prop.expression = built.expression;
                prop.expressionEnabled = true;

                if (prop.expressionError && prop.expressionError !== "") {
                    restoreExpression(prop, oldExpression, oldEnabled);
                    errors++;
                } else {
                    applied++;
                }

            } catch (err) {
                restoreExpression(prop, oldExpression, oldEnabled);
                errors++;
            }
        }

        app.endUndoGroup();

        var msg = "Applied " + applied;
        if (updated > 0) {
            msg += " | Updated " + updated;
        }
        if (skipped > 0) {
            msg += " | Skipped " + skipped;
        }
        if (errors > 0) {
            msg += " | Errors " + errors;
        }

        if (skippedNames.length > 0) {
            var maxShow = Math.min(2, skippedNames.length);
            var shortNames = [];
            for (i = 0; i < maxShow; i++) {
                shortNames.push(skippedNames[i]);
            }
            msg += "  (" + shortNames.join(", ");
            if (skippedNames.length > maxShow) {
                msg += ", ...";
            }
            msg += ")";
        }

        statusText.text = msg;
    }

    function removeOffset(statusText) {
        var comp = app.project.activeItem;

        if (!(comp && comp instanceof CompItem)) {
            statusText.text = "Open a comp and select a property.";
            return;
        }

        var props = getSelectedExpressibleProperties(comp);
        if (props.length === 0) {
            statusText.text = "Select one or more properties first.";
            return;
        }

        var restored = 0;
        var skipped = 0;
        var errors = 0;

        app.beginUndoGroup(TOOL_NAME + " - Remove");

        var i;
        for (i = 0; i < props.length; i++) {
            var prop = props[i];

            try {
                var expr = prop.expression || "";
                if (!expressionHasMarker(expr)) {
                    skipped++;
                    continue;
                }

                var original = getOriginalFromManagedExpression(expr);
                if (original === null) {
                    skipped++;
                    continue;
                }

                var originalEnabled = getOriginalEnabledFromManagedExpression(expr);

                prop.expression = original;
                if (trimString(original) !== "") {
                    prop.expressionEnabled = originalEnabled;
                }

                restored++;

            } catch (err) {
                errors++;
            }
        }

        app.endUndoGroup();

        var msg = "Restored " + restored;
        if (skipped > 0) {
            msg += " | Skipped " + skipped;
        }
        if (errors > 0) {
            msg += " | Errors " + errors;
        }
        statusText.text = msg;
    }

    // ------------------------------------------------------------
    // UI
    // ------------------------------------------------------------

    function buildUI(thisObj) {
        var pal = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", TOOL_NAME, undefined, { resizeable: true });

        if (!pal) {
            return pal;
        }

        pal.orientation = "column";
        pal.alignChildren = ["fill", "top"];
        pal.spacing = 8;
        pal.margins = 10;

        var title = pal.add("statictext", undefined, "Animation offset in frames");
        title.alignment = ["fill", "top"];

        var hint = pal.add("statictext", undefined, "- = earlier / faster     + = later / delay");
        hint.alignment = ["fill", "top"];

        var sliderRow = pal.add("group");
        sliderRow.orientation = "row";
        sliderRow.alignChildren = ["fill", "center"];
        sliderRow.spacing = 8;

        var minLabel = sliderRow.add("statictext", undefined, String(MIN_FRAMES));
        minLabel.preferredSize.width = 24;

        var frameSlider = sliderRow.add("slider", undefined, DEFAULT_FRAMES, MIN_FRAMES, MAX_FRAMES);
        frameSlider.alignment = ["fill", "center"];
        frameSlider.preferredSize.width = 220;

        var maxLabel = sliderRow.add("statictext", undefined, String(MAX_FRAMES));
        maxLabel.preferredSize.width = 24;

        var valueBox = sliderRow.add("edittext", undefined, String(DEFAULT_FRAMES));
        valueBox.characters = 4;
        valueBox.justify = "center";

        var buttonRow = pal.add("group");
        buttonRow.orientation = "row";
        buttonRow.alignChildren = ["fill", "center"];
        buttonRow.spacing = 6;

        var applyButton = buttonRow.add("button", undefined, "Apply / Update");
        var removeButton = buttonRow.add("button", undefined, "Remove Offset");

        var statusText = pal.add("statictext", undefined, "Select a property, choose frames, then Apply.");
        statusText.alignment = ["fill", "top"];

        function setFrameValue(v) {
            var n = Math.round(Number(v));
            if (isNaN(n)) {
                n = DEFAULT_FRAMES;
            }
            n = clamp(n, MIN_FRAMES, MAX_FRAMES);
            frameSlider.value = n;
            valueBox.text = String(n);
            return n;
        }

        frameSlider.onChanging = function () {
            setFrameValue(frameSlider.value);
        };

        frameSlider.onChange = function () {
            setFrameValue(frameSlider.value);
        };

        valueBox.onChange = function () {
            setFrameValue(valueBox.text);
        };

        applyButton.onClick = function () {
            var frames = setFrameValue(valueBox.text);
            applyOffset(frames, statusText);
        };

        removeButton.onClick = function () {
            removeOffset(statusText);
        };

        pal.onResizing = pal.onResize = function () {
            this.layout.resize();
        };

        pal.layout.layout(true);
        pal.layout.resize();

        return pal;
    }

    var panel = buildUI(thisObj);

    if (panel instanceof Window) {
        panel.center();
        panel.show();
    }

})(this);
