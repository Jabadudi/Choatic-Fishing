// Geometry coverage is independent of image readiness. Keep compact horizontal
// runs so late textures can repaint without resampling every two-pixel cell.
export class TerrainCoverageCache{
 constructor(limit=64){this.limit=limit;this.entries=new Map();}
 clear(){this.entries.clear();}
 get(key,left,top,width,height,cell,sample){
  let result=this.entries.get(key);
  if(result){this.entries.delete(key);this.entries.set(key,result);return result;}
  const materials=new Map();
  for(let y=top;y<top+height;y+=cell){
   let previous=null,start=left;
   const flush=x=>{if(previous!==null){let runs=materials.get(previous);if(!runs){runs=[];materials.set(previous,runs);}runs.push(start-left,y-top,x-start,cell);}};
   for(let x=left;x<left+width;x+=cell){const material=sample(x,y);if(material!==previous){flush(x);previous=material;start=x;}}
   flush(left+width);
  }
  this.entries.set(key,materials);
  if(this.entries.size>this.limit)this.entries.delete(this.entries.keys().next().value);
  return materials;
 }
}
