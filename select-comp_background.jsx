app.beginUndoGroup("Toggle or Random Comp Background Color");

var comp = app.project.activeItem;

if (!(comp && comp instanceof CompItem)) {
    alert("Please select an active composition.");
} else {
    var keys = ScriptUI.environment.keyboardState;
    var altPressed = keys.altKey; // Use Alt instead of Ctrl

    if (altPressed) {
        // -------------------------------
        // Alt pressed → set random color
        // -------------------------------
        comp.bgColor = [Math.random(), Math.random(), Math.random()];
    } else {
        // -------------------------------
        // Default → toggle black/white
        // -------------------------------
        var bgColor = comp.bgColor; // array [r, g, b]
        var brightness = (bgColor[0] + bgColor[1] + bgColor[2]) / 3;

        if (brightness > 0.5) {
            comp.bgColor = [0, 0, 0]; // black
        } else {
            comp.bgColor = [1, 1, 1]; // white
        }
    }
}

app.endUndoGroup();