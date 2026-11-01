import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {walkable,waterDistance} from '../src/wilds.js';
import {BOSS_SPOTS,createBoss,RISE_SECONDS} from '../src/bosses.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {animalPose} from '../src/wildlife-art.js';
import {damageAnimal} from '../src/wildlife.js';
import {rollLoot,LOOT_TABLES} from '../src/loot.js';
import {damage,WEAPONS,WEAPON_RUSHES} from '../src/combat.js';
import {PERMANENT_ITEMS} from '../src/inventory.js';
import {WELL_ARTIFACT_IDS,artifactItem,slotArtifact} from '../src/artifacts.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {codexEntry,codexLocations} from '../src/codex.js';
const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
const spot=id=>BOSS_SPOTS.find(b=>b.id===id);
const pngSize=path=>{const b=readFileSync(path);return [b.readUInt32BE(16),b.readUInt32BE(20)];};
// Walkable ground at about r from the spot.
function ground(s,r){for(let d=r;d<r+400;d+=10)for(let k=0;k<64;k++){const x=s.x+Math.cos(k*Math.PI/32)*d,y=s.y+Math.sin(k*Math.PI/32)*d;if(walkable(x,y,s.areaId))return {x,y};}throw Error('no ground');}
// The boss's area with nothing else in it, and Eli out of the boss's arena.
function setup(id){
 const s=spot(id),w=new World(()=>.2,{adventure:true});w.journeyId='boss-test';w.spawns=null;w.rabbits=[];w.wildlife=[];w.areaId=s.areaId;
 Object.assign(w.player,ground(s,s.arena+150));return {w,s};
}
const boss=w=>w.wildlife.find(a=>a.boss);
const until=(w,check,seconds=10,step=1/30)=>{for(let t=0;t<seconds;t+=step){if(check())return true;w.update(step,idle(w));}return check();};
const stand=(w,s,r)=>Object.assign(w.player,ground(s,r));

test('both world bosses have a spot on safe ground, an Index entry with its dot, and art for every clip',()=>{
 assert.deepEqual(BOSS_SPOTS.map(b=>b.id).sort(),['drowned-captain','greyhorn']);
 for(const s of BOSS_SPOTS){
  const spec=ANIMAL_TYPES[s.species];assert.ok(spec.boss&&spec.familiar===false&&ANIMAL_TYPES[spec.base],s.id);
  const w=new World(()=>.2,{adventure:true}),a=createBoss(s,w);assert.ok(a,`${s.id} stands on its spot`);
  // Health and damage come from the spot's multipliers on the kind the boss grew from.
  assert.equal(a.maxHealth,Math.round(ANIMAL_TYPES[spec.base].maxHealth*s.health));assert.equal(a.attackDamage,Math.round(ANIMAL_TYPES[spec.base].attackDamage*s.damage));
  assert.ok(spec.chaseSpeed<195,'Eli can always walk away');
  const entry=codexEntry(s.species);assert.equal(entry.category,'bosses');assert.equal(codexLocations(entry).length,1);
  const def=SPRITES[s.species],[w2,h]=pngSize(`assets/${def.asset}`),[cw,ch]=def.frameSize,count=(w2/cw)*(h/ch);
  assert.equal(w2%cw,0);assert.equal(h%ch,0);
  for(const [name,clip] of Object.entries(def.animations))for(const f of clip.frames)assert.ok(f>=0&&f<count,`${s.id} ${name} frame ${f}`);
  for(const clip of ['walk:right','walk:down','walk:up','raise','swing','call','death',spec.moves.lunge?'lunge':'charge'])assert.ok(def.animations[clip],`${s.id} ${clip}`);
 }
 for(const id of ['eli-sabre','eli-spear']){const def=SPRITES[id],[w,h]=pngSize(`assets/${def.asset}`);assert.deepEqual([w/def.frameSize[0],h/def.frameSize[1]],[8,2],id);}
});

test('a boss rises at its spot when Eli comes into its area, and waits there until he steps into its arena',()=>{
 const {w,s}=setup('drowned-captain');w.update(1/30,idle(w));
 const a=boss(w);assert.ok(a);assert.equal(a.state,'rise');assert.equal(animalPose(a).state,'rise');
 assert.ok(Math.hypot(a.x-s.x,a.y-s.y)<60);
 assert.ok(until(w,()=>a.state==='idle',RISE_SECONDS+.2));
 assert.ok(!until(w,()=>a.state==='notice',3),'Eli is outside the arena');
 stand(w,s,s.arena-150);w.update(1/30,idle(w));assert.equal(a.state,'notice');
 // Not right on top of Eli, and not twice.
 const {w:near,s:s2}=setup('greyhorn');stand(near,s2,100);near.update(1/30,idle(near));assert.equal(boss(near),undefined);
 stand(near,s2,s2.arena+150);near.update(1/30,idle(near));near.update(1/30,idle(near));assert.equal(near.wildlife.filter(x=>x.boss).length,1);
});

test('bosses stay asleep until the story has shown Eli a shadow walker, and stay awake through Chapter 7',async()=>{
 const {CHAPTER_SEVEN_STAGES}=await import('../src/chapter7.js'),{monstersAwake}=await import('../src/spawns.js');
 for(const stage of CHAPTER_SEVEN_STAGES)assert.ok(monstersAwake({story:{stage,scene:null}}),stage);
 const s=spot('greyhorn'),w=new World(()=>.2,{adventure:true,story:true});w.spawns=null;w.wildlife=[];w.rabbits=[];w.areaId=s.areaId;
 Object.assign(w.player,ground(s,s.arena+150));w.update(1/30,idle(w));assert.equal(boss(w),undefined);
});

test('the Drowned Captain sweeps his sabre up close, lunges from further off, and calls Drowned Soldiers as he weakens',()=>{
 const {w,s}=setup('drowned-captain');w.update(1/30,idle(w));const a=boss(w);until(w,()=>a.state==='idle',2);
 // Up close: the sweep's windup, then the hit.
 Object.assign(w.player,{x:a.x+60,y:a.y});while(!walkable(w.player.x,w.player.y,s.areaId))w.player.y+=4;
 const before=w.player.health;
 assert.ok(until(w,()=>a.state==='attack',3));assert.equal(animalPose(a).state,'raise');
 assert.ok(until(w,()=>a.state==='strike',2));assert.ok(w.player.health<before,'the sabre lands');
 // Two thirds down: he calls two soldiers out of the water.
 a.health=a.maxHealth*.6;w.player.health=100;
 assert.ok(until(w,()=>a.state==='call',2));assert.equal(animalPose(a).state,'call');
 assert.ok(until(w,()=>w.wildlife.filter(x=>x.bossId===a.bossId&&x.species==='drowned-soldier').length===2,3));
 // From mid range, with the lunge ready: the windup, then the rush along the road.
 const {w:w2,s:s2}=setup('drowned-captain');w2.update(1/30,idle(w2));const b=boss(w2);until(w2,()=>b.state==='idle',2);
 stand(w2,s2,250);b.rushCooldown=0;
 assert.ok(until(w2,()=>b.state==='rush-raise',4));assert.equal(animalPose(b).state,'lunge-raise');
 const x=b.x,y=b.y;assert.ok(until(w2,()=>b.state==='rush',2));w2.update(.2,idle(w2));
 assert.ok(Math.hypot(b.x-x,b.y-y)>60,'he lunges');
});

test('Greyhorn stomps all round, charges, bellows for Hollow Stags and grows shadow antlers at half health',()=>{
 const {w,s}=setup('greyhorn');w.update(1/30,idle(w));const a=boss(w);until(w,()=>a.state==='idle',2);
 // Eli behind him still gets caught by the stomp's ring.
 a.direction={x:1,y:0};Object.assign(w.player,{x:a.x-90,y:a.y});
 assert.ok(until(w,()=>a.state==='attack',3));const before=w.player.health;
 assert.ok(until(w,()=>a.state==='strike',2));assert.ok(w.player.health<before);assert.ok(w.effects.some(e=>e.name==='stomp'));
 a.health=a.maxHealth*.6;w.player.health=100;assert.ok(until(w,()=>a.state==='call',3));
 assert.ok(until(w,()=>w.wildlife.filter(x=>x.bossId===a.bossId&&x.species==='hollow-stag').length===2,3));
 a.health=a.maxHealth*.45;w.player.health=100;assert.ok(until(w,()=>a.state==='antlers',4));assert.equal(animalPose(a).state,'antlers');
 assert.ok(until(w,()=>a.empowered,3));
 // The charge comes from range.
 const {w:w2,s:s2}=setup('greyhorn');w2.update(1/30,idle(w2));const b=boss(w2);until(w2,()=>b.state==='idle',2);
 stand(w2,s2,300);b.rushCooldown=0;assert.ok(until(w2,()=>b.state==='rush',4));assert.equal(animalPose(b).state,'charge');
});

test('leaving the arena resets the fight: full health and the adds gone',()=>{
 const {w,s}=setup('drowned-captain');w.update(1/30,idle(w));const a=boss(w);until(w,()=>a.state==='idle',2);
 stand(w,s,200);assert.ok(until(w,()=>a.state==='chase',3));
 a.health=a.maxHealth*.6;assert.ok(until(w,()=>w.wildlife.length===3,4));
 stand(w,s,s.arena*1.5);assert.ok(until(w,()=>a.state==='idle',20));
 assert.equal(a.health,a.maxHealth);assert.deepEqual(w.wildlife,[a]);
 // Walking out of the area clears it too; it rises again on the way back in.
 w.areaId='elk-run';w.update(1/30,idle(w));assert.equal(w.wildlife.some(x=>x.bossId==='drowned-captain'),false);
});

test('a defeat drops the boss loot with its weapon certain the first time, pays marks and starts the respawn clock',()=>{
 const {w,s}=setup('greyhorn');w.update(1/30,idle(w));const a=boss(w);Object.assign(w.player,{x:a.x-120,y:a.y});
 const marks=w.inventory.marks;assert.equal(damageAnimal(w,a,1e5,w.player,0),true);
 const names=w.drops.map(d=>d.item.name);
 assert.equal(names.filter(n=>n==='Shadow Ichor').length,3);assert.ok(names.includes('Greyhorn Spear'));assert.ok(names.includes('Hollow Antler Shard'));
 assert.ok(w.inventory.marks-marks>=40&&w.inventory.marks-marks<=80);
 assert.match(w.message,/free/);assert.match(w.message,/Shadow Ichor ×3/);
 assert.equal(w.bosses.greyhorn.defeats,1);assert.equal(w.bosses.greyhorn.nextAt,w.elapsed+45*60);
 // Greyhorn's fall plays out to the freed frames before he fades.
 assert.ok(a.deathRemaining>=5);assert.equal(animalPose(a).state,'death');
 assert.ok(until(w,()=>!w.wildlife.includes(a),8)||a.deathRemaining===0);
 // Not back until the clock runs out.
 w.wildlife=[];stand(w,s,s.arena+150);w.update(1/30,idle(w));assert.equal(boss(w),undefined);
 w.elapsed=w.bosses.greyhorn.nextAt;w.update(1/30,idle(w));assert.ok(boss(w));
 // After the first time the weapon is a 10% roll, raised by luck like any rare drop.
 assert.ok(!rollLoot('greyhorn',()=>.99).some(i=>i.name==='Greyhorn Spear'));
 assert.ok(rollLoot('greyhorn',()=>.99,1,{first:true}).some(i=>i.name==='Greyhorn Spear'));
 assert.deepEqual(rollLoot('drowned-captain',()=>.99).map(i=>i.name),['Shadow Ichor','Shadow Ichor','Shadow Ichor','Drowned Brass','Drowned Brass']);
 assert.ok(LOOT_TABLES['drowned-captain'].some(e=>e.artifact==='drowned-gorget'));
});

test('the boss clocks are saved; the bosses themselves rise fresh on load',()=>{
 const {w}=setup('drowned-captain');w.update(1/30,idle(w));const a=boss(w);
 w.bosses.greyhorn={nextAt:w.elapsed+600,defeats:2};a.health=10;
 const save=captureSave(w);assert.ok(!save.state.animals.some(x=>x.slotId.startsWith('boss:')));
 const back=restoreSave(JSON.parse(JSON.stringify(save)));
 assert.deepEqual(back.bosses.greyhorn,{nextAt:w.elapsed+600,defeats:2});assert.equal(boss(back),undefined);
 delete save.state.bosses;assert.deepEqual(restoreSave(save).bosses.greyhorn,{nextAt:0,defeats:0});
 save.state.bosses={greyhorn:{nextAt:-1,defeats:0}};assert.throws(()=>restoreSave(save));
});

test('the boss weapons never break, the sabre sweeps wide, the spear reaches furthest, and holding attack rushes Eli forward',()=>{
 for(const name of ['Captain’s Sabre','Greyhorn Spear'])assert.ok(PERMANENT_ITEMS.has(name)&&WEAPONS[name]&&WEAPON_RUSHES[name],name);
 assert.equal(Math.max(...Object.values(WEAPONS).filter(w=>w.kind==='melee').map(w=>w.range)),WEAPONS['Greyhorn Spear'].range);
 const {w,s}=setup('greyhorn');w.wildlife=[];w.bosses={};
 w.inventory.receive({name:'Captain’s Sabre',category:'weapons'});const sabre=w.inventory.allItems.find(i=>i.name==='Captain’s Sabre');
 w.inventory.assignHotbar(sabre.id,2);w.equip(2);
 // A target well off to the side of Eli's aim is still inside the sabre's arc.
 const dummy={id:'dummy',entityType:'player',x:w.player.x+40,y:w.player.y+60,health:100,vx:0,vy:0,radius:14,progression:{damageReduction:0,passive:()=>0},inventory:null,fishing:{cancel(){}}};
 w.actors.push(dummy);w.player.angle=0;
 assert.equal(w.useItem(),true);assert.ok(dummy.health<100,'hit at 56° off aim');assert.equal(w.inventory.countOf('Captain’s Sabre'),1,'still there');
 assert.equal(w.player.weaponPose.spriteId,'eli-sabre');
 // Hold the attack: the Tide Lunge carries Eli forward once, then cools down.
 w.actors.pop();w.player.cooldown=0;stand(w,s,0);const x=w.player.x,y=w.player.y;
 const aim={x:x+400,y};let moved=false;
 for(let t=0;t<1.2;t+=1/30){w.update(1/30,{...idle(w),held:true,aim});if(Math.hypot(w.player.x-x,w.player.y-y)>80)moved=true;}
 assert.ok(moved||w.player.rushCooldown>0,'the lunge fired');assert.ok(w.player.rushCooldown>0);
});

test('the Drowned Gorget guards Eli by the water and the Spire Bell against shadow walkers only; neither comes from the Well',()=>{
 assert.ok(!WELL_ARTIFACT_IDS.includes('drowned-gorget')&&!WELL_ARTIFACT_IDS.includes('spire-bell'));
 const hit=(id,source,where)=>{
  const w=new World(()=>.2,{adventure:true});w.areaId='landing';Object.assign(w.player,where(w));
  if(id){w.inventory.receive(artifactItem(id,'legendary'));slotArtifact(w.inventory,w.inventory.allItems.find(i=>i.artifact===id));}
  const h=w.player.health;damage(w,w.player,50,source,0);return h-w.player.health;
 };
 const shadow={entityType:'animal',behavior:'aggressive'},deer={entityType:'animal',behavior:'defensive'};
 const dry=w=>{for(let x=200;x<3000;x+=40)for(let y=200;y<2000;y+=40)if(walkable(x,y,'landing')&&waterDistance(x,y,'landing')>400)return {x,y};};
 const shore=w=>{for(let x=200;x<3000;x+=20)for(let y=200;y<2000;y+=20)if(walkable(x,y,'landing')&&waterDistance(x,y,'landing')<40&&waterDistance(x,y,'landing')>0)return {x,y};};
 const plain=hit(null,shadow,dry);
 assert.ok(hit('drowned-gorget',shadow,shore)<plain);assert.equal(hit('drowned-gorget',shadow,dry),plain);
 assert.ok(hit('spire-bell',shadow,dry)<plain);
 assert.equal(hit('spire-bell',deer,dry),hit(null,deer,dry));
});
