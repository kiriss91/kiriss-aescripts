// RevealComp.jsx
// Run this (File > Scripts > Run Script File..., or drop it in AE's own
// Scripts folder so it shows up in that menu / can be bound to a shortcut)
// to reveal a composition in the Kiriss panel's Library dock - the same
// "Reveal Composition in Project" convenience AE's native Project panel
// has, but pointed at Kiriss's Library instead since that's standing in
// for the Project panel now.
//
// What it reveals: always the comp that's currently open/active - never
// a selected layer's source (that's "-- RevealLayerSource.jsx"'s job).
// This used to fall back to a selected precomp layer's source comp too,
// mirroring AE's own "Reveal Composition in Project" layer command, but
// that meant having ANY precomp layer selected silently took over this
// shortcut and made it behave like RevealLayerSource's - so with a layer
// selected, Ctrl+Shift+E (this script) and Ctrl+E (RevealLayerSource)
// did the same thing instead of two different ones. Removed so each
// shortcut has exactly one, non-overlapping behavior.
//
// How it reaches the panel: this script has no direct access to the
// Kiriss extension's own JS (different ExtendScript/CEP execution
// contexts). A first attempt used a CSXSEvent relay (the same mechanism
// Coloriss's keyboard-shortcut script uses) but it never reached the
// panel reliably, so this instead writes a small marker file that the
// Kiriss panel polls for - a couple-times-a-second file-existence check
// while the panel window has focus, same proven approach the rest of
// Kiriss's host/client communication already relies on throughout.
// If the Kiriss panel isn't open or isn't focused, the request just sits
// in the marker file until the panel next checks (open it first via
// Window > Extensions > Kiriss if nothing happens).

(function revealComp() {
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) {
        alert("Open a composition, then run Reveal Comp again.");
        return;
    }

    try {
        var f = new File(Folder.temp.fsName + "/kiriss_reveal_request.json");
        f.encoding = "UTF-8";
        if (!f.open("w")) throw new Error("Could not open " + f.fsName + " for writing.");
        f.write(JSON.stringify({ id: comp.id, name: comp.name, ts: (new Date()).getTime() }));
        f.close();
        $.writeln("Kiriss RevealComp: wrote reveal request for id " + comp.id + " (\"" + comp.name + "\")");
    } catch (e) {
        alert("Couldn't write the reveal request: " + e.toString());
    }
})();
