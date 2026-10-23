// After Effects Script to Offset Layers Y Position Based on Essential Properties Value

// Instructions:
// - Select your 10 layers in the timeline.
// - Run this script.
// - Enter the base offset value in the UI (e.g., 150).
// - The script will sort the layers by their Essential Properties "value" (ascending).
// - The layer with the lowest value gets rank 10 (offset = base * 10).
// - The layer with the highest value gets rank 1 (offset = base * 1).
// - Adds the offset to the current Y position of each layer.

// Note: This assumes each layer has an Essential Properties group with a property named "value".
// Assumes the property value is numeric.

function getEssentialValue(layer) {
    var ep = layer.essentialProperty;
    if (ep && ep.numProperties > 0) {
        var prop = ep.property("value"); // Access by name "value"
        if (prop && prop.propertyValueType === PropertyValueType.ONE_D) {
            return prop.value;
        }
    }
    return 0; // Default if no value found
}

var win = new Window("dialog", "Offset Layers by Rank");
win.orientation = "column";
win.alignChildren = "fill";

var inputPanel = win.add("panel", undefined, "Base Offset");
inputPanel.orientation = "row";
inputPanel.add("statictext", undefined, "Offset Amount:");
var offsetInput = inputPanel.add("edittext", undefined, "150");
offsetInput.characters = 10;

var buttonGroup = win.add("group");
buttonGroup.orientation = "row";
var applyBtn = buttonGroup.add("button", undefined, "Apply");
var cancelBtn = buttonGroup.add("button", undefined, "Cancel");

applyBtn.onClick = function() {
    var baseOffset = parseFloat(offsetInput.text);
    if (isNaN(baseOffset)) {
        alert("Please enter a valid number for the offset.");
        return;
    }

    var comp = app.project.activeItem;
    if (!comp || !(comp instanceof CompItem)) {
        alert("Please select a composition.");
        return;
    }

    var selectedLayers = comp.selectedLayers;
    if (selectedLayers.length !== 10) {
        alert("Please select exactly 10 layers.");
        return;
    }

    app.beginUndoGroup("Offset Layers by Essential Value Rank");

    // Collect layer data
    var layerData = [];
    for (var i = 0; i < selectedLayers.length; i++) {
        var val = getEssentialValue(selectedLayers[i]);
        layerData.push({layer: selectedLayers[i], value: val, name: selectedLayers[i].name});
    }

    // For debug: sort by name number and alert values
    layerData.sort(function(a, b) {
        var numA = parseInt(a.name.match(/_(\d+)$/)[1]);
        var numB = parseInt(b.name.match(/_(\d+)$/)[1]);
        return numA - numB;
    });

    var debugStr = "Layer values:\n";
    for (var k = 0; k < layerData.length; k++) {
        debugStr += layerData[k].name + ": " + layerData[k].value + "\n";
    }
    alert(debugStr);

    // Now sort by value ascending for ranking
    layerData.sort(function(a, b) {
        return a.value - b.value;
    });

    // Apply offsets: rank 10 for lowest, 1 for highest
    for (var j = 0; j < layerData.length; j++) {
        var rank = layerData.length - j; // 10 down to 1
        var offset = baseOffset * rank;
        var lay = layerData[j].layer;
        var transform = lay.property("ADBE Transform Group");
        if (!transform) continue;

        var posProp = transform.property("ADBE Position");
        if (posProp.dimensionsSeparated) {
            // If position dimensions are separated
            var yPosProp = transform.property("ADBE Position_1"); // Y Position
            if (yPosProp) {
                yPosProp.setValue(yPosProp.value + offset);
            }
        } else {
            // Combined position
            var posValue = posProp.value;
            posValue[1] += offset; // Y is index 1
            posProp.setValue(posValue);
        }
    }

    app.endUndoGroup();
    win.close();
};

cancelBtn.onClick = function() {
    win.close();
};

win.center();
win.show();