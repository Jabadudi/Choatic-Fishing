import test from 'node:test';
import assert from 'node:assert/strict';
import {compileElevation} from '../src/elevation.js';
import {QUARRY_DEF,QUARRY_ROUTE,quarryPoint as Q} from '../src/quarry-elevation.js';
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
function follow(w,at){const goal=point(at);for(let i=0;i<1000&&Math.hypot(w.player.x-goal.x,w.player.y-goal.y)>1;i++){const dx=goal.x-w.player.x,dy=goal.y-w.player.y,l=Math.hypot(dx,dy);w.moveActor(w.player,dx/l*Math.min(4,l),dy/l*Math.min(4,l),false);}w.moveActor(w.player,goal.x-w.player.x,goal.y-w.player.y,false);assert.ok(Math.hypot(w.player.x-goal.x,w.player.y-goal.y)<2,`route reaches ${at}`);}
test('quarry has actual height bands and continuous cart ramp heights',()=>{
 for(const [at,z]of [[Q([400,100],0),0],[Q([700,350],-2),-192],[Q([1030,700],-4),-384],[Q([740,680],-5),-480]]){const p=point(at);assert.equal(heightAt(p.x,p.y,ID),z);}
 for(const ramp of b.elevation.ramps){let z=ramp.fromHeight*96;for(let i=0;i<=100;i++){const t=i/100,next=b.elevation.heightAt(ramp.from[0]+(ramp.to[0]-ramp.from[0])*t,ramp.from[1]+(ramp.to[1]-ramp.from[1])*t);assert.ok(Math.abs(next-z)<=Math.abs(ramp.toHeight-ramp.fromHeight)*.96+.01);z=next;}assert.equal(z,ramp.toHeight*96);}
});
test('player traverses both ramps in both directions and cannot dash through a cliff',()=>{
 const w=world(Q([105,720],0));
 for(const r of QUARRY_DEF.elevation.ramps){Object.assign(w.player,point(r.from));follow(w,r.to);follow(w,r.from);}
 Object.assign(w.player,point(Q([500,125],0)));const start=w.player.y;w.moveActor(w.player,0,300,false);assert.ok(w.player.y-start<45,'swept movement stops at the tall upper face');assert.equal(heightAt(w.player.x,w.player.y,ID),0);
});
test('east stairs connect the work terrace to the lower floor',()=>{const r=QUARRY_ROUTE.stairs,w=world(r.from);follow(w,r.to);assert.equal(heightAt(w.player.x,w.player.y,ID),-384);follow(w,r.from);assert.equal(heightAt(w.player.x,w.player.y,ID),-192);});
test('animal movement, melee and projectiles cannot cross a cliff',()=>{
 const w=world(Q([500,136],0));const animal={...animalTraits('deer'),...point(Q([500,145],0)),id:'quarry-deer',entityType:'animal',areaId:ID,health:100,maxHealth:100,state:'idle'};w.wildlife=[animal];
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
 const w=world(Q([600,370],-2));assert.ok(walkable(w.player.x,w.player.y,ID));const save=captureSave(w);assert.equal(save.state.player.elevation,undefined);
 const restored=restoreSave(save);assert.equal(restored.areaId,ID);assert.equal(heightAt(restored.player.x,restored.player.y,ID),-192);
});

test('the complete descent, floor circuit and crane approach stay navigable',()=>{
 const w=world(QUARRY_ROUTE.upperIn.from);
 const descent=QUARRY_DEF.roads[3];for(const at of descent)follow(w,at);
 for(const at of QUARRY_DEF.roads[4].slice(0,-1))follow(w,at);
 for(const at of [Q([1190,620],-4),QUARRY_ROUTE.stairs.to,QUARRY_ROUTE.stairs.from,Q([1140,330],-2),Q([950,330],-2),Q([700,330],-2),Q([700,390],-2),Q([765,406],-2)])follow(w,at);
 const def=DELTA_DEFS.find(d=>d.id===ID);assert.deepEqual(cleanLand(def,def).props,def.props);
 const base=point(Q([746,370],-2));assert.equal(walkable(base.x,base.y,ID),false,'visible mast footing owns collision');
});
test('the timber pier is an elevated walkable deck connected to the floor',()=>{
 const pier=QUARRY_DEF.walks[0],w=world(pier.pts[0]);for(const at of pier.pts)follow(w,at);
 assert.ok(walkable(w.player.x,w.player.y,ID));assert.equal(heightAt(w.player.x,w.player.y,ID),-384);assert.ok(b.deck(w.player.x,w.player.y));
});

test('reconstruction keeps legacy area bounds and relocates saves blocked by new terrain',()=>{
 assert.deepEqual(QUARRY_DEF.size,[2400,1880]);const w=world(Q([600,370],-2)),save=captureSave(w),blocked=point(Q([740,680],-5));
 Object.assign(save.state.player,blocked);const restored=restoreSave(save);assert.ok(walkable(restored.player.x,restored.player.y,ID));assert.notEqual(restored.player.x,blocked.x);
});
