{
    app.beginUndoGroup("Apply Expression to Selected Properties");var keys = ScriptUI.environment.keyboardState;
var shiftDown = keys.shiftKey;
var ctrlDown = keys.ctrlKey || keys.metaKey;  // Handles Ctrl on Win and Cmd on Mac

var amp, freq, decay;

if (shiftDown && ctrlDown) {
    amp = 18;
    freq = 1.5;
    decay = 2;
} else if (shiftDown) {
    amp = 14;
    freq = 0.5;
    decay = 1;
} else if (ctrlDown) {
    amp = 9;
    freq = 1.2;
    decay = 2.4;
} else {
    amp = 7;
    freq = 1;
    decay = 4;
}

var expr = "var $bm_rt;\n" +
"var amp, freq, decay, n, n, t, t, v;\n" +
"amp = " + amp + ";\n" +
"freq = " + freq + ";\n" +
"decay = " + decay + ";\n" +
"$bm_rt = n = 0;\n" +
"if (numKeys > 0) {\n" +
"    $bm_rt = n = nearestKey(time).index;\n" +
"    if (key(n).time > time) {\n" +
"        n--;\n" +
"    }\n" +
"}\n" +
"if (n == 0) {\n" +
"    $bm_rt = t = 0;\n" +
"} else {\n" +
"    $bm_rt = t = sub(time, key(n).time);\n" +
"}\n" +
"if (n > 0) {\n" +
"    v = velocityAtTime(sub(key(n).time, div(thisComp.frameDuration, 10)));\n" +
"    $bm_rt = add(value, div(mul(mul(div(v, 100), amp), Math.sin(mul(mul(mul(freq, t), 2), Math.PI))), Math.exp(mul(decay, t))));\n" +
"} else {\n" +
"    $bm_rt = value;\n" +
"}";var props = app.project.activeItem.selectedProperties;

if (props.length === 0) {
    alert("Please select at least one property.");
} else {
    for (var i = 0; i < props.length; i++) {
        try {
            props[i].expression = expr;
            props[i].expressionEnabled = true;
        } catch (e) {
            alert("Could not apply expression to property: " + props[i].name);
        }
    }
}

app.endUndoGroup();}

