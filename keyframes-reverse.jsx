{
    function reverseSelectedKeyframesNative() {

        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please open a composition.");
            return;
        }

        if (comp.selectedLayers.length === 0) {
            alert("Select at least one layer with selected keyframes.");
            return;
        }

        app.beginUndoGroup("Time-Reverse Selected Keyframes");

        // This executes:
        // Keyframe Assistant → Time-Reverse Keyframes
        var cmd = app.findMenuCommandId("Time-Reverse Keyframes");
        app.executeCommand(cmd);

        app.endUndoGroup();
    }

    reverseSelectedKeyframesNative();
}