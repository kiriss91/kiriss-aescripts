// Sequence selected layers in time, one after the other, ordered by
// their vertical position: topmost layer first, bottommost last.
(function () {

    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please select a composition."); return; }

    var layers = comp.selectedLayers;
    if (layers.length === 0) { alert("Please select at least one layer."); return; }

    // World-space Y (accounts for parenting -- a layer's own .position
    // is relative to its parent, not the comp, so we can't sort on it
    // directly when layers are parented). toComp/toWorld only exist in
    // AE's expression engine, not the scripting DOM, so we bake the
    // conversion through a throwaway null's position expression.
    var measureNull = comp.layers.addNull();
    measureNull.name = "Temp Sort Null";
    measureNull.threeDLayer = true; // so a 3-value toWorld() result always fits

    function worldY(layer) {
        var is3D = layer.threeDLayer;
        var anchor = layer.anchorPoint.value;
        var anchorStr = "[" + anchor.join(",") + "]";
        var expr = "thisComp.layer(" + layer.index + ")." +
                   (is3D ? "toWorld" : "toComp") +
                   "(" + anchorStr + ");";
        if (!is3D) {
            expr = "var p = " + expr + "; [p[0], p[1], 0];";
        }
        measureNull.transform.position.expression = expr;
        return measureNull.transform.position.value[1];
    }

    var order = [];
    for (var i = 0; i < layers.length; i++) {
        order.push({ layer: layers[i], y: worldY(layers[i]) });
    }

    measureNull.remove();

    order.sort(function (a, b) {
        if (a.y !== b.y) return a.y - b.y; // top (smaller Y) first
        return a.layer.index - b.layer.index;
    });

    app.beginUndoGroup("Sequence Layers Top to Bottom");

    var cursor = order[0].layer.inPoint;

    for (var i = 0; i < order.length; i++) {
        var l = order[i].layer;
        var shift = cursor - l.inPoint;
        l.startTime += shift;
        cursor = l.outPoint;
    }

    app.endUndoGroup();

})();
