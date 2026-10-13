// -- Z Kiriss 03.jsx
// One of a fixed pool of numbered placeholder scripts (Z Kiriss 01-10) -
// bind an After Effects keyboard shortcut to THIS exact file ONCE, via
// Edit > Keyboard Shortcuts > File > Scripts > "-- Z Kiriss 03.jsx". From
// then on, use the Kiriss panel's Shortcuts tab to choose which real
// script slot 3 actually runs - reassign it as often as you like
// without ever touching AE's shortcut editor again. Same trick MoBar
// uses with its own "-- Mobar-Shortcut-NN.jsx" pool.
//
// Named "Z Kiriss" (not just "Kiriss") on purpose: AE assigns script
// shortcuts by ALPHABETICAL POSITION in the Scripts folder, not by
// name. "Kiriss" used to sort between "Coloriss" and "Mobar", which
// meant adding/removing these files shifted every one of MoBar's own
// 20 shortcut bindings to point at the wrong script. Sorting after
// "Mobar" (via the "Z") means these files can never shift anything
// that comes before them alphabetically.
//
// The assignment lives in a small shared config file (not in this
// script itself), written by the Kiriss panel's Shortcuts tab:
//   %APPDATA%/Adobe/Kiriss/shortcuts.json (Folder.userData/Kiriss)

(function runKirissSlot() {
    var SLOT = "3";
    try {
        var cfgFile = new File(Folder.userData.fsName + "/Kiriss/shortcuts.json");
        if (!cfgFile.exists) {
            alert("Kiriss " + SLOT + ": nothing assigned yet. Open the Kiriss panel's Shortcuts tab to assign a script to this slot.");
            return;
        }
        cfgFile.encoding = "UTF-8";
        if (!cfgFile.open("r")) { alert("Kiriss " + SLOT + ": couldn't read the shortcuts config."); return; }
        var txt = String(cfgFile.read());
        cfgFile.close();
        if (txt.charCodeAt(0) === 65279) txt = txt.slice(1);

        var data = {};
        try { data = JSON.parse(txt || "{}"); } catch (eParse) {}
        var slots = data.slots || {};
        var entry = slots[SLOT];
        if (!entry || !entry.target) {
            alert("Kiriss " + SLOT + ": nothing assigned yet. Open the Kiriss panel's Shortcuts tab to assign a script to this slot.");
            return;
        }

        var target = new File(entry.target);
        if (!target.exists) {
            alert("Kiriss " + SLOT + " (\"" + (entry.name || "") + "\"): its script isn't found: " + entry.target);
            return;
        }
        $.evalFile(target);
    } catch (e) {
        alert("Kiriss " + SLOT + " failed: " + e.toString());
    }
})();
