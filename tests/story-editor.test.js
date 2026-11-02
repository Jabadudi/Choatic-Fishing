import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {baseStory,fromEditor,formatStoryEdits} from '../scripts/story-editor.mjs';
import {STORY_EDITS} from '../src/story-edits.js';
import {editedChapter,editedObjective,storyCount,STORY_COUNTS} from '../src/story-tuning.js';
import {BASE_STORY_CHAPTERS} from '../src/story-quests.js';

test('the shipped story edits are exactly what the editor would write for them',async()=>{
 assert.equal(formatStoryEdits(STORY_EDITS),await readFile(new URL('../src/story-edits.js',import.meta.url),'utf8'));
});

test('the editor sees every chapter with its steps, objective lines and counts',async()=>{
 const base=await baseStory();
 assert.deepEqual(base.chapters.map(c=>c.n),BASE_STORY_CHAPTERS.map(c=>c.n));
 const six=base.chapters.find(c=>c.n===6);
 assert.equal(six.steps.find(s=>s.id==='ch6-door').stages[0].objective,'Mara is pounding on the door. Answer it.');
 assert.equal(six.steps.find(s=>s.id==='ch6-buckets').stages[0].objective,'','the game writes the bucket line itself');
 assert.deepEqual(six.counts.map(k=>k.id),['bucketTrips']);
});

test('only real changes are exported, and counts stay in range',async()=>{
 const notes=[],base=await baseStory();
 const out=fromEditor([{id:'_shared'},{id:'ch6',title:'Resonance',recap:'',steps:{'ch6-door':'Wake up','nope':'x'},objectives:{'ch6-door':'Someone is at the door.','ch6-buckets':'x','ch1-what':'x'},counts:{bucketTrips:500}},{id:'ch99'}],base,notes);
 assert.deepEqual(out,{chapters:{6:{steps:{'ch6-door':'Wake up'},objectives:{'ch6-door':'Someone is at the door.'},counts:{bucketTrips:60}}}});
 assert.equal(notes.length,4);
 assert.match(formatStoryEdits(out),/"ch6-door":"Someone is at the door."/);
});

test('edits reword the quest log and objective lines, keeping the chapter label',()=>{
 const before=STORY_EDITS.chapters;
 try{
  STORY_EDITS.chapters={6:{title:'Blue Writing',steps:{'ch6-door':'Wake up'},objectives:{'ch6-door':'Someone is at the door.'},counts:{bucketTrips:7}}};
  const six=editedChapter(BASE_STORY_CHAPTERS.find(c=>c.n===6));
  assert.equal(six.title,'Blue Writing');assert.equal(six.steps[1][1],'Wake up');
  assert.equal(editedObjective('ch6-door','Chapter 6 · Mara is pounding on the door. Answer it.'),'Chapter 6 · Someone is at the door.');
  assert.equal(storyCount('bucketTrips'),7);
 }finally{STORY_EDITS.chapters=before;}
 assert.equal(storyCount('bucketTrips'),STORY_COUNTS.bucketTrips.value);
});
