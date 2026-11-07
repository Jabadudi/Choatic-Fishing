import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {walkable,isWater,transitionAt,placesFor,paintAtlas,drawWilds,clearTerrainCache} from '../src/wilds.js';
import {CROSSROADS_ROADS,CROSSROADS_PLACES} from '../src/crossroads.js';

test('1.2 Windchime Path opens east into the crossroads and the crossroads returns south with equipment and discoveries',()=>{
 const w=new World(()=>.1,{adventure:true});w.areaId='windchime';
 w.inventory.receive({name:'Reed Spear'});w.inventory.assignHotbar(w.inventory.allItems.at(-1).id,2);w.discovered.add('landing');
 Object.assign(w.player,{x:3596,y:600});w.move(12,0,false);
 assert.equal(w.areaId,'crossroads');assert.equal(w.player.x,800);assert.equal(w.player.y,1130);
 assert.ok(walkable(w.player.x,w.player.y,w.areaId));assert.match(w.message,/West.*East/);
 Object.assign(w.player,{x:800,y:1276});w.move(0,12,false);
 assert.equal(w.areaId,'windchime');assert.deepEqual({x:w.player.x,y:w.player.y},{x:3540,y:600});
 assert.equal(w.inventory.item.name,'Reed Spear');assert.ok(w.discovered.has('landing'));
 // A field map runs west to east: the trail crosses the whole band, from 1.1 in the west to the crossroads in the east.
 for(let x=40;x<3580;x+=20)assert.ok([560,580,600,620,640].some(y=>walkable(x,y,'windchime')),`trail at ${x}`);
 assert.equal(transitionAt(-4,600,'windchime').areaId,'landing');assert.equal(transitionAt(3604,600,'windchime').areaId,'crossroads');
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

test('the river blocks walking, the boardwalk crosses it, and the jetty accepts real casts',()=>{
 assert.ok(isWater(1500,1000,'crossroads'));assert.equal(walkable(1500,1000,'crossroads'),false);
 assert.ok(isWater(1000,800,'crossroads'));assert.equal(walkable(1000,800,'crossroads'),false);
 for(let i=0;i<=40;i++){const t=i/40,x=724+(1580-724)*t,y=802+(446-802)*t;assert.ok(walkable(x,y,'crossroads'),`boardwalk ${x},${y}`);}
 assert.equal(walkable(120,460,'crossroads'),true);
 assert.equal(transitionAt(-1,460,'crossroads').areaId,'village-farm');assert.equal(transitionAt(1601,445,'crossroads').areaId,'marsh');
 const w=new World(()=>0,{adventure:true});w.areaId='crossroads';Object.assign(w.player,{x:1124,y:1000});
 assert.ok(walkable(1124,1000,'crossroads'));assert.ok(w.cast({x:1124,y:860}));
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
