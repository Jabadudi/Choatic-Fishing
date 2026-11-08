import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {AREAS} from '../src/wilds.js';
import {FIELD_MAPS} from '../src/field-maps.js';
import {fieldProgress} from '../src/field-play.js';
import {REGION_START,REGION_MAPS,GATE_REACH} from '../src/region-play.js';
import {damageAnimal} from '../src/wildlife.js';
import {captureSave,restoreSave,requireGame} from '../src/save-format.js';
import {STARTER_SWORD} from '../src/warrior.js';
import {CAMP,DUNGEON,DUNGEONS,startRun,nearPortal,portalOf,backToCamp,restoreDungeon} from '../src/dungeon.js';
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
const fresh=()=>{const w=new World(()=>.3,{adventure:true,regions:true});w.journeyId='regions-test';return w;};
// Most tests play inside a dungeon run, entered through the camp portal.
const regions=()=>{const w=fresh();startRun(w);return w;};
const slimes=w=>w.wildlife.filter(a=>a.areaId===REGION_START&&a.health>0);
const kill=(w,a)=>{Object.assign(w.player,{x:a.x-40,y:a.y});a.downRemaining=1;for(let i=0;i<200&&a.health>0;i++){w.player.health=w.progression.maxHealth;damageAnimal(w,a,1000,w.player,0);}assert.equal(a.health,0);};

test('a Regions game starts in Wilds Camp by the portal; ENTER puts Eli on 1.1 Dewdrop Meadow, no story, sword in hand',()=>{
 const c=fresh();assert.equal(c.areaId,CAMP);assert.equal(c.dungeon.run,null);assert.equal(nearPortal(c),null);
 const q=portalOf();Object.assign(c.player,{x:q.x,y:q.y+60});assert.equal(nearPortal(c),DUNGEON.id);
 const w=regions(),a=AREAS[REGION_START];
 assert.equal(w.areaId,REGION_START);assert.equal(w.story,null);assert.equal(w.regions,true);assert.ok(w.dungeon.run);
 assert.deepEqual([w.npcs.length,w.rabbits.length,w.spawns],[0,0,null]);
 assert.equal(w.player.name,'Eli');assert.equal(w.inventory.item?.name,STARTER_SWORD);
 // A third of the old Landing's height, run west to east.
 assert.deepEqual([a.width,a.height],[4000,740]);assert.ok(w.player.x<300);
});

test('slimes stand in bunches of three or four, and their count is the kill goal',()=>{
 const w=regions(),f=FIELD_MAPS[REGION_START],all=slimes(w);
 assert.ok(all.every(s=>s.species==='slime'&&s.behavior==='aggressive'));
 assert.equal(all.length,f.clear.kills);assert.equal(fieldProgress(w).goal,all.length);
 const bunches=Object.values(Object.groupBy(all,s=>s.packId));
 assert.equal(bunches.length,f.bunches.length);
 for(const b of bunches){assert.ok(b.length>=3&&b.length<=4,`${b[0].packId}: ${b.length}`);const cx=b.reduce((n,s)=>n+s.x,0)/b.length,cy=b.reduce((n,s)=>n+s.y,0)/b.length;assert.ok(b.every(s=>Math.hypot(s.x-cx,s.y-cy)<120),'bunched up');}
 // Levels rise west to east inside the map's band.
 assert.ok(all.every(s=>s.level>=1&&s.level<=2));assert.ok(all.some(s=>s.level===2));
 // Hitting one brings its whole bunch.
 const one=all[0],rest=all.filter(s=>s.packId===one.packId&&s!==one);Object.assign(w.player,{x:one.x-40,y:one.y});damageAnimal(w,one,1,w.player,0);
 for(const s of rest)assert.ok(s.alert>0&&s.threat,'the bunch is roused');
});

test('the gate east stays sealed until every slime is down; clearing pays once and stays cleared for the run',()=>{
 const w=regions(),a=AREAS[REGION_START];
 Object.assign(w.player,{x:a.width-GATE_REACH+20,y:380});w.update(1/60,idle(w));assert.match(w.message,/gate is sealed\. \d+ slimes/);
 const all=slimes(w),stones=w.well.stones;
 for(const s of all.slice(0,-1))kill(w,s);
 assert.ok(!w.fieldClear);assert.equal(fieldProgress(w).kills,all.length-1);
 kill(w,all.at(-1));
 assert.ok(w.fieldClear);assert.equal(w.fieldClear.code,'1.1');assert.equal(w.fieldClear.first,true);assert.equal(w.well.stones,stones+1);
 assert.equal(fieldProgress(w).kills,all.length,'the count stays full');assert.equal(fieldProgress(w).clears,1);
 Object.assign(w.player,{x:2000,y:380});w.update(1/60,idle(w));Object.assign(w.player,{x:a.width-GATE_REACH+20,y:380});w.update(1/60,idle(w));
 assert.match(w.message,/gate stands open/);
});

test('a Regions save keeps the slimes that are down, and the Regions page refuses other journeys',()=>{
 const w=regions(),all=slimes(w);kill(w,all[0]);kill(w,all[5]);
 const save=captureSave(w);assert.equal(save.state.regions,true);
 const r=restoreSave(save);
 assert.equal(r.regions,true);assert.equal(r.story,null);assert.equal(slimes(r).length,all.length-2);
 assert.ok(!slimes(r).some(s=>s.id===all[0].id||s.id===all[5].id));assert.equal(fieldProgress(r).kills,2);
 const bad=structuredClone(save);bad.state.fieldMaps[REGION_START].defeated.push('dewdrop-meadow:99-1');assert.throws(()=>restoreSave(bad),/field map/);
 const old=new World(()=>.3,{adventure:true,story:true});old.journeyId='old';const story=captureSave(old);
 try{requireGame('regions');assert.throws(()=>restoreSave(story),/earlier test build/);assert.ok(restoreSave(save).regions);}finally{requireGame(null);}
});

test('1.1 opens east into 1.2 Mossroot Trail once cleared; its stumplings are its own kill goal',()=>{
 const w=regions(),a=AREAS[REGION_START],next='mossroot-trail',f=FIELD_MAPS[next];
 assert.deepEqual(REGION_MAPS.slice(0,3),[REGION_START,next,'saltspray-shore']);assert.equal(REGION_MAPS.length,11);assert.equal(REGION_MAPS.at(-1),'mossback-ruins');
 // Shut while slimes are left: Eli stays in 1.1 at the edge.
 Object.assign(w.player,{x:a.width-10,y:380});w.moveActor(w.player,40,0);
 assert.equal(w.areaId,REGION_START);assert.match(w.message,/gate is sealed/);
 for(const s of slimes(w))kill(w,s);
 Object.assign(w.player,{x:a.width-10,y:380});w.moveActor(w.player,40,0);
 assert.equal(w.areaId,next);assert.ok(w.player.x<300);assert.match(w.message,/^1\.2 Mossroot Trail · Defeat every stumpling/);
 const stumps=w.wildlife.filter(s=>s.areaId===next&&s.health>0);
 assert.ok(stumps.every(s=>s.species==='stump'&&s.level>=2&&s.level<=4));
 assert.equal(stumps.length,f.clear.kills);assert.equal(fieldProgress(w).goal,stumps.length);assert.equal(fieldProgress(w).kills,0);
 // Back west is always open, and 1.1 stays cleared.
 Object.assign(w.player,{x:10,y:380});w.moveActor(w.player,-40,0);assert.equal(w.areaId,REGION_START);assert.match(w.message,/Cleared/);
 // Saves remember both maps.
 w.areaId=next;kill(w,stumps[0]);const r=restoreSave(captureSave(w));
 assert.equal(r.areaId,next);assert.equal(r.wildlife.filter(s=>s.areaId===next&&s.health>0).length,stumps.length-1);
 assert.equal(r.wildlife.filter(s=>s.areaId===REGION_START&&s.health>0).length,0);
});

test('1.3 Saltspray Shore: shore crabs in bunches and Mudshell, the giant boss crab, alone by the east gate',()=>{
 const w=regions(),id='saltspray-shore',f=FIELD_MAPS[id];
 const here=w.wildlife.filter(a=>a.areaId===id),boss=here.filter(a=>a.species==='boss-crab');
 assert.equal(here.length,f.clear.kills);assert.equal(boss.length,1);
 const [m]=boss;assert.equal(m.name,'Mudshell');assert.equal(m.elite,true);assert.equal(m.level,7);assert.ok(m.armor<1);
 assert.ok(m.x>3500,'by the east gate');assert.ok(m.maxHealth>here.find(a=>a.species==='shore-crab').maxHealth*5);
 assert.ok(here.filter(a=>a.species==='shore-crab').every(a=>a.level>=4&&a.level<=6));
 // 1.2 has to be cleared before its gate lets Eli onto the shore.
 w.areaId='mossroot-trail';Object.assign(w.player,{x:AREAS['mossroot-trail'].width-10,y:380});w.moveActor(w.player,40,0);assert.equal(w.areaId,'mossroot-trail');
 for(const s of w.wildlife.filter(a=>a.areaId==='mossroot-trail'&&a.health>0))kill(w,s);
 Object.assign(w.player,{x:AREAS['mossroot-trail'].width-10,y:380});w.moveActor(w.player,40,0);assert.equal(w.areaId,id);
 // Mudshell counts toward the clear like any crab.
 for(const a of here)kill(w,a);assert.equal(fieldProgress(w).kills,f.clear.kills);assert.equal(w.fieldClear.code,'1.3');
});

test('a dungeon run ends on Mudshell with a run rank and best record; Run again brings every monster back; a save keeps it all',()=>{
 const w=regions(),rec=()=>w.dungeon.records[DUNGEON.id],first=rec().runs;
 for(const id of DUNGEON.maps){w.areaId=id;for(const a of w.wildlife.filter(a=>a.areaId===id&&a.health>0))kill(w,a);}
 const r=w.dungeon.result;assert.ok(r,'results screen');assert.match(r.rank,/^[SABC]$/);assert.equal(r.kills,DUNGEON.maps.reduce((n,id)=>n+FIELD_MAPS[id].clear.kills,0));
 assert.equal(w.dungeon.run,null);assert.equal(rec().clears,1);assert.deepEqual(rec().best.rank,r.rank);assert.equal(r.id,DUNGEON.id);assert.equal(r.best,true);
 const stones=w.well.stones;
 // Run again: fresh monsters, a fresh clock, gates shut again; the first-clear reward is not paid twice.
 startRun(w);assert.equal(rec().runs,first+1);assert.equal(w.dungeon.result,null);assert.equal(w.areaId,REGION_START);
 for(const id of DUNGEON.maps)assert.equal(w.wildlife.filter(a=>a.areaId===id&&a.health>0).length,FIELD_MAPS[id].clear.kills);
 Object.assign(w.player,{x:AREAS[REGION_START].width-10,y:380});w.moveActor(w.player,40,0);assert.equal(w.areaId,REGION_START,'gate shut again');
 for(const a of slimes(w))kill(w,a);assert.equal(w.well.stones,stones,'first-clear reward once');assert.equal(w.fieldClear.first,false);
 // A save mid-run keeps the run and the best record.
 const back=restoreSave(captureSave(w));assert.ok(back.dungeon.run);assert.equal(back.dungeon.records[DUNGEON.id].best.rank,r.rank);assert.equal(back.dungeon.records[DUNGEON.id].runs,rec().runs);
 // Walking west out of 1.1 lands in camp and ends the run.
 Object.assign(w.player,{x:10,y:380});w.moveActor(w.player,-40,0);assert.equal(w.areaId,CAMP);assert.equal(w.dungeon.run,null);
 backToCamp(w);assert.equal(w.areaId,CAMP);
});

test('Wilds Camp has a portal for each of the three dungeons; each run starts on its own first map and ends on its boss',()=>{
 assert.deepEqual(DUNGEONS.map(d=>[d.maps[0],d.maps.at(-1),d.boss]),[['dewdrop-meadow','saltspray-shore','Mudshell'],['bramble-hollow','cattail-fen','Old Croaker'],['lantern-glade','mossback-ruins','Capstomper']]);
 const ports=DUNGEONS.map(d=>portalOf(d.id));assert.ok(ports.every(Boolean));
 for(let i=0;i<ports.length;i++)for(let j=i+1;j<ports.length;j++)assert.ok(Math.abs(ports[i].x-ports[j].x)>=200,'portals apart');
 for(const d of DUNGEONS.slice(1)){
  const w=fresh(),q=portalOf(d.id);Object.assign(w.player,{x:q.x,y:q.y+60});assert.equal(nearPortal(w),d.id);
  startRun(w,d.id);assert.equal(w.areaId,d.maps[0]);assert.equal(w.dungeon.run.id,d.id);
  for(const id of d.maps){w.areaId=id;const here=w.wildlife.filter(a=>a.areaId===id&&a.health>0);assert.equal(here.length,FIELD_MAPS[id].clear.kills);for(const a of here)kill(w,a);}
  assert.equal(w.dungeon.result.id,d.id);assert.equal(w.dungeon.records[d.id].clears,1);assert.equal(w.dungeon.records[DUNGEON.id].clears,0);
  // Walking west out of the first map ends the run in camp.
  startRun(w,d.id);Object.assign(w.player,{x:10,y:380});w.moveActor(w.player,-40,0);assert.equal(w.areaId,CAMP);assert.equal(w.dungeon.run,null);
 }
});

test('a save from before the second dungeon keeps its Reedwater Wilds record and run',()=>{
 const w=fresh();restoreDungeon({runs:4,clears:2,best:{rank:'A',seconds:300,combo:20,damage:50},run:{startedAt:12}},w);
 assert.deepEqual(w.dungeon.records[DUNGEON.id],{runs:4,clears:2,best:{rank:'A',seconds:300,combo:20,damage:50}});
 assert.deepEqual(w.dungeon.run,{id:DUNGEON.id,startedAt:12});assert.equal(w.dungeon.records['thornberry-vale'].runs,0);
 assert.throws(()=>restoreDungeon({run:null,records:{nowhere:{runs:0,clears:0,best:null}}},w));
});
