function pickColorForBG(startColor) {
  var currentComp = app.project.activeItem;
  if (!currentComp || !(currentComp instanceof CompItem)) {
    alert("Please select or open a composition first.");
    return null;
  }

  // Create temporary shape layer
  var tempLayer = currentComp.layers.addShape();

  // Add Color Control effect
  var colorEffect = tempLayer.property("ADBE Effect Parade").addProperty("ADBE Color Control");
  var colorProp = colorEffect.property("ADBE Color Control-0001");

  // Set initial color if provided (e.g., current bgColor or default)
  if (startColor) {
    if (startColor.length === 3) {
      colorProp.setValue([startColor[0], startColor[1], startColor[2], 1]);
    } else if (startColor.length === 4) {
      colorProp.setValue(startColor);
    }
  }

  // Select the property and execute "Edit Value..." command to open picker
  colorProp.selected = true;
  app.executeCommand(2240);  // 2240 is the ID for "Edit Value..."

  // Get the selected color (slice to 3 values, ignoring alpha)
  var selectedColor = colorProp.value.slice(0, 3);

  // Clean up: remove the temp layer
  if (tempLayer) {
    tempLayer.remove();
  }

  return selectedColor;
}

// Run the function and apply to bgColor (start with current bgColor as default)
var newBGColor = pickColorForBG(app.project.activeItem.bgColor);
if (newBGColor) {
  app.project.activeItem.bgColor = newBGColor;
}