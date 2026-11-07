// Dual-grid tilesets: one 4 x 4 sheet of 15 pieces (plus an empty cell) draws any terrain edge with clean corners.
// Terrain is sampled at the corners of a lattice; each drawn tile looks at its four corners (bits: 1 top-left,
// 2 top-right, 4 bottom-left, 8 bottom-right) and picks the matching sheet cell. The sheet layout is SpriteCook's:
// the cell for mask m is FRAME_BY_MASK[m], counted left to right, top to bottom. See docs/DUAL-GRID.md.
// Artwork only: gameplay never reads these tiles.
import {textureAsset,onTexturePackChange} from './texture-packs.js';

export const FRAME_BY_MASK=Object.freeze([12,15,8,9,0,11,14,7,13,4,1,10,3,2,5,6]);
export const maskAt=(tl,tr,bl,br)=>(tl?1:0)|(tr?2:0)|(bl?4:0)|(br?8:0);
export function frameCell(mask){const frame=FRAME_BY_MASK[mask];return {column:frame%4,row:Math.floor(frame/4)};}

// The dual-grid sheets the game knows, by name. Files live in assets/ground/dual/ and texture packs may replace them.
export const DUAL_GRID_SHEETS=Object.freeze({plateauTop:'plateau-top',cliffWall:'cliff-wall',sand:'sand',dirtPath:'dirt-path',water:'water',forestFloor:'forest-floor',meadowGrass:'meadow-grass',deepWater:'deep-water'});
// Areas whose ground is built from dual-grid layers: a base texture, then each sheet over it in order. Water there
// also walks on the same lattice (atlas-area.js), so the shoreline Eli stops at is the one on screen.
export const GROUND_CELL=48;
// base is a dual-grid sheet whose fully filled cell repeats under everything.
export const DUAL_GROUND=Object.freeze({glasswater:{base:'meadowGrass',layers:['sand','dirtPath','water','deepWater']}});
const sheets=new Map(),listeners=new Set();
onTexturePackChange(()=>{sheets.clear();listeners.forEach(fn=>fn());});
export function dualGridSheet(kind,invalidate=()=>{}){
 const name=DUAL_GRID_SHEETS[kind];if(!name||typeof Image==='undefined')return null;
 listeners.add(invalidate);
 let entry=sheets.get(name);
 if(!entry){entry={image:new Image(),ready:false};sheets.set(name,entry);entry.image.onload=()=>{entry.ready=true;invalidate();};entry.image.src=textureAsset(`ground/dual/${name}.png`,new URL(`../assets/ground/dual/${name}.png`,import.meta.url).href);}
 return entry.ready?entry.image:null;
}

// Draws the tiles covering [left, top, width, height] (lattice space; dy shifts the drawing). inside(x, y) says
// whether a lattice corner is terrain. skipFull leaves fully surrounded tiles undrawn (the ground shows there).
export function drawDualGrid(c,image,inside,{left,top,width,height,cell,dy=0,skipFull=false}){
 const cw=image.width/4,ch=image.height/4;
 const i0=Math.floor(left/cell),i1=Math.ceil((left+width)/cell),j0=Math.floor(top/cell),j1=Math.ceil((top+height)/cell);
 const corner=new Map(),at=(i,j)=>{const k=i*4099+j;let v=corner.get(k);if(v===undefined){v=!!inside(i*cell,j*cell);corner.set(k,v);}return v;};
 for(let j=j0;j<j1;j++)for(let i=i0;i<i1;i++){
  const mask=maskAt(at(i,j),at(i+1,j),at(i,j+1),at(i+1,j+1));
  if(!mask||skipFull&&mask===15)continue;
  const {column,row}=frameCell(mask);
  c.drawImage(image,column*cw,row*ch,cw,ch,i*cell,j*cell+dy,cell,cell);
 }
}

// The fully filled cell of a sheet as a repeating pattern, one cell per lattice step.
const fills=new WeakMap();
export function fullCellPattern(ctx,image,cell){
 let byCell=fills.get(image);if(!byCell){byCell=new Map();fills.set(image,byCell);}
 let tile=byCell.get(cell);
 if(!tile){tile=document.createElement('canvas');tile.width=tile.height=cell;const t=tile.getContext('2d');t.imageSmoothingEnabled=true;const {column,row}=frameCell(15),cw=image.width/4,ch=image.height/4;t.drawImage(image,column*cw,row*ch,cw,ch,0,0,cell,cell);byCell.set(cell,tile);}
 return ctx.createPattern(tile,'repeat');
}
