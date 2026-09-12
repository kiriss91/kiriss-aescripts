// Sequence selected layers in time, one after the other, ordered by
// their vertical position: bottommost layer first, topmost last.
(function () {

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }

    var layers = comp.selectedLayers;
    if (layers.length === 0) { alert("Please select at least one layer."); return; }

    // World-space Y (accounts for parenting -- a layer's own .position
    // is relative to its parent, not the comp, so we can't sort on it
    // directly when layers are parented).
    function worldY(layer) {
        var anchor = layer.anchorPoint.value;
        var world = layer.threeDLayer ? layer.toWorld(anchor, comp.time) : layer.toComp(anchor, comp.time);
        return world[1];
    }

    var order = [];
    for (var i = 0; i < layers.length; i++) {
        order.push({ layer: layers[i], y: worldY(layers[i]) });
    }

    order.sort(function (a, b) {
        if (a.y !== b.y) return b.y - a.y; // bottom (larger Y) first
        return a.layer.index - b.layer.index;
    });

    app.beginUndoGroup("Sequence Layers Bottom to Top");

    var cursor = order[0].layer.inPoint;

    for (var i = 0; i < order.length; i++) {
        var l = order[i].layer;
        var shift = cursor - l.inPoint;
        l.startTime += shift;
        cursor = l.outPoint;
    }

    app.endUndoGroup();

})();
