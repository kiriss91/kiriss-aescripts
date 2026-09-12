// Sequence selected layers in time, one after the other, following
// the layer stacking order in the Timeline: bottommost layer first,
// topmost last. The first layer's in point moves to the current
// time indicator, and each following layer starts exactly where the
// previous one's out point ends, keeping its own duration.
(function () {

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }

    var layers = comp.selectedLayers;
    if (layers.length === 0) { alert("Please select at least one layer."); return; }

    layers.sort(function (a, b) { return b.index - a.index; }); // bottom of stack first

    app.beginUndoGroup("Sequence Layers Bottom to Top");

    var cursor = comp.time;

    for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        var shift = cursor - l.inPoint;
        l.startTime += shift;
        cursor = l.outPoint;
    }

    app.endUndoGroup();

})();
