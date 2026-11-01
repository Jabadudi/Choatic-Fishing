// Index entries stay hidden until Eli meets them or the story names them.
// Encounters are saved with the journey; story reveals are read from story progress, so older saves catch up.
import {CHAPTER_TWO_STAGES} from './story.js';
import {CHAPTER_THREE_STAGES} from './chapter3.js';
import {CHAPTER_FOUR_STAGES} from './chapter4.js';
import {CHAPTER_FIVE_STAGES} from './chapter5.js';
import {CHAPTER_SIX_STAGES} from './chapter6.js';
export const CODEX_IDS=Object.freeze(['rabbit','fox','deer','boar','elk','bear','turtle','eel','shadow-walker','croshelda','moonfang','rimejaw','flitlynx','elk-spirit','ocelot','mara','emilia','drayfus','blacksmith','fisher','gardener']);
const STAGES=['arrival','explore','fish','rest','storm','awakening','complete',...CHAPTER_TWO_STAGES,...CHAPTER_THREE_STAGES,...CHAPTER_FOUR_STAGES,...CHAPTER_FIVE_STAGES,...CHAPTER_SIX_STAGES];
// Each scene that introduces entries, and the first stage the story reaches once that scene has played.
export const STORY_REVEALS=Object.freeze([
 {scene:'storm',after:'awakening',ids:['shadow-walker','moonfang']},
 {scene:'awakening',after:'complete',ids:['mara']},
 {scene:'ch3-beasts',after:'ch3-lore',ids:['rimejaw','flitlynx']},
 {scene:'ch3-history',after:'ch3-chief',ids:['croshelda']},
 {scene:'ch4-house',after:'ch4-oscar',ids:['emilia']},
 {scene:'ch4-journey',after:'ch4-complete',ids:['elk-spirit','drayfus']},
 {scene:'ch5-sleep',after:'ch5-morning',ids:['ocelot']}
]);
// World characters whose index entry is revealed by meeting them.
const NPC_ENTRIES={mara:'mara',emilia:'emilia',drayfus:'drayfus',ocelot:'ocelot','village-rimejaw':'rimejaw','village-flitlynx':'flitlynx','village-smith':'blacksmith','village-fisher':'fisher','basket-carrier':'gardener'};
// Roughly the visible half-width of the view around Eli.
export const ENCOUNTER_RANGE=360;
export function storyRevealed(world,id){
 const s=world.story;if(!s)return false;
 const at=STAGES.indexOf(s.stage);
 return STORY_REVEALS.some(r=>r.ids.includes(id)&&(s.scene===r.scene||at>=STAGES.indexOf(r.after)));
}
export const codexRevealed=(world,id)=>!!world.codex?.has(id)||(world.hunting?.bySpecies?.[id]||0)>0||storyRevealed(world,id);
export const revealedCount=world=>CODEX_IDS.filter(id=>codexRevealed(world,id)).length;
// Simulation step: anything alive and close enough in the current area counts as met.
export function noteEncounters(world){
 if(!world.adventure||!world.codex)return;
 const p=world.player,near=e=>e.areaId===world.areaId&&Math.hypot(e.x-p.x,e.y-p.y)<=ENCOUNTER_RANGE;
 for(const a of world.animals)if(a.health>0&&CODEX_IDS.includes(a.species)&&near(a))world.codex.add(a.species);
 for(const n of world.npcs||[]){const id=NPC_ENTRIES[n.id];if(id&&near(n))world.codex.add(id);}
}
export function restoreCodex(data,world){
 world.codex=new Set();if(data===undefined||data===null)return;
 if(!Array.isArray(data)||data.length>CODEX_IDS.length||!data.every(id=>CODEX_IDS.includes(id)))throw Error('Invalid creature index.');
 for(const id of data)world.codex.add(id);
}
