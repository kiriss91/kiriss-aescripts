app.beginUndoGroup("Anchor Center (Rotation + Scale Safe)");

var comp=app.project.activeItem;
if(!comp || !(comp instanceof CompItem)){ alert("Select a composition with layers."); }
else if(comp.selectedLayers.length===0){ alert("Select at least one layer."); }
else{
    for(var i=0;i<comp.selectedLayers.length;i++){
        var layer=comp.selectedLayers[i];
        var left=0, top=0, width=0, height=0;
        if(layer instanceof TextLayer || layer instanceof ShapeLayer){
            var rect=layer.sourceRectAtTime(comp.time,false);
            left=rect.left; top=rect.top; width=rect.width; height=rect.height;
        } else { left=0; top=0; width=layer.width; height=layer.height; }

        var newAnchor=[left + width/2, top + height/2]; // Center
        var oldAnchor=layer.anchorPoint.value;
        var deltaX=newAnchor[0]-oldAnchor[0];
        var deltaY=newAnchor[1]-oldAnchor[1];

        var scaleX=layer.scale.value[0]/100;
        var scaleY=layer.scale.value[1]/100;
        var rot=layer.rotation.value*Math.PI/180;

        var dx=deltaX*scaleX;
        var dy=deltaY*scaleY;
        var deltaCompX=dx*Math.cos(rot)-dy*Math.sin(rot);
        var deltaCompY=dx*Math.sin(rot)+dy*Math.cos(rot);

        layer.anchorPoint.setValue(newAnchor);

        if(layer.position.numKeys>0){
            for(var k=1;k<=layer.position.numKeys;k++){
                var val=layer.position.keyValue(k);
                layer.position.setValueAtKey(k,[val[0]+deltaCompX,val[1]+deltaCompY]);
            }
        } else { var pos=layer.position.value; layer.position.setValue([pos[0]+deltaCompX,pos[1]+deltaCompY]); }
    }
}

app.endUndoGroup();