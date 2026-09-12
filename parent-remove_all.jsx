(function parentMemoryScript() {

    var comp = app.project.activeItem;
    if (!(comp && comp instanceof CompItem)) return;

    var layers = comp.selectedLayers;
    if (layers.length === 0) return;

    var restoreMode = ScriptUI.environment.keyboardState.ctrlKey;

    app.beginUndoGroup(restoreMode ? "Restore Parenting" : "Store + Unparent");

    for (var i = 0; i < layers.length; i++) {

        var layer = layers[i];

        if (restoreMode) {

            // RESTORE
            var match = layer.comment.match(/PARENT:(\d+)/);
            if (match) {
                var parentIndex = parseInt(match[1]);
                if (comp.layer(parentIndex)) {
                    layer.parent = comp.layer(parentIndex);
                }
            }

        } else {

            // STORE + UNPARENT
            if (layer.parent) {
                layer.comment = "PARENT:" + layer.parent.index;
                layer.parent = null;
            }

        }
    }

    app.endUndoGroup();

})();