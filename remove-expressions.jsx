{
    function removeExpressionsFromSelectedLayers() {

        var comp = app.project.activeItem;

        if (!(comp instanceof CompItem)) {
            alert("Please select a composition.");
            return;
        }

        var layers = comp.selectedLayers;

        if (layers.length === 0) {
            alert("Select at least one layer.");
            return;
        }

        app.beginUndoGroup("Remove All Expressions");

        // Recursive function to traverse properties
        function traverseProperties(propGroup) {
            for (var i = 1; i <= propGroup.numProperties; i++) {
                var prop = propGroup.property(i);

                if (prop instanceof PropertyGroup) {
                    // Dive into groups recursively
                    traverseProperties(prop);
                } else {
                    if (prop.canSetExpression && prop.expression !== "") {
                        prop.expression = "";
                        prop.expressionEnabled = false;
                    }
                }
            }
        }

        // Loop through selected layers
        for (var i = 0; i < layers.length; i++) {
            traverseProperties(layers[i]);
        }

        app.endUndoGroup();
    }

    removeExpressionsFromSelectedLayers();
}