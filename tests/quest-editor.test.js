import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {QUEST_DATA} from '../src/quest-data.js';
import {fromEditor,toEditor,formatQuestData,gameLists} from '../scripts/quest-editor.mjs';
import {World} from '../src/world.js';
import {unlocked,levelReady,lockedLine} from '../src/side-quests.js';

test('the quest editor round-trips the shipped quests without changing a line',async()=>{
 const notes=[],again=fromEditor(toEditor(QUEST_DATA),await gameLists(),notes);
 assert.deepEqual(notes,[]);
 assert.equal(formatQuestData(again),await readFile(new URL('../src/quest-data.js',import.meta.url),'utf8'));
});

test('every shipped quest has a short piece of lore',()=>{
 for(const q of QUEST_DATA)assert.ok(q.lore.length>40&&q.lore.length<=700,q.id);
});

test('quest exports drop what the game cannot use, and switched-off quests stay out of the game',async()=>{
 const docs=toEditor(QUEST_DATA),notes=[];
 docs.push({id:'ghost-job',giver:'nobody',title:'Ghost job',objectives:[{type:'kill',species:'rabbit',count:1}]});
 docs.push({id:'dragon-job',giver:'baker',title:'Dragons',objectives:[{type:'kill',species:'dragon',count:1}]});
 docs.push({id:'later-job',giver:'baker',title:'Later',enabled:false,objectives:[{type:'kill',species:'rabbit',count:1}]});
 docs.push({id:'bread-run',giver:'baker',title:'Bread run',minLevel:400,requires:['later-job','garden-raiders'],objectives:[{type:'collect',item:'Willow Apples',count:500},{type:'collect',item:'Moon Cheese',count:1}],
  rewards:{marks:5,xp:20,items:[{name:'Healing Salve',count:2},{name:'Gold Crown',count:1}]}});
 const out=fromEditor(docs,await gameLists(),notes),ids=out.map(q=>q.id);
 assert.ok(!ids.includes('ghost-job')&&!ids.includes('dragon-job')&&!ids.includes('later-job'));
 const bread=out.find(q=>q.id==='bread-run');
 assert.equal(bread.giverName,'Baker');assert.equal(bread.minLevel,150,'levels are capped at the game’s top level');
 assert.deepEqual(bread.requires,['garden-raiders'],'a chain never waits for a quest that is not in the game');
 assert.deepEqual(bread.objectives,[{type:'collect',item:'Willow Apples',count:99}]);
 assert.deepEqual(bread.rewards.items,[{name:'Healing Salve',count:2}]);
 assert.equal(notes.length,7);
});

test('a villager placed in the editor can give quests once the world editor ships them too',async()=>{
 const docs=[{id:'fen-job',giver:'fen-hermit',title:'Fen job',objectives:[{type:'kill',species:'eel',count:2}]}];
 assert.equal(fromEditor(docs,await gameLists()).length,0);
 assert.equal(fromEditor(docs,await gameLists([{id:'fen-hermit',name:'Hermit'}]))[0].giverName,'Hermit');
});

test('a level-locked quest waits for Eli to reach its level',()=>{
 const w=new World(()=>.5,{adventure:true,story:true}),quest={...QUEST_DATA.find(q=>q.id==='lucky-foot'),minLevel:5};
 assert.equal(levelReady(w,quest),false);assert.equal(unlocked(w,quest),false);
 w.progression.level=5;assert.equal(levelReady(w,quest),true);assert.equal(unlocked(w,quest),true);
 assert.match(lockedLine(quest),/Level 5/);
});
