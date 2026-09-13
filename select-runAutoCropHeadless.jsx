// File: runAutoCropSelectedLayers.jsx
// Description: Auto Crop for pre-selected layers using Shift/Alt/Shift+Alt modifiers

var CHECK_INTERVAL_MS = 500; // Interval to check if Auto Crop is loaded

// --- Detect modifier keys ---
function getAutoCropModeFromModifiers() {
    var mode = "CROP"; // default
    try {
        var shift = ScriptUI.environment.keyboardState.shiftKey;
        var alt = ScriptUI.environment.keyboardState.altKey;

        if (shift && alt) mode = "PREF";     // Shift + Alt → Preferences
        else if (alt) mode = "DURATION";     // Alt → Crop Duration
        else if (shift) mode = "MASK";       // Shift → Mask Crop
        else mode = "CROP";                  // Default
    } catch(e) {
        $.writeln("⚠ Could not detect keyboard modifiers, defaulting to CROP.");
    }
    return mode;
}

// --- Ensure valid selection for DURATION and MASK ---
function checkSelectedLayersForMode(mode) {
    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        $.writeln("❌ No active composition found.");
        return false;
    }

    var hasSelection = comp.selectedLayers.length > 0;

    if ((mode === "DURATION" || mode === "MASK") && !hasSelection) {
        $.writeln("❌ No layers selected for mode: " + mode);
        return false;
    }

    return true;
}

// --- Wait for Auto Crop to load ---
function waitForAutoCropAndRun() {
    if (typeof executeAutoCrop !== "undefined") {
        var mode = getAutoCropModeFromModifiers();

        if (!checkSelectedLayersForMode(mode)) return;

        try {
            executeAutoCrop(mode);
            $.writeln("✅ Auto Crop executed: " + mode);
        } catch(e) {
            $.writeln("❌ Error executing Auto Crop: " + e.toString());
        }
    } else {
        $.sleep(CHECK_INTERVAL_MS);
        waitForAutoCropAndRun(); // Retry until executeAutoCrop exists
    }
}

// --- MAIN ---
app.beginUndoGroup("Run Auto Crop on Selected Layers");
waitForAutoCropAndRun();
app.endUndoGroup();