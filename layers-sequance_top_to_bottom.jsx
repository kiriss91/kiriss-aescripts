// Sequence selected layers in time, one after the other, ordered by
// their vertical position: topmost layer first, bottommost last.
(function () {

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }

    var layers = comp.selectedLayers;
    if (layers.length === 0) { alert("Please select at least one layer."); return; }

    layers.sort(function (a, b) {
        var ay = a.position.value[1];
        var by = b.position.value[1];
        if (ay !== by) return ay - by; // top (smaller Y) first
        return a.index - b.index;
    });

    app.beginUndoGroup("Sequence Layers Top to Bottom");

    var cursor = layers[0].inPoint;

    for (var i = 0; i < layers.length; i++) {
        var l = layers[i];
        var shift = cursor - l.inPoint;
        l.startTime += shift;
        cursor = l.outPoint;
    }

    app.endUndoGroup();

})();
