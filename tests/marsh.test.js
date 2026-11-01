import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {walkable,isWater,transitionAt,drawWilds,drawDepthSorted,paintAtlas,shorePoints,clearTerrainCache} from '../src/wilds.js';
import {MARSH,MARSH_BOARDS,MARSH_PLACES,MARSH_OBJECTS,onMarshDeck} from '../src/marsh.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {gameScale} from '../src/mobile.js';
const fresh=()=>new World(()=>.1,{adventure:true});
test('crossroads east and marsh west connect in both directions and preserve the journey',()=>{
 const w=fresh();w.areaId='crossroads';Object.assign(w.player,{x:1596,y:445});w.inventory.receive({name:'Sardine'});w.quests['mara-sardine'].status='active';
 w.move(12,0,false);assert.equal(w.areaId,'marsh');assert.deepEqual({x:w.player.x,y:w.player.y},MARSH.spawn);assert.ok(walkable(w.player.x,w.player.y,'marsh'));
 Object.assign(w.player,{x:4,y:760});w.move(-12,0,false);assert.equal(w.areaId,'crossroads');assert.equal(w.player.x,1490);assert.ok(walkable(w.player.x,w.player.y,'crossroads'));
 assert.equal(w.inventory.allItems[0].name,'Sardine');assert.equal(w.quests['mara-sardine'].status,'active');
 assert.equal(transitionAt(-1,100,'marsh'),null);assert.equal(transitionAt(2101,1000,'marsh'),null);
});
test('all boardwalk centre lines remain continuous and every landmark is reachable from the entrance',()=>{
 for(const board of MARSH_BOARDS)for(let i=1;i<board.points.length;i++)for(let j=0;j<=100;j++){
  const a=board.points[i-1],b=board.points[i],t=j/100,x=a[0]+(b[0]-a[0])*t,y=a[1]+(b[1]-a[1])*t;
  assert.ok(walkable(x,y,'marsh'),`blocked boardwalk ${x},${y}`);
 }
 const queue=[[140,760]],seen=new Set(['140,760']),reached=new Set();
 for(let at=0;at<queue.length;at++){
  const [x,y]=queue[at];for(const place of MARSH_PLACES)if(Math.hypot(x-place.x,y-place.y)<60)reached.add(place.id);
  for(const [dx,dy]of [[20,0],[-20,0],[0,20],[0,-20]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(nx<20||nx>2080||ny<20||ny>2380||seen.has(key)||!walkable(nx,ny,'marsh'))continue;seen.add(key);queue.push([nx,ny]);}
 }
 assert.equal(reached.size,6);
 for(const object of MARSH_OBJECTS)assert.equal(walkable(object.x,object.y,'marsh'),false,object.id);
});
test('deep channels block walking while boardwalks permit fishing and exclude water glints',()=>{
 assert.ok(isWater(1650,1340,'marsh'));assert.ok(onMarshDeck(1650,1340));assert.ok(walkable(1650,1340,'marsh'));
 assert.ok(isWater(1850,1500,'marsh'));assert.equal(walkable(1850,1500,'marsh'),false);
 const w=fresh();w.areaId='marsh';Object.assign(w.player,{x:1650,y:1340});assert.ok(w.cast({x:1850,y:1500}));
 const bobber={...w.bobber};w.move(10,0,true);assert.deepEqual(w.bobber,bobber);
 for(const points of Object.values(shorePoints('marsh',3,2)))for(const [x,y]of points)assert.equal(onMarshDeck(x,y),false);
});
test('wetlands terrain, depth-sorted structures and the area map render with their own palette',()=>{
 const texts=[],c=new Proxy({fillText(t){texts.push(t);},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const w=fresh();w.areaId='marsh';Object.assign(w.player,MARSH.spawn);const view={left:0,top:0,right:2100,bottom:2400};
 drawWilds(c,w,view);drawDepthSorted(c,w,view,[],()=>{});paintAtlas(c,800,600,w.player,new Set(),'marsh');
 assert.ok(texts.includes('Shellback Glade'));assert.ok(texts.includes('The Sunken Steps'));clearTerrainCache();
});
test('marsh saves preserve the area, discoveries and drops without breaking older saves',()=>{
 const w=fresh();w.journeyId='marsh-test';assert.equal(restoreSave(captureSave(w)).areaId,'landing');
 w.areaId='marsh';Object.assign(w.player,{x:1650,y:1310});w.discovered.add('marsh-fishing');w.inventory.receive({name:'Sardine'});assert.ok(w.backpackAction(w.inventory.allItems[0].id,'drop'));
 const restored=restoreSave(captureSave(w));assert.equal(restored.areaId,'marsh');assert.equal(restored.player.x,1650);assert.ok(restored.discovered.has('marsh-fishing'));assert.equal(restored.drops[0].areaId,'marsh');
});
test('portrait camera leaves enough water margin to keep fishing landings above the touch controls',()=>{
 const height=844,scale=gameScale(390,height,true);
 for(const y of [1340,1430,1640]){const cameraY=Math.max(Math.min(0,height-MARSH.height*scale),Math.min(0,height/2-y*scale));assert.ok(y*scale+cameraY<height-300);}
});
