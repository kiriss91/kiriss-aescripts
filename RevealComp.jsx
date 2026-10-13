// RevealComp.jsx
// Run this (File > Scripts > Run Script File..., or drop it in AE's own
// Scripts folder so it shows up in that menu / can be bound to a shortcut)
// to reveal a composition in the Kiriss panel's Library dock - the same
// "Reveal Composition in Project" convenience AE's native Project panel
// has, but pointed at Kiriss's Library instead since that's standing in
// for the Project panel now.
//
// What it reveals:
//   - If a precomp layer is selected in the active comp, its SOURCE comp
//     (mirrors AE's own "Reveal Composition in Project" layer command).
//   - Otherwise, the comp that's currently open/active.
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
    function findTargetComp() {
        var active = app.project.activeItem;
        if (!(active instanceof CompItem)) return null;

        var sel = active.selectedLayers;
        for (var i = 0; i < sel.length; i++) {
            var src = sel[i].source;
            if (src && src instanceof CompItem) return src;
        }
        return active;
    }

    var comp = findTargetComp();
    if (!comp) {
        alert("Open a composition, or select a precomp layer inside one, then run Reveal Comp again.");
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
