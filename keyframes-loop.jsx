{
    function addSmartLoop() {

        var comp = app.project.activeItem;
        if (!(comp instanceof CompItem)) {
            alert("Select a composition.");
            return;
        }

        var props = comp.selectedProperties;

        if (props.length === 0) {
            alert("Select at least one property.");
            return;
        }

        app.beginUndoGroup("Add Smart Loop");

        for (var i = 0; i < props.length; i++) {

            var prop = props[i];

            if (!prop.canSetExpression || prop.numKeys < 1)
                continue;

            var isPath = false;

            // Detect Path property
            if (prop.propertyValueType === PropertyValueType.SHAPE)
                isPath = true;

            if (prop.expression.indexOf("loop") !== -1)
                continue; // avoid duplicate loop

            if (isPath) {

                var pathLoopExpression =
"// loop path keyframes. Behaves like loopOut('cycle')\n" +
"if (numKeys > 1 && time > key(numKeys).time) {\n" +
"  t1 = key(1).time;\n" +
"  t2 = key(numKeys).time;\n" +
"  span = t2 - t1;\n" +
"  delta = time - t2;\n" +
"  t = delta % span;\n" +
"  valueAtTime(t1 + t);\n" +
"} else {\n" +
"  value;\n" +
"}";

                prop.expression = pathLoopExpression;

            } else {

                // Normal properties
                prop.expression = "loopOut(\"cycle\");";
            }

            prop.expressionEnabled = true;
        }

        app.endUndoGroup();
    }

    addSmartLoop();
}