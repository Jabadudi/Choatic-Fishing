import test from 'node:test';
import assert from 'node:assert/strict';
import {DELTA,DELTA_DEFS} from '../src/delta-areas.js';
import {validateElevation} from '../src/elevation.js';
import {World} from '../src/world.js';
import {heightAt,walkable,layeredArea} from '../src/wilds.js';

// Glasswater is the first layered-world area: a forest rise north of the pool, stairs down to the shore.
const ID='glasswater',b=DELTA[ID],point=([x,y])=>{const [wx,wy]=b.toWorld([x,y]);return {x:wx,y:wy};};
function world(at){const w=new World(()=>.4,{adventure:true});w.areaId=ID;w.journeyId='layered-test';w.wildlife=[];w.rabbits=[];w.spawns=null;w.npcs=[];Object.assign(w.player,point(at));return w;}
function follow(w,at){const goal=point(at);for(let i=0;i<2000&&Math.hypot(w.player.x-goal.x,w.player.y-goal.y)>1;i++){const dx=goal.x-w.player.x,dy=goal.y-w.player.y,l=Math.hypot(dx,dy);w.moveActor(w.player,dx/l*Math.min(4,l),dy/l*Math.min(4,l),false);}assert.ok(Math.hypot(w.player.x-goal.x,w.player.y-goal.y)<3,`route reaches ${at}`);}

test('glasswater elevation is valid and uses the layered painter; the quarry keeps its own art',()=>{
 const def=DELTA_DEFS.find(d=>d.id===ID);assert.deepEqual(validateElevation(def.elevation),def.elevation);
 assert.equal(layeredArea(ID),true);assert.equal(layeredArea('abandoned-quarry'),false);assert.equal(layeredArea('landing'),true,'1.1 has its north cliff');assert.equal(layeredArea('chimewood'),false);
});

test('the forest rise is one level above the pool shore',()=>{
 assert.equal(heightAt(...Object.values(point([120,150])),ID),96);
 assert.equal(heightAt(...Object.values(point([40,190])),ID),0);
 assert.equal(heightAt(...Object.values(point([140,210])),ID),0);
});

test('stairs join the rise and the shore both ways, and the cliff cannot be walked down',()=>{
 const w=world([97,150]);
 for(const r of DELTA_DEFS.find(d=>d.id===ID).elevation.ramps){Object.assign(w.player,point(r.from));follow(w,r.to);assert.ok(heightAt(w.player.x,w.player.y,ID)<2,`${r.id} reaches the shore`);follow(w,r.from);assert.ok(heightAt(w.player.x,w.player.y,ID)>94,`${r.id} climbs back up`);}
 Object.assign(w.player,point([40,160]));const start=w.player.y;for(let i=0;i<40;i++)w.moveActor(w.player,0,8,false);
 assert.ok(w.player.y>start+60&&w.player.y<b.toWorld([40,167])[1],'the walk stops at the north cliff edge');assert.equal(heightAt(w.player.x,w.player.y,ID),96);
});

test('both exits stay reachable: Upper Falls trail to the Western Falls trail through the north stairs',()=>{
 const w=world([92,159]);for(const at of [[99,160],[105,162],[109,175],[111,182],[110,196],[104,199],[90,205],[70,207],[58,212]])follow(w,at);
 assert.ok(walkable(w.player.x,w.player.y,ID));assert.equal(heightAt(w.player.x,w.player.y,ID),0);
});

test('glasswater water follows the dual-grid water tiles: wet where the water corners weigh more than half',async()=>{
 const {GROUND_CELL:C}=await import('../src/dual-grid.js');let checked=0;
 for(let x=10;x<b.area.width;x+=37)for(let y=10;y<b.area.height;y+=29){
  const i=Math.floor(x/C),j=Math.floor(y/C),u=x/C-i,v=y/C-j,w=(a,c)=>b.water(a*C,c*C)<0;
  const wet=w(i,j)*(1-u)*(1-v)+w(i+1,j)*u*(1-v)+w(i,j+1)*(1-u)*v+w(i+1,j+1)*u*v;
  if(Math.abs(wet-.5)<.02)continue;assert.equal(b.water(x,y)<0,wet>.5,`water at ${x},${y}`);checked++;
 }
 assert.ok(checked>1000);
});
