// Public design data only. No player saves, credentials or simulation state.
import {shippedLand} from './land-editor.mjs';
import {toEditor as worldDocuments} from './world-editor.mjs';
import {toEditor as questDocuments,MAX_LEVEL} from './quest-editor.mjs';
import {baseStory} from './story-editor.mjs';
import {WORLD_DATA} from '../src/world-data.js';
import {QUEST_DATA} from '../src/quest-data.js';
import {STORY_EDITS} from '../src/story-edits.js';
import {ANIMAL_TYPES} from '../src/entities.js';
import {ICONS} from '../src/item-icons.js';

export async function editorWorld({commit,meta,builtAt=new Date().toISOString()}) {
 if(!/^[a-f0-9]{40}$/.test(commit))throw Error('World snapshot requires the exact game commit.');
 const land=shippedLand(),story=await baseStory();
 // baseStory deliberately exposes authoring defaults; publish the effective story here.
 for(const c of story.chapters){const e=STORY_EDITS.chapters?.[c.n]||{};
  c.title=e.title||c.title;c.recap=e.recap||c.recap;
  for(const step of c.steps){step.title=e.steps?.[step.id]||step.title;for(const s of step.stages)s.objective=e.objectives?.[s.stage]||s.objective;}
  if(c.end)c.end.objective=e.objectives?.[c.end.stage]||c.end.objective;
  for(const count of c.counts)count.value=e.counts?.[count.id]??count.value;
 }
 const rows={...worldDocuments(WORLD_DATA),land:Object.entries(land.areas).map(([id,def])=>({id,def:JSON.stringify(def)})),quests:questDocuments(QUEST_DATA),
  story:story.chapters.map(c=>({id:`ch${c.n}`,title:c.title,recap:c.recap,steps:Object.fromEntries(c.steps.map(s=>[s.id,s.title])),
   objectives:Object.fromEntries([...c.steps.flatMap(s=>s.stages),...(c.end?[c.end]:[])].filter(s=>s.objective).map(s=>[s.stage,s.objective])),counts:Object.fromEntries(c.counts.map(k=>[k.id,k.value]))}))};
 const collections=Object.fromEntries(Object.entries(rows).map(([col,docs])=>[col,Object.fromEntries(docs.map(d=>[d.id,d]))]));
 const questMeta={maxLevel:MAX_LEVEL,species:Object.entries(ANIMAL_TYPES).filter(([,a])=>!a.boss).map(([id,a])=>({id,name:a.name||id,habitat:a.habitat||'land'})),
  items:Object.entries(ICONS).map(([name,icon])=>({name,icon})),shippedNpcs:WORLD_DATA.npcs.map(n=>n.id)};
 return {format:'the-wilds-deployed-world',version:1,commit,builtAt,collections,land,meta,questMeta,story};
}
