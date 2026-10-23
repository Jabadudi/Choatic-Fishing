import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {walkable} from '../src/wilds.js';
import {nearbyNpc,updateDialogue,visibleNpcs,drawNpc,drawDialogue} from '../src/npcs.js';
import {explorationHud} from '../src/hud.js';

test('Mara stands on dry reachable shore beside the broken boat, outside combat',()=>{
 const w=new World(()=>0,{adventure:true}),n=w.npcs[0];
 assert.equal(n.name,'Mara');assert.ok(walkable(n.x,n.y,'landing'));
 assert.ok(Math.hypot(n.x-1400,n.y-1884)<100);assert.ok(!w.actors.includes(n));
 assert.equal(nearbyNpc(w),null);assert.equal(new World().npcs.length,0);
});
test('nearby interaction says hello and prioritizes the NPC over nearby landmarks',()=>{
 const w=new World(()=>0,{adventure:true}),n=w.npcs[0];Object.assign(w.player,{x:n.x-35,y:n.y-30});
 const inventory=JSON.stringify(w.inventory),xp=w.progression.xp;
 assert.equal(explorationHud(w,12).prompt,'Talk to Mara');assert.ok(w.inspect());
 assert.match(w.message,/Mara: Hello! Catch me 1 sardine/);assert.match(w.dialogue.text,/Reward: 15 XP/);
 assert.equal(JSON.stringify(w.inventory),inventory);assert.equal(w.progression.xp,xp);
 updateDialogue(w,12.1);assert.equal(w.dialogue,null);assert.ok(w.inspect());
 w.areaId='windchime';updateDialogue(w,.1);assert.equal(w.dialogue,null);assert.equal(nearbyNpc(w),null);assert.equal(visibleNpcs(w).length,0);
});
test('walking away dismisses the bubble and the character and greeting can render',()=>{
 const w=new World(()=>0,{adventure:true}),n=w.npcs[0];Object.assign(w.player,{x:n.x-35,y:n.y});w.inspect();
 const text=[],ctx=new Proxy({fillText(t){text.push(t);}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 drawNpc(ctx,n,1);drawDialogue(ctx,w);assert.ok(text.includes('Mara'));assert.ok(text.some(line=>line.includes('Hello!')));
 w.player.x-=200;updateDialogue(w,.1);assert.equal(w.dialogue,null);
});
