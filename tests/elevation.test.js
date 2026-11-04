import test from 'node:test';
import assert from 'node:assert/strict';
import {compileElevation} from '../src/elevation.js';
import {DELTA,DELTA_DEFS} from '../src/delta-areas.js';
import {World} from '../src/world.js';
import {heightAt,canReach,walkable} from '../src/wilds.js';
import {damage,attack,updateProjectiles} from '../src/combat.js';
import {moveAnimal} from '../src/wildlife.js';
import {animalTraits} from '../src/entities.js';
import {cleanLand} from '../scripts/land-editor.mjs';
import {captureSave,restoreSave} from '../src/save-format.js';
const ID='abandoned-quarry',b=DELTA[ID],point=a=>{const [x,y]=b.toWorld(a);return {x,y};};
function world(at){const w=new World(()=>.4,{adventure:true});w.areaId=ID;w.journeyId='elevation-test';w.wildlife=[];w.rabbits=[];w.spawns=null;Object.assign(w.player,point(at));return w;}
function follow(w,at){const goal=point(at);for(let i=0;i<1000&&Math.hypot(w.player.x-goal.x,w.player.y-goal.y)>1;i++){const dx=goal.x-w.player.x,dy=goal.y-w.player.y,l=Math.hypot(dx,dy);w.moveActor(w.player,dx/l*Math.min(4,l),dy/l*Math.min(4,l),false);}assert.ok(Math.hypot(w.player.x-goal.x,w.player.y-goal.y)<2,`route reaches ${at}`);}
test('quarry has actual height bands and continuous cart ramp heights',()=>{
 for(const [at,z]of [[[612,122],0],[[629,122],-96],[[644,143],-192],[[665,148],-288]]){const p=point(at);assert.equal(heightAt(p.x,p.y,ID),z);}
 for(const ramp of b.elevation.ramps){let z=ramp.fromHeight*96;for(let i=0;i<=100;i++){const t=i/100,next=b.elevation.heightAt(ramp.from[0]+(ramp.to[0]-ramp.from[0])*t,ramp.from[1]+(ramp.to[1]-ramp.from[1])*t);assert.ok(Math.abs(next-z)<=1.01);z=next;}assert.equal(z,ramp.toHeight*96);}
});
test('player traverses both ramps in both directions and cannot dash through a cliff',()=>{
 const w=world([612,154]);for(const at of [[612,122],[629,122],[628,143],[644,143],[628,143],[629,122],[612,122],[612,154]])follow(w,at);
 Object.assign(w.player,point([650,110]));const start=w.player.y;w.moveActor(w.player,0,160,false);assert.ok(w.player.y-start<40,'swept movement stops at upper cliff');assert.equal(heightAt(w.player.x,w.player.y,ID),0);
});
test('east stairs connect the work terrace to the lower floor',()=>{const w=world([690,126]);follow(w,[690,142]);assert.equal(heightAt(w.player.x,w.player.y,ID),-192);follow(w,[690,126]);assert.equal(heightAt(w.player.x,w.player.y,ID),-96);});
test('animal movement, melee and projectiles cannot cross a cliff',()=>{
 const w=world([650,111]);const animal={...animalTraits('deer'),...point([650,113]),id:'quarry-deer',entityType:'animal',areaId:ID,health:100,maxHealth:100,state:'idle'};w.wildlife=[animal];
 assert.equal(canReach(w.player,animal,ID),false);assert.equal(damage(w,animal,20,w.player,0),false);assert.equal(animal.health,100);
 const before=animal.y;moveAnimal(animal,0,-100);assert.ok(animal.y>before-40);
 w.player.angle=Math.PI/2;attack(w,w.player,{name:'Harpoon Gun'});updateProjectiles(w,.3);assert.equal(w.projectiles.length,0);assert.equal(animal.health,100);
});
test('elevation export is lossless and rejects malformed ramps rather than dropping collision',()=>{
 const def=DELTA_DEFS.find(d=>d.id===ID);assert.deepEqual(cleanLand(def,def).elevation,def.elevation);
 assert.throws(()=>cleanLand({...def,elevation:{...def.elevation,ramps:[{...def.elevation.ramps[0],toHeight:-4}]}},def),/elevation ramp/);
 assert.throws(()=>cleanLand({...def,elevation:{...def.elevation,terraces:[{id:'bad',height:NaN,points:[[1,2],[2,3],[3,2]]}]}},def),/elevation terrace/);
});
test('old flat maps remain flat and saved positions derive height without a new save field',()=>{
 assert.equal(compileElevation(null),null);assert.equal(heightAt(300,300,'landing'),0);
 const w=world([631,129]);assert.ok(walkable(w.player.x,w.player.y,ID));const save=captureSave(w);assert.equal(save.state.player.elevation,undefined);
 const restored=restoreSave(save);assert.equal(restored.areaId,ID);assert.equal(heightAt(restored.player.x,restored.player.y,ID),-96);
});
