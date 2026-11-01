// Area maps painted from the game's own art: the same ground, water, trees, buildings and props Eli walks through,
// shrunk onto one canvas per area. Painting a whole area takes about half a second, so it is done a few tiles at a
// time while the browser is idle; until a tile is done, the blocky colour map shows there. Drawing only.
import {areaFor,drawWilds,drawDepthSorted,paintAtlasGround,onTerrainStale} from './wilds.js';

const MAX_SIDE=1600,MAX_SCALE=.35,TILE=256,KEEP=4;
// id → {canvas, scale, todo: tiles left to paint, story}
const maps=new Map();
let busy=false;
const idle=typeof window==='undefined'?null:window.requestIdleCallback?fn=>window.requestIdleCallback(fn,{timeout:300}):fn=>setTimeout(fn,30);

// Late images (grass, props) mean the art painted so far is missing pieces: start again.
onTerrainStale(()=>{for(const m of maps.values())m.todo=tilesFor(m.area);schedule();});

function tilesFor(area){const out=[];for(let y=0;y<area.height;y+=TILE)for(let x=0;x<area.width;x+=TILE)out.push([x,y]);return out;}

// The map for an area: {canvas, scale}, the canvas at scale pixels per world unit. Painting carries on in the background.
// story: the journey's story state, for the few props that follow it (the cabin, the training yard).
export function areaMap(id,story=null){
 const area=areaFor(id);let m=maps.get(area.id);
 if(m){maps.delete(area.id);maps.set(area.id,m);}
 else{
  const scale=Math.min(MAX_SCALE,MAX_SIDE/Math.max(area.width,area.height)),canvas=document.createElement('canvas');
  canvas.width=Math.round(area.width*scale);canvas.height=Math.round(area.height*scale);
  paintAtlasGround(canvas.getContext('2d'),canvas.width,canvas.height,area.id);
  // The guest lodge's room changes with the time of day, so it keeps the plain map.
  m={area,canvas,scale,todo:area.id==='guest-lodge'?[]:tilesFor(area),story};maps.set(area.id,m);
  if(maps.size>KEEP)maps.delete(maps.keys().next().value);
 }
 // The cabin, camp and training yard follow the story: a new stage repaints the area, keeping the old picture meanwhile.
 if(area.id!=='guest-lodge'&&(story?.stage??null)!==(m.story?.stage??null))m.todo=tilesFor(area);
 m.story=story;schedule();
 return m;
}
export const areaMapReady=id=>!maps.get(areaFor(id).id)?.todo.length;

function schedule(){
 if(busy||!idle)return;
 // Most recently asked-for area first: that is the one on screen.
 const m=[...maps.values()].reverse().find(m=>m.todo.length);if(!m)return;
 busy=true;idle(()=>{busy=false;paintTile(m);schedule();});
}
// Each tile is painted at full size on a scratch canvas, then shrunk onto the map in one smooth step; painting the
// small cells straight at map scale leaves a faint grid where their edges blend.
let scratch=null;
function paintTile(m){
 const tile=m.todo.shift();if(!tile||!maps.has(m.area.id))return;
 const PAD=8,[x,y]=tile,w=Math.min(TILE,m.area.width-x),h=Math.min(TILE,m.area.height-y);
 scratch??=document.createElement('canvas');scratch.width=TILE+2*PAD;scratch.height=TILE+2*PAD;
 const s=scratch.getContext('2d');s.setTransform(1,0,0,1,PAD-x,PAD-y);
 // A player far off the map, so no canopy fades and nothing counts as near him.
 const world={areaId:m.area.id,story:m.story,elapsed:0,player:{x:-1e5,y:-1e5},npcs:[]};
 drawWilds(s,world,{left:x-PAD,top:y-PAD,right:x+w+PAD,bottom:y+h+PAD},{still:true});
 // Trees and buildings standing just outside the tile still reach into it.
 drawDepthSorted(s,world,{left:x-200,top:y-60,right:x+w+200,bottom:y+h+260},[],()=>{},{still:true});
 // The padding overlaps the neighbouring tiles by a pixel or so, so no seam shows where they meet.
 const c=m.canvas.getContext('2d'),k=m.scale,o=Math.min(PAD,2/k);c.imageSmoothingEnabled=true;c.imageSmoothingQuality='high';
 c.drawImage(scratch,PAD-o,PAD-o,w+2*o,h+2*o,(x-o)*k,(y-o)*k,(w+2*o)*k,(h+2*o)*k);
}

