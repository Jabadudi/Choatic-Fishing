import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {AREAS} from '../src/wilds.js';
import {rollArea} from '../src/spawns.js';
import {damageAnimal} from '../src/wildlife.js';
import {attack,damage} from '../src/combat.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {FIELD_MAPS,levelAt,applyLevel,rankFor,mapTitle,fights} from '../src/field-maps.js';
import {createElite,fieldKill,fieldProgress,ELITE_CLEARANCE} from '../src/field-play.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
// An exploration world (monsters awake, no story), standing on a field map.
function field(area='landing',at=AREAS[area].spawn){
 const w=new World(()=>.2,{adventure:true});w.journeyId='field-test';w.areaId=area;Object.assign(w.player,at);
 if(w.well)w.well.stones=0;return w;
}
const elite=(w,id)=>w.wildlife.find(a=>a.eliteId===id&&a.health>0);
const kill=(w,a)=>{Object.assign(w.player,{x:a.x-40,y:a.y});a.downRemaining=1;for(let i=0;i<500&&a.health>0;i++){w.player.health=w.progression.maxHealth;damageAnimal(w,a,1000,w.player,0);}assert.equal(a.health,0,`${a.name} falls`);};

test('a field map’s monster level rises from its west edge to its east edge, inside the map’s band',()=>{
 assert.deepEqual(FIELD_MAPS.landing.levels,[1,2]);assert.deepEqual(FIELD_MAPS.windchime.levels,[2,4]);
 assert.equal(levelAt('landing',10,4000),1);assert.equal(levelAt('landing',3990,4000),2);
 assert.equal(levelAt('windchime',10,3600),2);assert.equal(levelAt('windchime',1800,3600),3);assert.equal(levelAt('windchime',3590,3600),4);
 assert.equal(levelAt('village',3000,4000),1,'towns and old areas have no band');
 const walker=applyLevel({maxHealth:80,health:80,attackDamage:16,huntXp:40},4);
 assert.deepEqual([walker.level,walker.maxHealth,walker.health,walker.attackDamage,walker.huntXp],[4,123,123,22,70]);
 assert.equal(mapTitle('landing','Reedwater Landing'),'1.1 Reedwater Landing');assert.equal(mapTitle('village','Willow Commons'),'Willow Commons');
});

test('monsters on a field map spawn in packs with their levels, and the cap still holds',()=>{
 const w=field('windchime');w.wildlife=w.wildlife.filter(a=>a.areaId!=='windchime');w.rabbits=w.rabbits.filter(a=>a.areaId!=='windchime');
 for(let i=0;i<6;i++)rollArea(w,'windchime');
 const here=w.animals.filter(a=>a.areaId==='windchime');assert.ok(here.length<=16);
 const packs=Object.values(Object.groupBy(here.filter(a=>a.packId),a=>a.packId));
 assert.ok(packs.length>0,'at least one pack');assert.ok(packs.some(p=>p.length>=3),'a pack of three or more');
 for(const p of packs){assert.equal(new Set(p.map(a=>a.species)).size,1,'one kind per pack');assert.ok(p.every(a=>fights(a)));}
 for(const a of here.filter(fights)){assert.ok(a.level>=2&&a.level<=4,`${a.id} Lv ${a.level}`);assert.equal(a.level,levelAt('windchime',a.home.x,AREAS.windchime.width),'its level is the band’s level where it spawned');}
 assert.ok(here.some(a=>a.level>2&&a.maxHealth>ANIMAL_TYPES[a.species].maxHealth),'higher levels are tougher');
});

test('hurting one of a pack turns the whole pack on Eli',()=>{
 const w=field('windchime');w.wildlife=w.wildlife.filter(a=>a.areaId!=='windchime');
 for(let i=0;i<10&&!w.wildlife.some(a=>a.packId&&a.behavior==='defensive');i++)rollArea(w,'windchime');
 const one=w.wildlife.find(a=>a.packId&&a.behavior==='defensive'),rest=w.wildlife.filter(a=>a.packId===one.packId&&a!==one);
 assert.ok(rest.length>0);Object.assign(w.player,{x:one.x-40,y:one.y});
 assert.ok(damageAnimal(w,one,1,w.player,0));
 for(const a of rest){assert.equal(a.anger,1);assert.equal(a.attackerId,w.player.id);}
});

test('the elite rises away from Eli, is bigger and tougher, and Mudshell’s shell halves hits until it is knocked down',()=>{
 const w=field('landing');w.update(1/60,idle(w));
 const mud=elite(w,'mudshell');assert.ok(mud,'Mudshell is on the causeway');
 assert.equal(mud.name,'Mudshell');assert.equal(mud.level,3);assert.ok(mud.scale>2);assert.equal(mud.species,'crab');
 assert.ok(mud.maxHealth>=ANIMAL_TYPES.crab.maxHealth*3);
 const h=mud.health;Object.assign(w.player,{x:mud.x-60,y:mud.y});damageAnimal(w,mud,20,w.player,0);assert.equal(h-mud.health,10,'shell halves the hit');
 mud.downRemaining=.5;const h2=mud.health;damageAnimal(w,mud,20,w.player,0);assert.equal(h2-mud.health,20,'full damage while down');
 // Too close to its spot: no elite rises on top of Eli.
 const near=field('landing',{x:FIELD_MAPS.landing.elite.x-ELITE_CLEARANCE+40,y:FIELD_MAPS.landing.elite.y});near.update(1/60,idle(near));assert.equal(elite(near,'mudshell'),undefined);
 // A combo finisher knocks an elite down, but only for a short window.
 const w3=field('landing');w3.update(1/60,idle(w3));const m3=elite(w3,'mudshell');m3.health=m3.maxHealth=1e5;Object.assign(w3.player,{x:m3.x-60,y:m3.y,angle:0});
 for(let i=0;i<3;i++){attack(w3,w3.player,{name:'Reed Spear'});if(i<2)for(let t=0;t<w3.player.cooldown+.02;t+=1/60)w3.update(1/60,idle(w3));}
 assert.ok(m3.downRemaining>0&&m3.downRemaining<.9);
});

test('the elite leaves with Eli, is never saved, and comes back five minutes after a defeat',()=>{
 const w=field('windchime');w.update(1/60,idle(w));const stag=elite(w,'hollowbranch');assert.ok(stag);assert.equal(stag.name,'Hollowbranch');
 assert.ok(!captureSave(w).state.animals.some(a=>a.id===stag.id));
 kill(w,stag);assert.equal(w.fieldMaps.windchime.elite,true);
 w.update(1/60,idle(w));assert.equal(elite(w,'hollowbranch'),undefined,'not straight back');
 Object.assign(w.player,AREAS.windchime.spawn);w.elapsed+=301;w.update(1/60,idle(w));assert.ok(elite(w,'hollowbranch'),'back after its respawn time');
 w.areaId='landing';w.update(1/60,idle(w));assert.ok(!w.wildlife.some(a=>a.eliteId==='hollowbranch'));
});

test('30 monsters and the elite clear the map with a rank; only the first clear pays',()=>{
 const w=field('landing'),f=FIELD_MAPS.landing;w.update(1/60,idle(w));
 const marks=w.inventory.marks||0;
 const monster=()=>({areaId:'landing',behavior:'defensive',health:0});
 for(let i=0;i<f.clear.kills;i++)fieldKill(w,monster());
 assert.equal(w.fieldClear,undefined,'the elite is still standing');assert.deepEqual(fieldProgress(w),{code:'1.1',kills:30,goal:30,elite:false,eliteName:'Mudshell',best:null,clears:0});
 // Rabbits and other harmless animals do not count.
 fieldKill(w,{areaId:'landing',behavior:'passive'});assert.equal(w.fieldMaps.landing.kills,30);
 const stones=w.well.stones;w.elapsed+=200;kill(w,elite(w,'mudshell'));
 const c=w.fieldClear;assert.ok(c);assert.equal(c.code,'1.1');assert.equal(c.first,true);assert.match(w.message,/1\.1 Reedwater Landing cleared · Rank [SABC]/);
 assert.deepEqual(c.reward,{wishstones:1,marks:40});assert.equal(w.inventory.marks,marks+40);assert.equal(w.well.stones,stones+1);
 assert.equal(w.fieldMaps.landing.kills,0,'a fresh run starts');assert.equal(w.fieldMaps.landing.clears,1);assert.equal(w.fieldMaps.landing.best,c.rank);
 // Again, for a better rank: no second reward.
 for(let i=0;i<f.clear.kills;i++)fieldKill(w,monster());fieldKill(w,{areaId:'landing',behavior:'defensive',eliteId:'mudshell'});
 assert.equal(w.fieldClear.first,false);assert.equal(w.fieldClear.reward,null);assert.equal(w.inventory.marks,marks+40);assert.equal(w.fieldMaps.landing.clears,2);
 // The banner goes after a few seconds.
 for(let i=0;i<8*10;i++)w.update(.1,idle(w));assert.equal(w.fieldClear,null);
});

test('the rank comes from clear time, damage taken and best combo',()=>{
 assert.equal(rankFor({seconds:200,damage:20,combo:30}).rank,'S');
 assert.equal(rankFor({seconds:300,damage:100,combo:15}).rank,'A');
 assert.equal(rankFor({seconds:500,damage:200,combo:8}).rank,'B');
 assert.equal(rankFor({seconds:900,damage:900,combo:2}).rank,'C');
 // Damage Eli takes on the map, and his best combo there, are kept for the rank.
 const w=field('landing'),deer=w.wildlife.find(a=>a.species==='deer');Object.assign(w.player,{x:deer.x-40,y:deer.y});
 const h=w.player.health;damage(w,w.player,10,deer,0);assert.ok(w.player.health<h);
 assert.ok(Math.abs(w.fieldMaps.landing.damage-(h-w.player.health))<1e-9);
 w.combo={count:12,remaining:1,best:12};w.update(1/60,idle(w));assert.equal(w.fieldMaps.landing.combo,12);
});

test('field map progress and monster levels survive a save; bad data is refused',()=>{
 const w=field('windchime');w.wildlife=w.wildlife.filter(a=>a.areaId!=='windchime');for(let i=0;i<4;i++)rollArea(w,'windchime');
 Object.assign(w.fieldMaps.windchime,{kills:12,startedAt:3,damage:40,combo:9,clears:1,best:'A',elite:true,eliteAt:400});
 const save=captureSave(w),r=restoreSave(save);
 assert.deepEqual(r.fieldMaps.windchime,w.fieldMaps.windchime);
 const leveled=w.wildlife.filter(a=>a.areaId==='windchime'&&a.level>1);assert.ok(leveled.length);
 for(const a of leveled){const b=r.wildlife.find(x=>x.id===a.id);assert.ok(b,a.id);assert.equal(b.level,a.level);assert.equal(b.maxHealth,a.maxHealth);assert.equal(b.packId,a.packId);}
 // An older save has no field map progress: every map starts fresh.
 const old=structuredClone(save);delete old.state.fieldMaps;assert.equal(restoreSave(old).fieldMaps.windchime.kills,0);
 const bad=structuredClone(save);bad.state.fieldMaps.windchime.best='Z';assert.throws(()=>restoreSave(bad),/field map/);
 const bad2=structuredClone(save);bad2.state.fieldMaps.windchime.kills=-1;assert.throws(()=>restoreSave(bad2),/field map/);
 const bad3=structuredClone(save);bad3.state.animals.find(a=>a.level).level=9999;assert.throws(()=>restoreSave(bad3),/animal/);
});

test('the elite can be created for every field map from its data',()=>{
 for(const [areaId,f] of Object.entries(FIELD_MAPS).filter(([,f])=>f.elite)){
  const w=field(areaId),a=createElite({...f.elite,areaId},w);assert.ok(a,f.elite.name);assert.equal(a.elite,true);assert.equal(a.level,f.elite.level);
 }
});
