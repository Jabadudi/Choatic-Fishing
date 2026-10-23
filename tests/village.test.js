import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {gameScale} from '../src/mobile.js';
import {walkable,isWater,transitionAt,drawWilds,drawDepthSorted,paintAtlas,shorePoints,clearTerrainCache} from '../src/wilds.js';
import {VILLAGE,VILLAGE_ROADS,VILLAGE_PLACES,VILLAGE_BUILDINGS,onVillageDeck} from '../src/village.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const fresh=()=>new World(()=>.1,{adventure:true});
test('crossroads west and village east form reversible walking transitions without losing inventory or quests',()=>{
 const w=fresh();w.areaId='crossroads';Object.assign(w.player,{x:4,y:460});w.inventory.receive({name:'Sardine'});w.quests['mara-sardine'].status='active';
 w.move(-12,0,false);assert.equal(w.areaId,'village');assert.deepEqual({x:w.player.x,y:w.player.y},VILLAGE.spawn);assert.ok(walkable(w.player.x,w.player.y,'village'));
 Object.assign(w.player,{x:1916,y:530});w.move(12,0,false);assert.equal(w.areaId,'crossroads');assert.equal(w.player.y,460);assert.ok(walkable(w.player.x,w.player.y,'crossroads'));
 assert.equal(w.inventory.allItems[0].name,'Sardine');assert.equal(w.quests['mara-sardine'].status,'active');
 assert.equal(transitionAt(-1,250,'crossroads'),null);assert.equal(transitionAt(1921,300,'village'),null);
});
test('village lanes are continuous, buildings are solid, and all six landmarks are connected to the entrance',()=>{
 for(const road of VILLAGE_ROADS)for(let i=1;i<road.length;i++)for(let j=0;j<=100;j++){
  const t=j/100,x=road[i-1][0]+(road[i][0]-road[i-1][0])*t,y=road[i-1][1]+(road[i][1]-road[i-1][1])*t;
  assert.ok(walkable(x,y,'village'),`blocked lane: ${x},${y}`);
 }
 for(const b of VILLAGE_BUILDINGS){assert.equal(walkable(b.x,b.y-30,'village'),false);assert.ok(walkable(b.x,b.y+55,'village'));}
 const queue=[[1800,530]],seen=new Set(['1800,530']),reached=new Set();
 for(let at=0;at<queue.length;at++){
  const [x,y]=queue[at];for(const place of VILLAGE_PLACES)if(Math.hypot(x-place.x,y-place.y)<60)reached.add(place.id);
  for(const [dx,dy]of [[20,0],[-20,0],[0,20],[0,-20]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(nx<20||nx>1900||ny<20||ny>1560||seen.has(key)||!walkable(nx,ny,'village'))continue;seen.add(key);queue.push([nx,ny]);}
 }
 assert.equal(reached.size,6);
});
test('river blocks walking, docks permit real casts and shore foam avoids the timber deck',()=>{
 assert.equal(isWater(950,1450,'village'),true);assert.equal(walkable(950,1450,'village'),false);
 const w=fresh();w.areaId='village';Object.assign(w.player,{x:730,y:1300});assert.ok(onVillageDeck(w.player.x,w.player.y));assert.ok(walkable(730,1300,'village'));
 assert.ok(w.cast({x:820,y:1420}));const bobber={...w.bobber};w.move(20,0,true);assert.deepEqual(w.bobber,bobber);
 for(const points of Object.values(shorePoints('village',1,2)))for(const [x,y]of points)assert.equal(onVillageDeck(x,y),false);
});
test('village rendering and map include roofs and distinct architecture without missing palettes',()=>{
 const texts=[],c=new Proxy({fillText(t){texts.push(t);},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const w=fresh();w.areaId='village';Object.assign(w.player,VILLAGE.spawn);const view={left:0,top:0,right:1920,bottom:1600};
 drawWilds(c,w,view);drawDepthSorted(c,w,view,[],()=>{});paintAtlas(c,800,600,w.player,new Set(),'village');
 assert.ok(texts.includes('THE WILLOW HEARTH'));assert.ok(texts.includes('NET & NEEDLE'));assert.ok(texts.includes('Willow Docks'));clearTerrainCache();
});
test('existing saves remain readable and village saves preserve area, discoveries and dropped items',()=>{
 const w=fresh();w.journeyId='village-test';const old=captureSave(w);assert.equal(restoreSave(old).areaId,'landing');
 w.areaId='village';Object.assign(w.player,{x:1000,y:750});w.discovered.add('village-commons');w.inventory.receive({name:'Sardine'});w.backpackAction(w.inventory.allItems[0].id,'drop');
 const restored=restoreSave(captureSave(w));assert.equal(restored.areaId,'village');assert.equal(restored.player.x,1000);assert.equal(restored.player.y,750);assert.ok(restored.discovered.has('village-commons'));assert.equal(restored.drops[0].areaId,'village');
});

test('southern map padding keeps the player above portrait controls along the dock',()=>{
 const width=390,height=844,scale=gameScale(width,height,true);
 for(const y of [1190,1280,1350]){
  const cameraY=Math.max(Math.min(0,height-VILLAGE.height*scale),Math.min(0,height/2-y*scale));
  const screenY=y*scale+cameraY;assert.ok(screenY<height-300);assert.ok(screenY>200);
 }
});
