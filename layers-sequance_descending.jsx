(function sequenceTool(thisObj){

// ---------------- ORDER FUNCTION ----------------
function sortLayers(layers, orderMode){
    if(orderMode === "asc"){ layers.sort(function(a,b){ return a.index - b.index; }); }
    if(orderMode === "desc"){ layers.sort(function(a,b){ return b.index - a.index; }); }
    if(orderMode === "random"){
        for (var i=layers.length-1; i>0; i--){
            var j=Math.floor(Math.random()*(i+1));
            var temp = layers[i]; layers[i]=layers[j]; layers[j]=temp;
        }
    }
    return layers;
}

// ---------------- SEQUENCE FUNCTION ----------------
function sequenceLayers(mode, groupSize, seqFrames, orderMode){
    var comp = app.project.activeItem;
    if (!(comp instanceof CompItem)) return;
    var layers = comp.selectedLayers;
    if (layers.length === 0) return;

    if(orderMode !== "selected"){ layers = sortLayers(layers, orderMode); }

    var frame = Math.abs(seqFrames) / comp.frameRate;
    if(seqFrames < 0) frame = -frame;

    var groups = [];

    if(mode==="groups"){
        for(var i=0;i<layers.length;i+=groupSize){
            var g=[];
            for(var j=0;j<groupSize;j++){
                if(layers[i+j]) g.push(layers[i+j]);
            }
            groups.push(g);
        }
    }

    if(mode==="labels"){
        var labelGroups={}, order=[];
        for(var i=0;i<layers.length;i++){
            var l=layers[i], label=l.label;
            if(!labelGroups[label]){
                labelGroups[label]=[];
                order.push(label);
            }
            labelGroups[label].push(l);
        }
        for(var k=0;k<order.length;k++){ groups.push(labelGroups[order[k]]); }
    }

    if(mode==="parents"){
        var families={};
        function getRoot(layer){ while(layer.parent) layer=layer.parent; return layer.index; }
        for(var i=0;i<layers.length;i++){
            var root=getRoot(layers[i]);
            if(!families[root]){
                families[root]=[];
                groups.push(families[root]);
            }
            families[root].push(layers[i]);
        }
    }

    app.beginUndoGroup("Sequence Layers");

    for(var g=0;g<groups.length;g++){
        var offset=g*frame;
        for(var j=0;j<groups[g].length;j++){
            groups[g][j].startTime+=offset;
        }
    }

    app.endUndoGroup();
}

// ---------------- BUILD UI ----------------
function buildUI(thisObj){

    var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette","Sequence Layers",undefined,{resizeable:true});

    panel.orientation="column";
    panel.alignChildren="fill";
    panel.spacing = 6;
    panel.margins = [10,10,10,10];

    var sliderWidth = 150;
    var checkboxWidth = 70;

    // ---------- ROW 1 ----------
    var parentsChk = panel.add("checkbox", undefined, "Parents");
    parentsChk.preferredSize.width = checkboxWidth;

    // ---------- ROW 2 ----------
    var labelsChk = panel.add("checkbox", undefined, "Labels");
    labelsChk.preferredSize.width = checkboxWidth;

    // ---------- ROW 3 ----------
    var groupsRow = panel.add("group");
    groupsRow.alignChildren="center";
    groupsRow.spacing = 4;

    var groupsChk = groupsRow.add("checkbox", undefined, "Groups");
    groupsChk.value = true;
    groupsChk.preferredSize.width = checkboxWidth;

    var groupsSlider = groupsRow.add("slider", undefined, 1, 1, 10);
    groupsSlider.preferredSize.width = sliderWidth;

    var groupsInput = groupsRow.add("edittext", undefined, 1);
    groupsInput.characters = 5;

    groupsSlider.onChanging = function(){
        groupsInput.text = Math.round(groupsSlider.value);
    };

    groupsInput.onChange = function(){
        var v=parseFloat(groupsInput.text);
        if(isNaN(v)) v=1;
        groupsInput.text=v;
    };

    // mode switching
    var mode = "groups";

    function setMode(selected){
        mode = selected;
        parentsChk.value = (selected==="parents");
        labelsChk.value = (selected==="labels");
        groupsChk.value = (selected==="groups");
    }

    parentsChk.onClick=function(){ setMode("parents"); };
    labelsChk.onClick=function(){ setMode("labels"); };
    groupsChk.onClick=function(){ setMode("groups"); };

    // ---------- ROW 4 ----------
    var seqRow = panel.add("group");
    seqRow.alignChildren="center";
    seqRow.spacing = 4;

    var seqLabel = seqRow.add("statictext", undefined, "Sequence");
    seqLabel.preferredSize.width = checkboxWidth;

    var seqSlider = seqRow.add("slider", undefined, 1, -10, 10);
    seqSlider.preferredSize.width = sliderWidth;

    var seqInput = seqRow.add("edittext", undefined, 1);
    seqInput.characters = 5;

    seqSlider.onChanging=function(){
        seqInput.text=Math.round(seqSlider.value);
    };

    seqInput.onChange=function(){
        var v=parseFloat(seqInput.text);
        if(isNaN(v)) v=0;
        seqInput.text=v;
    };

    // ORDER DROPDOWN
    var orderMenu = seqRow.add("dropdownlist", undefined, ["Ascending","Descending","Selected","Random"]);
    orderMenu.selection = 1; // DESCENDING DEFAULT

    function getOrderMode(){
        switch(orderMenu.selection.index){
            case 0: return "asc";
            case 1: return "desc";
            case 2: return "selected";
            case 3: return "random";
        }
    }

    // ---------- ROW 5 ----------
    var btnRow = panel.add("group");

    var closeBtn = btnRow.add("button", undefined, "Close");
    closeBtn.preferredSize.width = 70;

    var runBtn = btnRow.add("button", undefined, "Run");

    function runScript(){

        var groupSize=parseFloat(groupsInput.text);
        if(isNaN(groupSize)) groupSize=1;

        var seq=parseFloat(seqInput.text);
        if(isNaN(seq)) seq=1;

        var orderMode=getOrderMode();

        sequenceLayers(mode,groupSize,seq,orderMode);
    }

    runBtn.onClick=runScript;
    closeBtn.onClick=function(){ panel.close(); };

    panel.layout.layout(true);
    panel.layout.resize();

    panel.onResizing = panel.onResize = function(){
        this.layout.resize();
    };

    return panel;
}

// ---------------- KEY MODIFIERS ----------------
var kb = ScriptUI.environment.keyboardState;
var shift = kb.shiftKey;
var ctrl = kb.ctrlKey;

if(ctrl && shift){

    var myPanel = buildUI(thisObj);

    if(myPanel instanceof Window){
        myPanel.center();
        myPanel.show();
    }

}else{

    var mode="groups";

    if(shift && !ctrl) mode="labels";
    if(ctrl && !shift) mode="parents";

    sequenceLayers(mode,1,1,"desc"); // DEFAULT DESCENDING
}

})();