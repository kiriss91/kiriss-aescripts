app.beginUndoGroup("Close Other Timeline Panels (Fastest Script Method)");

var comp = app.project.activeItem;

if (!comp || !(comp instanceof CompItem)) {
    alert("Please have a composition open in the Timeline panel.");
} else {
    var activeComp = comp;

    // This is the standard community method — as fast as scripting allows
    do {
        app.executeCommand(app.findMenuCommandId("Close"));
    } while (app.project.activeItem != null && app.project.activeItem instanceof CompItem);

    // Instantly bring back only our comp
    activeComp.openInViewer();
}

app.endUndoGroup();