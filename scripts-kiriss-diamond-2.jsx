(function createAIGemCrystal_Final() {
    app.beginUndoGroup("Create AI Gem Crystal Final");

    var comp = app.project.activeItem;

    if (!(comp && comp instanceof CompItem)) {
        alert("Please select or open a composition first.");
        return;
    }

    var cx = comp.width / 2;
    var cy = comp.height / 2;

    var scale = 1.0;

    // =====================================
    // MAIN CONTROLS
    // =====================================
    var widthScale  = 1.18;   // front view width
    var depthScale  = 1.16;   // side depth
    var heightScale = 1.00;

    // low imperfection so it stays premium / intentional
    var imperfection = 0.05;

    var nullSize = 18;
    var deleteOldCrystalNulls = true;

    if (deleteOldCrystalNulls) {
        for (var l = comp.numLayers; l >= 1; l--) {
            var lyr = comp.layer(l);
            if (lyr.name.indexOf("CRYSTAL_NULL_") === 0) {
                lyr.remove();
            }
        }
    }

    var points = [];

    function rnd(seed) {
        var x = Math.sin(seed * 91.731) * 43758.5453;
        return x - Math.floor(x);
    }

    function srnd(seed) {
        return rnd(seed) * 2 - 1;
    }

    function add(name, x, y, z, seed, jx, jy, jz) {
        points.push([
            name,
            x * widthScale  + srnd(seed + 1) * jx * imperfection,
            y * heightScale + srnd(seed + 2) * jy * imperfection,
            z * depthScale  + srnd(seed + 3) * jz * imperfection
        ]);
    }

    function addRing(name, y, rx, rz, rotation, seed, jx, jy, jz) {
        for (var i = 0; i < 4; i++) {
            var a = rotation + i * (Math.PI / 2);

            var x = Math.cos(a) * rx;
            var z = Math.sin(a) * rz;

            add(
                name + "_" + (i + 1),
                x,
                y,
                z,
                seed + i * 10,
                jx, jy, jz
            );
        }
    }

    // =====================================
    // SHAPE
    // Top stays similar.
    // Bottom is rebuilt to be cleaner and more elegant.
    // =====================================

    add("TOP", 0, -325, 0, 10, 1.0, 1.0, 1.0);

    // top cap
    addRing("CROWN",      -220,  90,  76, 0.78, 100, 2.0, 2.0, 2.0);

    // shoulder
    addRing("SHOULDER",   -145, 138, 108, 0.18, 200, 2.5, 2.5, 2.5);

    // main body
    addRing("BODY_TOP",    -25, 152, 118, 0.82, 300, 2.5, 2.5, 2.5);
    addRing("BODY_LOW",     95, 148, 114, 0.20, 400, 2.5, 2.5, 2.5);

    // rebuilt lower section
    // this is the important change:
    // more graceful, less cramped, less flat
    addRing("LOWER_SHOULDER", 185, 112,  88, 0.92, 500, 2.2, 2.2, 2.2);
    addRing("LOWER_TAPER",    245,  66,  50, 0.42, 600, 1.8, 1.8, 1.8);

    add("BOTTOM", 0, 330, 0, 700, 1.0, 1.0, 1.0);

    // =====================================
    // CREATE NULLS
    // =====================================
    for (var i = 0; i < points.length; i++) {
        var p = points[i];

        var n = comp.layers.addNull();
        n.name = "CRYSTAL_NULL_" + p[0];
        n.threeDLayer = true;

        n.property("Position").setValue([
            cx + p[1] * scale,
            cy + p[2] * scale,
            p[3] * scale
        ]);

        n.property("Scale").setValue([nullSize, nullSize, nullSize]);
    }

    app.endUndoGroup();
})();