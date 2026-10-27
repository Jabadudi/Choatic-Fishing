import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {CODEX_ENTRIES} from '../src/codex.js';
import {CODEX_IDS,STORY_REVEALS,ENCOUNTER_RANGE,codexRevealed,revealedCount,noteEncounters,storyRevealed} from '../src/codex-discovery.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {SCENES} from '../src/story.js';
const fresh=(story=true)=>{const w=new World(()=>.2,{adventure:true,story});w.journeyId='codex-test';return w;};

test('discovery covers every index entry and only real story scenes',()=>{
 assert.deepEqual([...CODEX_IDS].sort(),CODEX_ENTRIES.map(e=>e.id).sort());
 for(const r of STORY_REVEALS){assert.ok(SCENES[r.scene],r.scene);for(const id of r.ids)assert.ok(CODEX_IDS.includes(id),id);}
});

test('a new journey starts with every entry hidden',()=>{
 const w=fresh();
 assert.equal(revealedCount(w),0);
 for(const id of CODEX_IDS)assert.equal(codexRevealed(w,id),false,id);
});

test('animals and village characters are revealed by meeting them, not from across the map',()=>{
 const w=fresh(false),deer=w.wildlife.find(a=>a.species==='deer'&&a.areaId==='landing');
 Object.assign(w.player,{x:deer.x+ENCOUNTER_RANGE+50,y:deer.y});w.areaId='landing';
 for(const a of w.animals)if(a!==deer)a.areaId='elsewhere';
 noteEncounters(w);assert.equal(codexRevealed(w,'deer'),false);
 w.player.x=deer.x+ENCOUNTER_RANGE-20;noteEncounters(w);assert.equal(codexRevealed(w,'deer'),true);
 const smith={id:'village-smith',areaId:'village',x:500,y:500};w.npcs=[smith];w.areaId='village';Object.assign(w.player,{x:520,y:520});
 noteEncounters(w);assert.equal(codexRevealed(w,'blacksmith'),true);
 // A hunted species counts as met even in a journey saved before the index tracked encounters.
 const old=fresh(false);old.hunting.bySpecies.eel=1;assert.equal(codexRevealed(old,'eel'),true);
});

test('story scenes reveal what they mention, while playing and from then on',()=>{
 const w=fresh();
 assert.equal(storyRevealed(w,'shadow-walker'),false);
 w.story.stage='storm';w.story.scene='storm';
 assert.equal(codexRevealed(w,'shadow-walker'),true);assert.equal(codexRevealed(w,'moonfang'),true);assert.equal(codexRevealed(w,'croshelda'),false);
 w.story.scene=null;w.story.stage='ch3-chief';
 for(const id of ['shadow-walker','moonfang','mara','rimejaw','flitlynx','croshelda'])assert.equal(codexRevealed(w,id),true,id);
 for(const id of ['emilia','elk-spirit','drayfus','ocelot','blacksmith'])assert.equal(codexRevealed(w,id),false,id);
 w.story.stage='ch5-morning';
 for(const id of ['emilia','elk-spirit','drayfus'])assert.equal(codexRevealed(w,id),true,id);
 // The talking ocelot only appears in a later chapter of the book, so it stays hidden.
 assert.equal(codexRevealed(w,'ocelot'),false);
});

test('encounters are saved, and older saves without them still load',async()=>{
 const w=fresh(false);w.codex.add('deer');w.codex.add('gardener');
 const save=captureSave(w,'manual',1);assert.deepEqual(save.state.codex,['deer','gardener']);
 const restored=restoreSave(JSON.parse(JSON.stringify(save)));assert.deepEqual([...restored.codex],['deer','gardener']);
 const legacy=JSON.parse(JSON.stringify(save));delete legacy.state.codex;assert.equal(restoreSave(legacy).codex.size,0);
 const bad=JSON.parse(JSON.stringify(save));bad.state.codex=['dragon'];assert.throws(()=>restoreSave(bad),/creature index/);
});
