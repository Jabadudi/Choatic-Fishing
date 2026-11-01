// The main story as the quest log and the journal drawer read it: which chapter Eli is in, its steps so far, the one
// thing to do now, and where to go for it. Read-only: nothing here changes the story.
import {storyObjective,CABIN,STORY_STAGES} from './story.js';
import {PERIMETER,REST_SPOT} from './chapter7.js';
import {CHIEF_DOOR,CHIEF_HOUSE,MARA_SPOT} from './chief-house.js';
import {GUEST_LODGE,LODGE_DOOR,LODGE_BED} from './guest-lodge.js';
import {TRAINING_GROUND,TRAINING_GATE,DRAYFUS_SPOT,RACK_SPOT,YARD_WELL,TROUGH,CAST_SPOT} from './training-ground.js';

// Each chapter lists its steps in order. A step can cover more than one stage. A chapter can open on the last stage
// of the chapter before it (Chapter 4 starts on the chief's porch, which is still stage ch3-complete), and `end` is the
// stage where every step is done but the next chapter has not started yet.
export const STORY_CHAPTERS=[
 {n:1,title:'The Old Fishing Hut',recap:'Grandpa left Eli a fishing cabin on the Reedwater shore, a box with a strange blue lure in it, and a photograph he can’t stop looking at. Supper first. Then the storm.',
  steps:[[['arrival'],'Find Grandpa’s cabin'],[['explore'],'Look around the cabin'],[['fish'],'Catch and cook supper'],[['rest'],'Rest for the night'],[['storm'],'Survive the storm'],[['awakening'],'A new morning']]},
 {n:2,title:'Shadow Walker',recap:'Something with an axe came out of the storm, and a huge gray wolf came out of nowhere to stop it. Eli woke beside a campfire, next to a girl who isn’t telling him everything.',
  steps:[[['complete','ch2-camp'],'Talk about last night'],[['ch2-cabin'],'Ask about the cabin'],[['ch2-home'],'Ask how to get home'],[['ch2-ready'],'Leave the shore with her'],[['ch2-follow'],'Follow her inland']]},
 {n:3,title:'The Village',recap:'There is no ferry home. The girl is taking Eli inland to Willowback, to someone who might know what Grandpa was mixed up in.',
  steps:[[['ch2-complete'],'Meet her on the inland trail'],[['ch3-chimes'],'The three chimes'],[['ch3-travel'],'Walk to Willowback'],[['ch3-creatures'],'The blacksmith’s guardian'],[['ch3-lore'],'Ask about shadow walkers'],[['ch3-chief'],'Walk to the chief’s house']]},
 {n:4,title:'Region Core',recap:'The chief of Willowback knew Oscar. She also knows what the lure in Eli’s pocket really is, and she isn’t happy about it.',
  steps:[[['ch3-complete'],'Go inside with the girl'],[['ch4-house'],'Meet the chief'],[['ch4-oscar'],'Talk about Grandpa'],[['ch4-world'],'Ask how to get home'],[['ch4-core'],'Show the chief the lure'],[['ch4-journey'],'Ask about the road ahead'],[['ch4-complete'],'Go to the guest lodge with Mara']]},
 {n:5,title:'Sunrise',recap:'Eli has a room in the guest lodge, a waterskin, and training with Drayfus at sunrise. Mara says that is all he needs tonight.',
  steps:[[['ch5-tour'],'Tour the guest lodge'],[['ch5-night'],'Get ready for the night'],[['ch5-sleep'],'Sleep']]},
 {n:6,title:'Resonance',recap:'Eli swallowed the Region Core. Now there is blue writing in the air, a talking ocelot only he can see, and a swordsman waiting at the training ground.',
  steps:[[['ch5-morning'],'Read the writing in the air'],[['ch6-door'],'Answer the door'],[['ch6-circle'],'Find the training ground'],[['ch6-spar'],'Spar with Drayfus'],[['ch6-confession'],'Tell them about last night'],[['ch6-rack'],'Choose a weapon'],[['ch6-cast'],'Cast at the sword'],[['ch6-buckets'],'Carry the buckets'],[['ch6-night'],'Rest']],end:'ch6-complete'},
 {n:7,title:'Legs',recap:'Drayfus doesn’t knock. He gave Eli until sunrise to run the path around Willowback, and he’ll be up in the watchtower, watching his shoulders.',
  steps:[[['ch7-run'],'The dawn run'],[['ch7-breakfast'],'Breakfast with Mara'],[['ch7-squat'],'Report to Drayfus'],[['ch7-hold'],'Hold the squat'],[['ch7-laps'],'The slow lap'],[['ch7-rest'],'Rest on the grass']],end:'ch7-complete'}
];
const chapterOf=stage=>STORY_CHAPTERS.find(c=>c.end===stage||c.steps.some(([stages])=>stages.includes(stage)));
// Every story stage belongs to exactly one chapter; the tests hold this as chapters are added.
export const unplacedStages=()=>STORY_STAGES.filter(stage=>!chapterOf(stage));

// Interiors are entered from the village, so from outside the target is the door.
const DOORS={[GUEST_LODGE.id]:{...LODGE_DOOR,label:'the guest lodge door'},[CHIEF_HOUSE.id]:{...CHIEF_DOOR,label:'the chief’s house door'},[TRAINING_GROUND.id]:{...TRAINING_GATE,label:'the training ground gate, north of the chief’s house'}};
const AREA_NAMES={landing:'Reedwater Landing',cabin:'Grandpa’s cabin',windchime:'Windchime Path',crossroads:'Willowbank Crossroads',village:'Willowback Village',[CHIEF_HOUSE.id]:'the chief’s house',[GUEST_LODGE.id]:'the guest lodge',[TRAINING_GROUND.id]:'the training ground'};
export const areaLabel=id=>AREA_NAMES[id]||id;
const at=(areaId,spot,label,short)=>({areaId,x:spot.x,y:spot.y,label,...(short?{short}:{})});
// Where the current step happens, before it is turned into a door for players who are outside.
function rawTarget(world){
 const s=world.story;if(!s)return null;
 const guide=s.guide?.areaId?at(s.guide.areaId,s.guide,s.stage.startsWith('ch3')||s.stage.startsWith('ch2')||s.stage==='complete'?'the girl':'Mara'):null;
 switch(s.stage){
  case 'arrival':return at('landing',{x:CABIN.x,y:CABIN.bottom+20},'Grandpa’s cabin');
  case 'ch5-night':case 'ch5-sleep':case 'ch6-night':case 'ch6-complete':return at(GUEST_LODGE.id,LODGE_BED,'the bed in your room');
  case 'ch6-door':return at(GUEST_LODGE.id,{x:316,y:330},'the door of your room');
  case 'ch6-circle':case 'ch6-spar':case 'ch6-confession':case 'ch7-squat':case 'ch7-hold':return at(TRAINING_GROUND.id,DRAYFUS_SPOT,'Drayfus, in the training circle');
  case 'ch6-rack':return at(TRAINING_GROUND.id,RACK_SPOT,'the weapon rack');
  case 'ch6-cast':return at(TRAINING_GROUND.id,CAST_SPOT,'the edge of the circle');
  case 'ch6-buckets':return s.carrying?at(TRAINING_GROUND.id,TROUGH,'the trough'):at(TRAINING_GROUND.id,YARD_WELL,'the yard well');
  case 'ch7-run':case 'ch7-laps':{const post=PERIMETER[Math.min(s.run||0,PERIMETER.length-1)];return at('village',post,`the guard post at ${post.place}`,post.place);}
  case 'ch7-breakfast':return at(CHIEF_HOUSE.id,MARA_SPOT,'Mara, in the chief’s kitchen');
  case 'ch7-rest':return at('village',REST_SPOT,'the grass beside the guest lodge');
  case 'awakening':case 'ch5-morning':case 'ch7-complete':case 'storm':return null;
  default:return guide;
 }
}
const COMPASS=['east','south-east','south','south-west','west','north-west','north','north-east'];
// The next place to go, as seen from where Eli stands: the spot itself, or the door to the building it is in.
export function storyTarget(world){
 const target=rawTarget(world);if(!target)return null;
 let goal=target;
 if(world.areaId!==target.areaId&&world.areaId==='village'&&DOORS[target.areaId])goal={areaId:'village',...DOORS[target.areaId],inside:target};
 const here=world.areaId===goal.areaId,p=world.player;
 if(!here)return {...goal,here:false,where:areaLabel(goal.areaId)};
 const dx=goal.x-p.x,dy=goal.y-p.y,dist=Math.hypot(dx,dy);
 const dir=COMPASS[(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
 return {...goal,here:true,dist,dir,paces:Math.max(1,Math.round(dist/4/5)*5)};
}
// "(3/8)" or "(7/20 seconds)" at the end of an objective becomes a progress bar.
const PROGRESS=/\s*\((\d+)\s*\/\s*(\d+)([^)]*)\)\s*\.?\s*$/;
export function storyJournal(world){
 const s=world.story;if(!s)return null;
 const chapter=chapterOf(s.stage);if(!chapter)return null;
 const objective=storyObjective(world)||'';
 let body=objective.replace(/^Chapter \d+( complete)?\s*·\s*/,'');
 const match=body.match(PROGRESS);let progress=null;
 if(match){progress={have:+match[1],total:+match[2],unit:match[3].trim()};body=body.replace(PROGRESS,'.').replace(/\.\.$/,'.');}
 const index=chapter.steps.findIndex(([stages])=>stages.includes(s.stage)),finished=chapter.end===s.stage;
 const steps=chapter.steps.map(([,title],i)=>({title,state:finished||i<index?'done':i===index?'current':'locked'})).filter(step=>step.state!=='locked');
 const current=steps.find(step=>step.state==='current');
 return {
  number:chapter.n,title:chapter.title,recap:chapter.recap,finished,
  now:{title:finished?`Chapter ${chapter.n} complete`:current?.title||'',body,progress},
  steps,more:!finished&&index<chapter.steps.length-1,
  past:STORY_CHAPTERS.filter(c=>c.n<chapter.n).reverse().map(c=>({number:c.n,title:c.title})),
  target:storyTarget(world)
 };
}
// One line for the HUD tracker: the step, its count and where to go, short enough not to cover the screen.
// short is the tracker's wording ("the west lanes"); the log spells it out ("the guard post at the west lanes").
export const targetHint=(target,short=false)=>{if(!target)return '';const name=short&&target.short||target.label;return target.here?`${name}, ${target.paces} paces ${target.dir}`:`${name}, in ${target.where}`;};
export function trackerLine(journal){
 if(!journal)return null;
 const {now,target}=journal;
 if(journal.finished)return `Chapter ${journal.number} complete · ${now.body}`;
 const count=now.progress?` (${now.progress.have}/${now.progress.total})`:'';
 return `Chapter ${journal.number} · ${now.title}${count}${target?`. Next: ${targetHint(target,true)}.`:'.'}`;
}
