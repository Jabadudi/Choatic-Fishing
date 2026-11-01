import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {captureSave,restoreSave,parseSave,importantProgress} from '../src/save-format.js';
import {SaveManager,findUsableSave} from '../src/save-store.js';
import {neutralInput} from '../src/protocol.js';
const copy=value=>JSON.parse(JSON.stringify(value));
const fresh=()=>{const w=new World(()=>.1,{adventure:true});w.journeyId='test-journey';return w;};
class MemoryStore{
 async read(){return copy(this.root||null);}
 async update(change){if(this.fail){this.fail=false;throw Error('Disk full');}const next=change(copy(this.root||null));this.root=copy(next);return this.root;}
}
test('journey roundtrip restores progression, quest, inventory references, drops, discoveries and wildlife',()=>{
 const w=fresh();w.inventory.receive({name:'Reed Spear'});w.inventory.receive({name:'Sardine'});w.inventory.receive({name:'Old Boot'});
 const spear=w.inventory.allItems[0];spear.uses=2;w.inventory.assignHotbar(spear.id,6);w.equip(6);
 w.backpackAction(w.inventory.allItems[2].id,'drop');w.progression.award(115);w.progression.choose('tidal');w.progression.grantCatchBuff(()=>.9);
 w.quests['mara-sardine'].status='complete';w.discovered.add('tree');w.hunting={total:1,bySpecies:{rabbit:1}};
 w.rabbits[0].health=0;w.rabbits[0].state='dead';w.rabbits[0].deathRemaining=.5;w.wildlife[0].health=38;
 w.player.health=62;w.fishing.state='reeling';w.bobber={x:650,y:1910};
 const encoded=JSON.stringify(captureSave(w)),restored=restoreSave(parseSave(encoded));
 assert.equal(restored.progression.totalXp,115);assert.equal(restored.progression.level,2);assert.equal(restored.progression.specials.tidal,1);
 assert.equal(restored.inventory.item.name,'Reed Spear');assert.equal(restored.inventory.item.uses,2);
 assert.equal(restored.inventory.item,restored.inventory.allItems[0]);restored.inventory.use();assert.equal(restored.inventory.allItems[0].uses,1);assert.equal(w.inventory.item.uses,2);
 assert.equal(restored.inventory.allItems.length,2);assert.equal(restored.drops[0].item.name,'Old Boot');assert.equal(restored.quests['mara-sardine'].status,'complete');
 assert.ok(restored.discovered.has('tree'));assert.equal(restored.hunting.total,1);assert.equal(restored.rabbits[0].health,0);assert.equal(restored.wildlife[0].health,38);
 assert.equal(restored.player.health,62);assert.equal(restored.fishing.state,'idle');assert.equal(restored.bobber,null);
 restored.update(1/120,neutralInput());assert.equal(restored.rabbits[0].health,0);
});
test('restore preserves area and protects against changed-map positions and unsupported or malicious saves',()=>{
 const w=fresh();w.areaId='windchime';Object.assign(w.player,{x:330,y:1120});const save=captureSave(w);
 assert.equal(restoreSave(save).areaId,'windchime');
 const bad=copy(save);bad.version=99;assert.throws(()=>restoreSave(bad),/newer/);
 bad.version=0;assert.throws(()=>restoreSave(bad),/not supported/);
 bad.version=1;bad.state.inventory.hotbar[0]='missing';assert.throws(()=>restoreSave(bad),/hotbar/);
 assert.throws(()=>parseSave('not json'));assert.throws(()=>parseSave('{"__proto__":{"bad":true}}'),/invalid fields/);
 assert.throws(()=>parseSave('x'.repeat(5*1024*1024+1)),/too large/);
 assert.equal(w.inventory.allItems.length,0);
 const blocked=copy(save);blocked.state.areaId='landing';blocked.state.player.x=650;blocked.state.player.y=1910;
 assert.deepEqual({x:restoreSave(blocked).player.x,y:restoreSave(blocked).player.y},{x:1250,y:1650});
});
test('manual save stays separate while current autosave and three older backups rotate atomically',async()=>{
 const store=new MemoryStore();let now=1700000000000;const manager=new SaveManager(store,()=>{},()=>now),w=fresh();await manager.begin(w);
 now++;w.progression.award(15);await manager.request('manual',true);const manual=copy(store.root.manual);
 for(let i=0;i<6;i++){now++;w.player.x++;await manager.request('auto',true);}
 assert.equal(store.root.backups.length,3);assert.equal(store.root.current.state.player.x,w.player.x);assert.deepEqual(store.root.manual,manual);
 const before=copy(store.root);store.fail=true;w.inventory.receive({name:'Sardine'});await assert.rejects(manager.request('auto',true),/Disk full/);assert.deepEqual(store.root,before);
});
test('autosave responds to completed progress and periodically checkpoints changed exploration',async()=>{
 const store=new MemoryStore();let now=1700000000000;const manager=new SaveManager(store,()=>{},()=>now),w=fresh();await manager.begin(w);
 now+=250;w.inventory.receive({name:'Sardine'});manager.observe();await manager.queue;assert.equal(store.root.current.state.inventory.items.length,1);
 const last=store.root.current.savedAt;now+=250;manager.observe();await manager.queue;assert.equal(store.root.current.savedAt,last);
 w.player.x+=10;now+=30001;manager.observe();await manager.queue;assert.equal(store.root.current.state.player.x,w.player.x);
});
test('corrupt latest save falls back to a readable backup, and failed import leaves stored progress intact',async()=>{
 const store=new MemoryStore(),manager=new SaveManager(store),w=fresh();await manager.begin(w);const valid=copy(store.root.current);
 const broken=copy(valid);broken.savedAt++;broken.state.inventory.items=[{name:'bad'}];store.root.current=broken;store.root.backups=[valid];
 const usable=findUsableSave(store.root);assert.ok(usable.recovered);assert.equal(usable.world.journeyId,w.journeyId);
 const before=copy(store.root);const invalid=copy(valid);invalid.state.player.health=-1;assert.throws(()=>restoreSave(invalid));assert.deepEqual(store.root,before);
});
test('loading a checkpoint restores the manual state without re-awarding Mara quest XP',async()=>{
 const store=new MemoryStore(),manager=new SaveManager(store),w=fresh();w.quests['mara-sardine'].status='complete';w.progression.award(15);await manager.begin(w);
 await manager.request('manual',true);const restored=await manager.restore(store.root.manual);
 Object.assign(restored.player,{x:restored.npcs[0].x-35,y:restored.npcs[0].y});restored.inspect();assert.equal(restored.progression.totalXp,15);
 assert.equal(manager.world,restored);assert.equal(store.root.manual.reason,'manual');
});
test('another tab cannot silently overwrite the active journey',async()=>{
 const store=new MemoryStore(),a=new SaveManager(store),b=new SaveManager(store),w=fresh();await a.begin(w);
 await b.restore(store.root.current);const before=copy(store.root);w.progression.award(15);
 await assert.rejects(a.request('auto',true),/another tab/);assert.deepEqual(store.root,before);
});
test('important progress includes quest, XP, shortcut and wildlife changes but movement uses periodic saves',()=>{
 const w=fresh(),start=importantProgress(w);w.player.x++;assert.equal(importantProgress(w),start);
 w.quests['mara-sardine'].status='active';assert.notEqual(importantProgress(w),start);
});

test('failed import or checkpoint write preserves both the current journey and previous records',async()=>{
 const store=new MemoryStore(),manager=new SaveManager(store),w=fresh();await manager.begin(w);const before=copy(store.root);
 const imported=fresh();imported.journeyId='different';imported.progression.award(15);store.fail=true;
 await assert.rejects(manager.begin(imported,captureSave(imported)),/Disk full/);assert.equal(manager.world,w);assert.deepEqual(store.root,before);
 store.fail=true;await assert.rejects(manager.restore(before.current),/Disk full/);assert.equal(manager.world,w);assert.deepEqual(store.root,before);
});
test('a newer-version latest save is protected instead of automatically overwriting it from an older backup',()=>{
 const valid=captureSave(fresh()),future=copy(valid);future.version=99;future.savedAt++;
 assert.throws(()=>findUsableSave({current:future,backups:[valid]}),/newer game version/);
});
