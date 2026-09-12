(function sequenceCascadeUI(thisObj){// ---------------- SEQUENCE FUNCTION ----------------
function sequenceKeyframes(frameOffset, groupByLayer, orderMode, groupSize){
    if(typeof groupSize === 'undefined') groupSize = 1;
    var comp = app.project.activeItem;
    if(!(comp instanceof CompItem)) return;var props = comp.selectedProperties;
if(props.length === 0) return;

var kb = ScriptUI.environment.keyboardState;
var altKey = kb.altKey;

var records=[];

// COLLECT ALL SELECTED KEYS
for(var p=0;p<props.length;p++){
    var prop = props[p];
    if(!(prop instanceof Property)) continue;

    for(var k=1;k<=prop.numKeys;k++){
        if(prop.keySelected(k)){
            records.push({
                prop:prop,
                index:k,
                time:prop.keyTime(k),
                value:prop.keyValue(k),
                inType:prop.keyInInterpolationType(k),
                outType:prop.keyOutInterpolationType(k),
                inEase:prop.keyInTemporalEase(k),
                outEase:prop.keyOutTemporalEase(k),
                label:prop.keyLabel(k),
                layerIndex:prop.propertyGroup(prop.propertyDepth).index,
                propIndex:prop.propertyIndex
            });
        }
    }
}

if(records.length===0) return;

// GROUP RECORDS
var grouped=[];

if(groupByLayer){
    var layerMap = {};
    for(var i=0;i<records.length;i++){
        var r = records[i];
        if(!layerMap[r.layerIndex]) layerMap[r.layerIndex] = [];
        layerMap[r.layerIndex].push(r);
    }

    var layerIndices=[];
    for(var li in layerMap){
        if(layerMap.hasOwnProperty(li)){
            layerIndices.push(Number(li));
        }
    }
    layerIndices.sort(function(a,b){return a-b;});

    for(var l=0;l<layerIndices.length;l++){
        grouped.push({records:layerMap[layerIndices[l]]});
    }

}else{
    var current=null;
    for(var i=0;i<records.length;i++){
        var r=records[i];
        if(!current || current.prop !== r.prop){
            current={prop:r.prop, records:[]};
            grouped.push(current);
        }
        current.records.push(r);
    }
}

// SORT BY TIMELINE ORDER
var topGroupOrders = {
    "ADBE Root Vectors Group": 1,
    "ADBE Text Properties": 1,
    "ADBE Mask Parade": 2,
    "ADBE Effect Parade": 3,
    "ADBE Layer Styles": 4,
    "ADBE Extrsn Options Group": 5,
    "ADBE Material Options Group": 6,
    "ADBE Camera Options Group": 6,
    "ADBE Light Options Group": 6,
    "ADBE Transform Group": 7,
    "ADBE Audio Group": 8
};

function getSortKey(prop){
    var topGroup = prop.propertyGroup(prop.propertyDepth - 1);
    var topMatch = topGroup.matchName;
    var groupOrder = topGroupOrders[topMatch] || 99;
    
    var path = [];
    var current = prop;
    while(current.parentProperty){
        if(current.propertyIndex){
            path.push(current.propertyIndex);
        }
        current = current.parentProperty;
    }
    path.reverse();
    path.unshift(groupOrder);
    
    var key = '';
    for(var i=0; i<path.length; i++){
        key += ('000' + path[i]).slice(-3);
    }
    return key;
}

grouped.sort(function(a,b){
    var aLayer = a.records[0].layerIndex;
    var bLayer = b.records[0].layerIndex;
    if(aLayer !== bLayer) return aLayer-bLayer;
    if(!groupByLayer){
        var aKey = getSortKey(a.records[0].prop);
        var bKey = getSortKey(b.records[0].prop);
        return aKey.localeCompare(bKey);
    }
    return 0;
});

// HANDLE ORDER MODE
// orderMode: "asc" = ascending, "desc" = descending
if(orderMode==="desc" || altKey) grouped.reverse();

// APPLY CASCADE
app.beginUndoGroup("Cascade Keyframes");

for(var g=0; g<grouped.length; g++){
    var shift = Math.floor(g / groupSize) * frameOffset / comp.frameRate;
    for(var r=0;r<grouped[g].records.length;r++){
        grouped[g].records[r].newTime = grouped[g].records[r].time + shift;
    }
}

// REMOVE OLD KEYS
var propGroups=[];
for(var i=0;i<grouped.length;i++){
    for(var j=0;j<grouped[i].records.length;j++){
        var r = grouped[i].records[j];
        var found=false;
        for(var k=0;k<propGroups.length;k++){
            if(propGroups[k].prop===r.prop){
                propGroups[k].indices.push(r.index);
                found=true;
                break;
            }
        }
        if(!found){
            propGroups.push({prop:r.prop, indices:[r.index]});
        }
    }
}

for(var j=0;j<propGroups.length;j++){
    var pg=propGroups[j];
    pg.indices.sort(function(a,b){return b-a;});
    for(var k=0;k<pg.indices.length;k++){
        pg.prop.removeKey(pg.indices[k]);
    }
}

// ADD NEW KEYS
var all=[];
for(var g=0; g<grouped.length; g++){
    all=all.concat(grouped[g].records);
}

all.sort(function(a,b){return a.newTime - b.newTime;});

var newKeys=[];
for(var i=0;i<all.length;i++){
    var r=all[i];
    var newIndex=r.prop.addKey(r.newTime);
    r.prop.setValueAtKey(newIndex,r.value);
    r.prop.setInterpolationTypeAtKey(newIndex,r.inType,r.outType);
    r.prop.setTemporalEaseAtKey(newIndex,r.inEase,r.outEase);
    r.prop.setLabelAtKey(newIndex,r.label);
    newKeys.push({prop:r.prop,index:newIndex});
}

for(var i=0;i<newKeys.length;i++){
    newKeys[i].prop.setSelectedAtKey(newKeys[i].index,true);
}

app.endUndoGroup();}// ---------------- BUILD UI ----------------
function buildUI(thisObj){
    var panel = (thisObj instanceof Panel) ? thisObj : new Window("palette","Sequence Keyframes",undefined,{resizeable:true});
    panel.orientation="column";
    panel.alignChildren="fill";
    panel.spacing=6;
    panel.margins=[10,10,10,10];var sliderWidth=150;
var inputWidth=50;
var checkboxWidth=200;

// ---------- CHECKBOX: group per layer ----------
var ctrlChk = panel.add("checkbox", undefined, "Layer Family");
ctrlChk.preferredSize.width = checkboxWidth;

// ---------- ROW: group slider + input ----------
var groupRow = panel.add("group");
groupRow.alignChildren="center";
groupRow.spacing=4;

var groupLabel = groupRow.add("statictext", undefined, "Group");
groupLabel.preferredSize.width = 120;

var groupSlider = groupRow.add("slider", undefined, 1, 0, 5);
groupSlider.preferredSize.width = sliderWidth;
var groupInput = groupRow.add("edittext", undefined, 1);
groupInput.characters=5;
groupSlider.onChanging = function(){ groupInput.text=Math.round(groupSlider.value); };
groupInput.onChange = function(){ var v=parseInt(groupInput.text); if(isNaN(v) || v<0) v=1; groupInput.text=v; };

// ---------- ROW: frame offset slider + input ----------
var seqRow = panel.add("group");
seqRow.alignChildren="center";
seqRow.spacing=4;

var seqLabel = seqRow.add("statictext", undefined, "Sequence Frames");
seqLabel.preferredSize.width = 120;

var seqSlider = seqRow.add("slider", undefined, 1, -10, 10);
seqSlider.preferredSize.width = sliderWidth;
var seqInput = seqRow.add("edittext", undefined, 1);
seqInput.characters=5;
seqSlider.onChanging = function(){ seqInput.text=Math.round(seqSlider.value); };
seqInput.onChange = function(){ var v=parseFloat(seqInput.text); if(isNaN(v)) v=1; seqInput.text=v; };

// ---------- ROW: order dropdown ----------
var orderRow = panel.add("group");
orderRow.alignChildren="center"; orderRow.spacing=4;

var orderLabel = orderRow.add("statictext", undefined, "Cascade Order");
orderLabel.preferredSize.width = 120;

var orderMenu = orderRow.add("dropdownlist", undefined, ["Ascending", "Descending"]);
orderMenu.selection = 0;

function getOrderMode(){ return orderMenu.selection.index===0 ? "asc" : "desc"; }

// ---------- BUTTONS ----------
var btnRow = panel.add("group");
btnRow.spacing=6;
var closeBtn = panel.add("button", undefined, "Close"); closeBtn.preferredSize.width=70;
var runBtn = panel.add("button", undefined, "Run"); runBtn.preferredSize.width=sliderWidth+inputWidth+4;

runBtn.onClick=function(){
    var seq = parseFloat(seqInput.text); if(isNaN(seq)) seq=1;
    var groupByLayer = ctrlChk.value;
    var orderMode = getOrderMode();
    var groupSize = parseInt(groupInput.text); if(isNaN(groupSize) || groupSize < 1) groupSize = 1;
    sequenceKeyframes(seq, groupByLayer, orderMode, groupSize);
};

closeBtn.onClick=function(){ panel.close(); };

panel.layout.layout(true);
panel.layout.resize();
panel.onResizing=panel.onResize=function(){ this.layout.resize(); };

return panel;}// ---------------- KEY MODIFIER LOGIC ----------------
var kb = ScriptUI.environment.keyboardState;
if(kb.ctrlKey && kb.shiftKey){
    var myPanel = buildUI(thisObj);
    if(myPanel instanceof Window){ myPanel.center(); myPanel.show(); }
}else{
    // default run
    sequenceKeyframes(1,false,"asc",1);
}})();

