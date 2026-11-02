import {STORY_EDITS} from './story-edits.js';
// The parts of the main story that can be edited in the atlas without code: each chapter's title and recap, its step
// names in the quest log, the objective line for each stage, and a few counts. The chapters themselves are written in
// code; src/story-edits.js (generated from the atlas) lists only what has been changed on top of that.
// Counts: name, the chapter they belong to, the default, and the range the editor allows.
export const STORY_COUNTS=Object.freeze({
 supperSardines:{chapter:1,label:'Sardines to catch for supper',value:2,min:1,max:10},
 supperDeerMeat:{chapter:1,label:'Deer Meat to bring for supper',value:3,min:1,max:10},
 bucketTrips:{chapter:6,label:'Bucket trips from the well to the trough',value:3,min:1,max:60},
 holdSeconds:{chapter:7,label:'Seconds to hold the squat',value:20,min:5,max:120}
});
const edits=n=>STORY_EDITS.chapters?.[n]||{};
export const storyCount=key=>{const c=STORY_COUNTS[key],v=edits(c.chapter).counts?.[key];return Number.isInteger(v)&&v>=c.min&&v<=c.max?v:c.value;};
// "Chapter 6 · Answer the door." keeps its "Chapter 6 · " and takes the edited rest.
const PREFIX=/^(Chapter \d+(?: complete)?\s*·\s*)/;
export function editedObjective(stage,text){
 if(!text)return text;
 for(const c of Object.values(STORY_EDITS.chapters||{})){const line=c.objectives?.[stage];if(line)return (text.match(PREFIX)?.[1]||'')+line;}
 return text;
}
// A chapter as the quest log shows it, with its edited title, recap and step names (steps are named by their first stage).
export function editedChapter(chapter){
 const e=edits(chapter.n);if(!e.title&&!e.recap&&!e.steps)return chapter;
 return {...chapter,title:e.title||chapter.title,recap:e.recap||chapter.recap,steps:chapter.steps.map(([stages,title])=>[stages,e.steps?.[stages[0]]||title])};
}
