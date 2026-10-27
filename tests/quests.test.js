import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {questObjective} from '../src/quests.js';
import {dialogueLines} from '../src/npcs.js';
const fresh=()=>{const w=new World(()=>0,{adventure:true});Object.assign(w.player,{x:w.npcs[0].x-35,y:w.npcs[0].y});return w;};
test('Mara offers the quest on first talk and reminds without rewarding empty hands',()=>{
 const w=fresh();assert.equal(questObjective(w),null);w.inspect();
 assert.equal(w.quests['mara-sardine'].status,'active');assert.match(w.dialogue.text,/1 sardine/);
 w.inspect();assert.match(w.dialogue.text,/Still hungry/);assert.equal(w.progression.totalXp,0);
 assert.match(questObjective(w),/0\/1/);
});
test('caught sardine can be handed over from any slot, exactly once, for 15 additional XP',()=>{
 const w=fresh();w.inspect();w.inventory.receive({name:'Reed Spear'});
 w.fishing.state='caught';w.fishing.result={name:'Sardine'};w.advanceFishing(w.player,0,false);
 w.inventory.receive({name:'Sardine'});w.inventory.assignHotbar(w.inventory.allItems[1].id,3);w.equip(3);const xp=w.progression.totalXp;
 assert.equal(xp,30);assert.match(questObjective(w),/1\/1/);w.player.health=40;w.inspect();
 assert.equal(w.progression.totalXp,xp+15);assert.equal(w.player.health,40);
 assert.equal(w.inventory.allItems[0].name,'Reed Spear');assert.equal(w.inventory.slots[1].name,'Sardine');
 assert.equal(w.inventory.countOf('Sardine'),1);assert.equal(w.inventory.selected,3);
 assert.equal(w.quests['mara-sardine'].status,'complete');assert.match(w.dialogue.text,/\+15 XP/);
 for(let i=0;i<10;i++)w.inspect();assert.equal(w.progression.totalXp,xp+15);assert.equal(w.inventory.allItems.length,2);
});
test('existing sardine still requires accepting first, and unrelated selection is preserved',()=>{
 const w=fresh();w.inventory.receive({name:'Sardine'});w.inventory.receive({name:'Crab Maul'});w.inventory.assignHotbar(w.inventory.allItems[1].id,3);w.equip(3);
 w.inspect();assert.equal(w.inventory.allItems[0].name,'Sardine');assert.equal(w.progression.totalXp,0);
 w.inspect();assert.equal(w.inventory.slots[0],null);assert.equal(w.inventory.selected,3);assert.equal(w.inventory.item.name,'Crab Maul');
});
test('eating the sardine removes readiness; quest persists across travel but resets for a new journey',()=>{
 const w=fresh();w.inspect();w.inventory.receive({name:'Sardine'});w.backpackAction(w.inventory.allItems[0].id,'use');
 assert.match(questObjective(w),/0\/1/);w.inspect();assert.equal(w.progression.totalXp,0);
 w.areaId='windchime';assert.equal(w.quests['mara-sardine'].status,'active');
 assert.equal(fresh().quests['mara-sardine'].status,'available');
});
test('distant, dead and non-adventure interactions cannot accept or complete the quest',()=>{
 const w=fresh();w.player.health=0;assert.equal(w.inspect(),false);
 assert.equal(w.quests['mara-sardine'].status,'available');w.player.health=100;w.areaId='windchime';w.inspect();
 assert.equal(w.quests['mara-sardine'].status,'available');assert.equal(new World().inspect(),false);
});
test('quest dialogue wraps within the speech bubble on each conversation state',()=>{
 const w=fresh();w.inspect();const texts=[w.dialogue.text];w.inspect();texts.push(w.dialogue.text);
 w.inventory.receive({name:'Sardine'});w.inspect();texts.push(w.dialogue.text);w.inspect();texts.push(w.dialogue.text);
 for(const text of texts){const lines=dialogueLines(text);assert.equal(lines.join(' '),text);assert.ok(lines.every(line=>line.length<=25));}
});
