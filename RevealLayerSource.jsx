// -- RevealLayerSource.jsx
// Run this (File > Scripts > Run Script File..., or drop it in AE's own
// Scripts folder so it shows up in that menu / can be bound to a
// shortcut) to reveal the SOURCE item of the layer(s) selected in the
// Timeline - AE's own "Reveal Layer Source in Project", pointed at
// Kiriss's Library dock instead since that's standing in for the
// Project panel now. Companion to "-- RevealComp.jsx" (which always
// reveals the active comp itself, ignoring selection); this one works
// purely off the Timeline selection, no comp-fallback.
//
// How it reaches the panel: same marker-file hand-off "-- RevealComp.jsx"
// uses (a CSXSEvent relay was tried first and never reliably reached the
// panel) - writes the source item's id to a small JSON file in the temp
// folder, which the Kiriss panel polls for while its Library dock is
// open. If nothing happens, make sure the Kiriss panel is open (Window >
// Extensions > Kiriss) and its Library dock isn't collapsed.

(function revealLayerSource() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Open a composition and select a layer, then run Reveal Layer Source again.");
        return;
    }

    var sel = comp.selectedLayers;
    if (!sel || !sel.length) {
        alert("Select a layer first, then run Reveal Layer Source again.");
        return;
    }

    var src = null;
    for (var i = 0; i < sel.length; i++) {
        try { src = sel[i].source; } catch (eS) {}
        if (src) break;
    }
    if (!src) {
        alert("That layer doesn't have a source item (text, shape, camera, light and null layers don't).");
        return;
    }

    try {
        var f = new File(Folder.temp.fsName + "/kiriss_reveal_request.json");
        f.encoding = "UTF-8";
        if (!f.open("w")) throw new Error("Could not open " + f.fsName + " for writing.");
        f.write(JSON.stringify({ id: src.id, name: src.name, ts: (new Date()).getTime() }));
        f.close();
        $.writeln("Kiriss RevealLayerSource: wrote reveal request for id " + src.id + " (\"" + src.name + "\")");
    } catch (e) {
        alert("Couldn't write the reveal request: " + e.toString());
    }
})();
