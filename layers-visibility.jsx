(function toggleVisibilityTool(thisObj){
// Toggle Visibility Script for After Effects
// - Run normally: Hide selected layers (or all null layers if none selected)
// - With Ctrl: Show selected layers (or all null layers if none selected)
// - With Ctrl + Shift: Open UI panel to show/hide nulls and/or shape layers// ---------------- TOGGLE FUNCTION ----------------
function toggleLayers(layers, visible){
    if(layers.length === 0) return;
    app.beginUndoGroup(visible ? "Show Layers" : "Hide Layers");
    for(var i=0; i<layers.length; i++){
        layers[i].enabled = visible;
    }
    app.endUndoGroup();
}// ---------------- BUILD UI ----------------
function buildUI(thisObj){
    var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette","Toggle Visibility",undefined,{resizeable:true});
    panel.orientation="column";
    panel.alignChildren="fill";
    panel.spacing = 6;
    panel.margins = [10,10,10,10];var checkboxWidth = 100; // Adjusted for longer labels

// ---------- ROW 1: Nulls checkbox ----------
var nullChk = panel.add("checkbox", undefined, "Nulls");
nullChk.value = true;
nullChk.preferredSize.width = checkboxWidth;

// ---------- ROW 2: Shape Layers checkbox ----------
var shapeChk = panel.add("checkbox", undefined, "Shape Layers");
shapeChk.value = false;
shapeChk.preferredSize.width = checkboxWidth;

// ---------- ROW 3: Buttons ----------
var btnRow = panel.add("group");
btnRow.spacing = 6;
var showBtn = btnRow.add("button", undefined, "Show All");
showBtn.preferredSize.width = 80; 
var hideBtn = btnRow.add("button", undefined, "Hide All");
hideBtn.preferredSize.width = 80; 
var closeBtn = btnRow.add("button", undefined, "Close");
closeBtn.preferredSize.width = 70; 

function performToggle(visible){
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) { alert("Please open a composition."); return; }
    var layersToToggle = [];
    for(var i=1; i<=comp.numLayers; i++){
        var layer = comp.layer(i);
        if(nullChk.value && layer.nullLayer){
            layersToToggle.push(layer);
        }
        if(shapeChk.value && layer.matchName === "ADBE Vector Layer" && !layer.nullLayer){
            layersToToggle.push(layer);
        }
    }
    if(layersToToggle.length === 0){
        alert("No layers match the selected types.");
        return;
    }
    toggleLayers(layersToToggle, visible);
}

showBtn.onClick = function(){ performToggle(true); };
hideBtn.onClick = function(){ performToggle(false); };
closeBtn.onClick = function(){ panel.close(); };

panel.layout.layout(true);
panel.layout.resize();
panel.onResizing = panel.onResize = function(){ this.layout.resize(); };

return panel;}// ---------------- KEY MODIFIER LOGIC ----------------
var kb = ScriptUI.environment.keyboardState; 
var shift = kb.shiftKey, ctrl = kb.ctrlKey;if(ctrl && shift){
    // Ctrl + Shift = Open UI
    var myPanel = buildUI(thisObj);
    if(myPanel instanceof Window){ myPanel.center(); myPanel.show(); }
}else{
    // Original logic: hide if no ctrl, show if ctrl (no shift)
    var visible = ctrl;
    var comp = app.project.activeItem;
    if (comp instanceof CompItem) {
        var layers = comp.selectedLayers;
        if (layers.length === 0) {
            // If no selection, target all null layers
            layers = [];
            for(var i=1; i<=comp.numLayers; i++){
                var layer = comp.layer(i);
                if(layer.nullLayer){
                    layers.push(layer);
                }
            }
            if(layers.length === 0){
                alert("No null layers found.");
                return;
            }
        }
        toggleLayers(layers, visible);
    } else {
        alert("Please open a composition.");
    }
}})();

