#target aftereffects

(function VersionDuplicator(thisObj) {

    function buildUI(thisObj) {
        var win = (thisObj instanceof Panel)
            ? thisObj
            : new Window("palette", "Version Duplicator", undefined, {resizeable: true});

        win.orientation = "column";
        win.alignChildren = ["fill", "top"];
        win.spacing = 8;
        win.margins = 10;

        var info = win.add("statictext", undefined, "Select a version folder, e.g. 1.4.3");
        info.alignment = ["fill", "top"];

        var versionGroup = win.add("group");
        versionGroup.orientation = "row";
        versionGroup.alignChildren = ["left", "center"];
        versionGroup.alignment = ["fill", "top"];

        versionGroup.add("statictext", undefined, "Custom next version:");

        var customVersionInput = versionGroup.add("edittext", undefined, "");
        customVersionInput.characters = 10;
        customVersionInput.helpTip = "Optional. Leave blank to increment automatically, or enter a version such as 1.5.1.";

        var customHint = win.add(
            "statictext",
            undefined,
            "Leave blank for automatic next version"
        );
        customHint.alignment = ["fill", "top"];

        var scanState = {
            rootFolder: null,
            rows: []
        };

        var scanBtn = win.add("button", undefined, "Scan Subfolders");
        scanBtn.alignment = ["fill", "top"];

        var foldersPanel = win.add("panel", undefined, "Subfolders to duplicate");
        foldersPanel.orientation = "column";
        foldersPanel.alignChildren = ["fill", "top"];
        foldersPanel.alignment = ["fill", "top"];
        foldersPanel.margins = 10;

        var scanMessage = foldersPanel.add(
            "statictext",
            undefined,
            "Select a version folder, then click Scan Subfolders"
        );
        scanMessage.alignment = ["fill", "top"];

        var replaceCheck = win.add(
            "checkbox",
            undefined,
            "Replace comps inside with new comps"
        );
        replaceCheck.value = true;

        var duplicateBtn = win.add("button", undefined, "Duplicate Version");
        duplicateBtn.alignment = ["fill", "top"];

        var status = win.add("statictext", undefined, "Ready");
        status.alignment = ["fill", "top"];

        scanBtn.onClick = function () {
            scanSelectedFolder(foldersPanel, scanState, status, win);
        };

        duplicateBtn.onClick = function () {
            duplicateSelectedFolder(
                replaceCheck.value,
                customVersionInput.text,
                status,
                scanState
            );
        };

        win.onResizing = win.onResize = function () {
            this.layout.resize();
        };

        return win;
    }

    function scanSelectedFolder(foldersPanel, scanState, statusText, win) {
        if (!app.project) {
            alert("No project is open.");
            return;
        }

        var selection = app.project.selection;

        if (!selection || selection.length !== 1 || !(selection[0] instanceof FolderItem)) {
            alert("Select exactly one version folder in the Project panel before scanning.");
            return;
        }

        var sourceFolder = selection[0];
        var folderRecords = [];

        collectSubfolders(sourceFolder, 0, folderRecords);
        clearContainer(foldersPanel);

        scanState.rootFolder = sourceFolder;
        scanState.rows = [];
        foldersPanel.text = "Subfolders in " + sourceFolder.name;

        if (folderRecords.length === 0) {
            var emptyMessage = foldersPanel.add(
                "statictext",
                undefined,
                "No subfolders found. Root-level comps will be duplicated."
            );
            emptyMessage.alignment = ["fill", "top"];
        } else {
            for (var i = 0; i < folderRecords.length; i++) {
                var record = folderRecords[i];
                var checkbox = foldersPanel.add(
                    "checkbox",
                    undefined,
                    makeIndent(record.depth) + record.folder.name
                );

                checkbox.value = true;
                checkbox.alignment = ["fill", "top"];

                scanState.rows.push({
                    folder: record.folder,
                    checkbox: checkbox
                });
            }

            installFolderCheckboxHandlers(scanState);
        }

        statusText.text = "Scanned " + folderRecords.length + " subfolders";

        try {
            win.layout.layout(true);
            win.layout.resize();
            win.update();
        } catch (e1) {}
    }

    function duplicateSelectedFolder(relinkComps, customVersionText, statusText, scanState) {
        if (!app.project) {
            alert("No project is open.");
            return;
        }

        var selection = app.project.selection;

        if (!selection || selection.length !== 1 || !(selection[0] instanceof FolderItem)) {
            alert("Select exactly one version folder in the Project panel.\nExample: 1.4.3");
            return;
        }

        var sourceFolder = selection[0];
        var customVersion = trimText(customVersionText);
        var includedFolderIds = null;

        if (scanState.rootFolder !== null) {
            if (scanState.rootFolder !== sourceFolder) {
                alert(
                    "The selected folder is different from the scanned folder.\n\n" +
                    "Click Scan Subfolders again before duplicating."
                );
                return;
            }

            includedFolderIds = getIncludedFolderIds(scanState.rows);
        }

        if (customVersion !== "" && !isValidVersion(customVersion)) {
            alert(
                "The custom version is not valid.\n\n" +
                "Use numbers separated by dots, for example:\n1.5.1"
            );
            return;
        }

        var versionInfo = getVersionInfo(sourceFolder.name, customVersion);

        if (!versionInfo) {
            alert(
                "Could not find a version number at the end of the selected folder name.\n\n" +
                "Expected something like:\n1.4.3\nEpisode 1.4.3"
            );
            return;
        }

        if (versionInfo.oldVersion === versionInfo.newVersion) {
            alert("The custom version must be different from the current version.");
            return;
        }

        var parentFolder = sourceFolder.parentFolder;

        if (folderExists(parentFolder, versionInfo.newFolderName)) {
            alert(
                "A folder named \"" + versionInfo.newFolderName + "\" already exists next to the selected folder."
            );
            return;
        }

        app.beginUndoGroup("Duplicate Version Folder");

        try {
            statusText.text = "Duplicating...";
            refreshStatus(statusText);

            var newRoot = app.project.items.addFolder(versionInfo.newFolderName);
            newRoot.parentFolder = parentFolder;

            try {
                newRoot.label = sourceFolder.label;
            } catch (e1) {}

            var oldComps = [];
            var newComps = [];

            duplicateFolderContents(
                sourceFolder,
                newRoot,
                versionInfo.oldVersion,
                versionInfo.newVersion,
                oldComps,
                newComps,
                includedFolderIds
            );

            var replacedCount = 0;

            if (relinkComps) {
                replacedCount = relinkDuplicatedComps(oldComps, newComps);
            }

            try {
                sourceFolder.selected = false;
                newRoot.selected = true;
            } catch (e2) {}

            statusText.text =
                versionInfo.oldVersion + "  ->  " + versionInfo.newVersion +
                " | " + newComps.length + " comps" +
                (relinkComps ? " | " + replacedCount + " sources replaced" : "");

            refreshStatus(statusText);

        } catch (err) {
            statusText.text = "Error";
            refreshStatus(statusText);
            alert("Version Duplicator error:\n" + err.toString());
        } finally {
            app.endUndoGroup();
        }
    }

    function duplicateFolderContents(
        sourceFolder,
        destinationFolder,
        oldVersion,
        newVersion,
        oldComps,
        newComps,
        includedFolderIds
    ) {
        var children = [];
        var i;

        for (i = 1; i <= sourceFolder.numItems; i++) {
            children.push(sourceFolder.item(i));
        }

        for (i = 0; i < children.length; i++) {
            var item = children[i];

            if (item instanceof FolderItem) {
                if (
                    includedFolderIds !== null &&
                    includedFolderIds[String(item.id)] !== true
                ) {
                    continue;
                }

                var newFolder = app.project.items.addFolder(
                    replaceVersion(item.name, oldVersion, newVersion)
                );

                newFolder.parentFolder = destinationFolder;

                try {
                    newFolder.label = item.label;
                } catch (e1) {}

                duplicateFolderContents(
                    item,
                    newFolder,
                    oldVersion,
                    newVersion,
                    oldComps,
                    newComps,
                    includedFolderIds
                );

            } else if (item instanceof CompItem) {
                var duplicatedComp = item.duplicate();

                duplicatedComp.name = replaceVersion(
                    item.name,
                    oldVersion,
                    newVersion
                );

                duplicatedComp.parentFolder = destinationFolder;

                try {
                    duplicatedComp.label = item.label;
                } catch (e2) {}

                oldComps.push(item);
                newComps.push(duplicatedComp);
            }

            // Footage, audio, and solids stay shared with the original version.
        }
    }

    function collectSubfolders(parentFolder, depth, records) {
        var children = [];
        var i;

        for (i = 1; i <= parentFolder.numItems; i++) {
            children.push(parentFolder.item(i));
        }

        for (i = 0; i < children.length; i++) {
            var item = children[i];

            if (item instanceof FolderItem) {
                records.push({
                    folder: item,
                    depth: depth
                });

                collectSubfolders(item, depth + 1, records);
            }
        }
    }

    function installFolderCheckboxHandlers(scanState) {
        for (var i = 0; i < scanState.rows.length; i++) {
            (function (row, rows, rootFolder) {
                row.checkbox.onClick = function () {
                    var j;

                    if (!row.checkbox.value) {
                        for (j = 0; j < rows.length; j++) {
                            if (isDescendantFolder(rows[j].folder, row.folder)) {
                                rows[j].checkbox.value = false;
                            }
                        }
                    } else {
                        var parent = row.folder.parentFolder;

                        while (parent && parent !== rootFolder) {
                            for (j = 0; j < rows.length; j++) {
                                if (rows[j].folder === parent) {
                                    rows[j].checkbox.value = true;
                                    break;
                                }
                            }

                            parent = parent.parentFolder;
                        }
                    }
                };
            })(scanState.rows[i], scanState.rows, scanState.rootFolder);
        }
    }

    function isDescendantFolder(folder, possibleAncestor) {
        var parent = folder.parentFolder;

        while (parent) {
            if (parent === possibleAncestor) {
                return true;
            }

            if (parent === app.project.rootFolder) {
                break;
            }

            parent = parent.parentFolder;
        }

        return false;
    }

    function getIncludedFolderIds(rows) {
        var included = {};

        for (var i = 0; i < rows.length; i++) {
            included[String(rows[i].folder.id)] = rows[i].checkbox.value === true;
        }

        return included;
    }

    function makeIndent(depth) {
        var indent = "";

        for (var i = 0; i < depth; i++) {
            indent += "    ";
        }

        return indent;
    }

    function clearContainer(container) {
        while (container.children.length > 0) {
            container.remove(container.children[0]);
        }
    }

    function relinkDuplicatedComps(oldComps, newComps) {
        var replaced = 0;

        for (var c = 0; c < newComps.length; c++) {
            var comp = newComps[c];

            for (var l = 1; l <= comp.numLayers; l++) {
                var layer = comp.layer(l);
                var src = null;

                try {
                    src = layer.source;
                } catch (e1) {
                    src = null;
                }

                if (src && (src instanceof CompItem)) {
                    var index = findCompIndex(oldComps, src);

                    if (index !== -1) {
                        try {
                            layer.replaceSource(newComps[index], true);
                            replaced++;
                        } catch (e2) {}
                    }
                }
            }
        }

        return replaced;
    }

    function findCompIndex(compArray, compToFind) {
        for (var i = 0; i < compArray.length; i++) {
            if (compArray[i] === compToFind) {
                return i;
            }
        }

        return -1;
    }

    function getVersionInfo(folderName, customVersion) {
        var match = folderName.match(/(\d+(?:\.\d+)*)$/);

        if (!match) {
            return null;
        }

        var oldVersion = match[1];
        var newVersion;

        if (customVersion !== "") {
            newVersion = customVersion;
        } else {
            var parts = oldVersion.split(".");
            var lastIndex = parts.length - 1;

            parts[lastIndex] = String(parseInt(parts[lastIndex], 10) + 1);
            newVersion = parts.join(".");
        }

        var prefix = folderName.substring(0, folderName.length - oldVersion.length);

        return {
            oldVersion: oldVersion,
            newVersion: newVersion,
            newFolderName: prefix + newVersion
        };
    }

    function isValidVersion(versionText) {
        return /^\d+(?:\.\d+)*$/.test(versionText);
    }

    function trimText(text) {
        return String(text).replace(/^\s+|\s+$/g, "");
    }

    function replaceVersion(text, oldVersion, newVersion) {
        return text.split(oldVersion).join(newVersion);
    }

    function folderExists(parentFolder, folderName) {
        for (var i = 1; i <= app.project.numItems; i++) {
            var item = app.project.item(i);

            if (
                item instanceof FolderItem &&
                item.parentFolder === parentFolder &&
                item.name === folderName
            ) {
                return true;
            }
        }

        return false;
    }

    function refreshStatus(statusText) {
        try {
            statusText.parent.layout.layout(true);
            statusText.parent.update();
        } catch (e) {}
    }

    var win = buildUI(thisObj);

    if (win instanceof Window) {
        win.center();
        win.show();
    } else {
        win.layout.layout(true);
    }

})(this);
