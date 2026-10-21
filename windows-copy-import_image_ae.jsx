(function importLatestShareXScreenshotSafe() {
    try {
        // Get current year + month
        var now = new Date();
        var year = now.getFullYear();
        var month = (now.getMonth() + 1).toString();
        if (month.length < 2) month = "0" + month;

        // Build folder path
        var folderPath = "C:/Users/kissr/Documents/ShareX/Screenshots/" + year + "-" + month;
        var screenshotFolder = new Folder(folderPath);

        if (!screenshotFolder.exists) {
            alert("Folder does not exist:\n" + folderPath);
            return;
        }

        // Get PNG files
        var files = screenshotFolder.getFiles(function(f) {
            return f instanceof File && f.name.toLowerCase().match(/\.png$/);
        });

        if (files.length === 0) {
            alert("No PNG files found.");
            return;
        }

        // Sort newest first
        files.sort(function(a, b) {
            return b.modified.getTime() - a.modified.getTime();
        });

        var latestFile = files[0];

        // Active comp check
        var comp = app.project.activeItem;
        if (!(comp && comp instanceof CompItem)) {
            alert("Open a composition first.");
            return;
        }

        app.beginUndoGroup("Import Latest ShareX Screenshot");

        // Import file (SAFE)
        var footage = app.project.importFile(new ImportOptions(latestFile));

        // Add layer
        var newLayer = comp.layers.add(footage);

        // Move to top safely
        if (comp.numLayers > 1) {
            newLayer.moveToBeginning();
        }

        app.endUndoGroup();

    } catch (err) {
        alert("Error:\n" + err.toString());
    }
})();