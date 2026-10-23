import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {walkable,isWater,transitionAt,placesFor,paintAtlas,drawWilds,clearTerrainCache} from '../src/wilds.js';
import {CROSSROADS_ROADS,CROSSROADS_PLACES} from '../src/crossroads.js';

test('Windchime north opens into the crossroads and south returns with equipment and discoveries',()=>{
 const w=new World(()=>.1,{adventure:true});w.areaId='windchime';
 w.inventory.receive({name:'Reed Spear'});w.inventory.assignHotbar(w.inventory.allItems.at(-1).id,2);w.discovered.add('landing');
 Object.assign(w.player,{x:600,y:4});w.move(0,-12,false);
 assert.equal(w.areaId,'crossroads');assert.equal(w.player.x,800);assert.equal(w.player.y,1130);
 assert.ok(walkable(w.player.x,w.player.y,w.areaId));assert.match(w.message,/West.*East/);
 Object.assign(w.player,{x:800,y:1276});w.move(0,12,false);
 assert.equal(w.areaId,'windchime');assert.equal(w.player.y,130);
 assert.equal(w.inventory.item.name,'Reed Spear');assert.ok(w.discovered.has('landing'));
 for(let y=0;y<=320;y+=4)assert.ok(walkable(600,y,'windchime'));
});

test('every crossroads walking route is continuous and its six landmarks can be approached',()=>{
 for(const road of CROSSROADS_ROADS)for(let i=1;i<road.length;i++)for(let step=0;step<=100;step++){
  const t=step/100,x=road[i-1][0]+(road[i][0]-road[i-1][0])*t,y=road[i-1][1]+(road[i][1]-road[i-1][1])*t;
  assert.ok(walkable(x,y,'crossroads'),`blocked trail at ${x},${y}`);
 }
 assert.equal(placesFor('crossroads').length,6);
 const w=new World(()=>0,{adventure:true});w.areaId='crossroads';
 for(const p of CROSSROADS_PLACES){
  const offsets=[[0,50],[0,75],[50,0],[-50,0]],spot=offsets.find(([dx,dy])=>walkable(p.x+dx,p.y+dy,'crossroads'));
  assert.ok(spot,`cannot approach ${p.name}`);Object.assign(w.player,{x:p.x+spot[0],y:p.y+spot[1]});
  assert.equal(w.inspect(),true);assert.ok(w.discovered.has(p.id));
 }
});

test('marsh water blocks walking, the boardwalk is safe, and the pool accepts real casts',()=>{
 assert.ok(isWater(1570,1020,'crossroads'));assert.equal(walkable(1570,1020,'crossroads'),false);
 assert.ok(walkable(1465,660,'crossroads'));assert.equal(walkable(1500,660,'crossroads'),true);
 assert.equal(walkable(120,460,'crossroads'),true);
 assert.equal(transitionAt(-1,460,'crossroads').areaId,'village');assert.equal(transitionAt(1601,660,'crossroads').areaId,'marsh');
 const w=new World(()=>0,{adventure:true});w.areaId='crossroads';Object.assign(w.player,{x:1350,y:930});
 assert.ok(walkable(1350,930,'crossroads'));assert.ok(w.cast({x:1480,y:1000}));
 const bobber={...w.bobber};w.move(10,0,true);assert.deepEqual(w.bobber,bobber);
});

test('crossroads terrain and area map render without missing palettes or methods',()=>{
 const texts=[],c=new Proxy({fillText(t){texts.push(t);},createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 const w=new World(()=>0,{adventure:true});w.areaId='crossroads';
 drawWilds(c,w,{left:0,top:0,right:1600,bottom:1280});
 paintAtlas(c,800,600,w.player,new Set(),'crossroads');
 assert.ok(texts.some(t=>t.includes('WILLOWBACK')));assert.ok(texts.some(t=>t.includes('SHELLBACK MARSH')));
 clearTerrainCache();
});
