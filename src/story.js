import {CHAPTER_THREE_STAGES,chapterThree,CHAPTER3_SCENES,CHAPTER3_OBJECTIVES,CHAPTER3_ROUTES,CHAPTER3_ENTRIES,TRAVEL_AREAS,CREATURE_ROUTE,CHIEF_ROUTE,chapter3Route} from './chapter3.js';
import {CHAPTER_FOUR_STAGES,chapterFour,CHAPTER4_SCENES,CHAPTER4_OBJECTIVES,CHAPTER4_SEQUENCE} from './chapter4.js';
import {CHAPTER1_SCENES,CHAPTER2_SCENES} from './chapter1.js';
import {CHAPTER_FIVE_STAGES,chapterFive,CHAPTER5_SCENES,CHAPTER5_OBJECTIVES,CHAPTER5_MARA_GREETING} from './chapter5.js';
import {CHIEF_DOOR,CHIEF_HOUSE,EMILIA_SPOT,MARA_SPOT} from './chief-house.js';
import {CHAPTER_SIX_STAGES,chapterSix,CHAPTER6_SCENES,CHAPTER6_OBJECTIVES,BUCKET_TRIPS,BUCKET_NOTES,bucketObjective} from './chapter6.js';
import {CHAPTER_SEVEN_STAGES,chapterSeven,CHAPTER7_SCENES,CHAPTER7_OBJECTIVES,PERIMETER,TOWER_PLATFORM,HOLD_SECONDS,REST_SPOT,runObjective,holdObjective,POST_LINES,IDLE_NAG,HOLD_NOTES,HOLD_RESET} from './chapter7.js';
import {TRAINING_GROUND,TRAINING_GATE,DRAYFUS_SPOT,TRAINING_EMILIA_SPOT,FENCE_MARA_SPOT,RACK_SPOT,YARD_WELL,TROUGH,CAST_SPOT} from './training-ground.js';
import {GUEST_LODGE,LODGE_DOOR,LODGE_MARA_SPOT,LODGE_MORNING_SPOT,LODGE_BED,LODGE_STOOL,LODGE_WINDOW,LODGE_POT,LODGE_WAKE_SPOT} from './guest-lodge.js';
import {createVillageResidents,updateVillageResidents} from './village-life.js';
import {createNpcs} from './npcs.js';
import {NPC_TYPES} from './entities.js';
import {practise} from './skills.js';
export const COOKING_XP=40;
// Fishing XP for line-casting the sword out of Drayfus's hand.
export const DISARM_XP=30;
// Saved narrative milestones. Simulation owns changes; artwork only reads them.
export const CABIN={x:1630,y:1510,left:1490,right:1760,top:1320,bottom:1515};
export const CAMP={x:1810,y:1640};
export const GUIDE_ROUTE=[{x:1770,y:1580},{x:1630,y:1555},{x:1510,y:1570},{x:1400,y:1600},{x:1400,y:1500},{x:1390,y:1420}];
export const CHAPTER_TWO_STAGES=['ch2-camp','ch2-cabin','ch2-home','ch2-ready','ch2-follow','ch2-complete'];
export const chapterTwo=story=>!!story&&CHAPTER_TWO_STAGES.includes(story.stage);
// Chapters 3 to 7 share the village guide: she walks in Chapter 3 and stands at fixed places from Chapter 4 on.
const villageStory=s=>chapterThree(s)||chapterFour(s)||chapterFive(s)||chapterSix(s)||chapterSeven(s);
// Chapter 6 on: Eli lives in the guest lodge and trains with Drayfus.
const training=s=>chapterSix(s)||chapterSeven(s);
// Each Chapter 5 stage keeps Mara at one place: in Eli's room for the tour, home overnight, outside his door at sunrise.
const CHAPTER5_GUIDE={'ch5-tour':{...LODGE_MARA_SPOT,areaId:GUEST_LODGE.id},'ch5-night':{...MARA_SPOT,areaId:CHIEF_HOUSE.id},'ch5-sleep':{...MARA_SPOT,areaId:CHIEF_HOUSE.id},'ch5-morning':{...LODGE_MORNING_SPOT,areaId:'village'}};
const chapterFiveGuide=stage=>({...CHAPTER5_GUIDE[stage],waypoint:0});
// Chapter 6: Mara in Eli's doorway, then on the training-ground fence all day, then home for the night.
const LODGE_DOORWAY={x:316,y:330},AT_FENCE={...FENCE_MARA_SPOT,areaId:TRAINING_GROUND.id},HOME={...MARA_SPOT,areaId:CHIEF_HOUSE.id};
const CHAPTER6_GUIDE={'ch6-door':{...LODGE_DOORWAY,areaId:GUEST_LODGE.id},'ch6-circle':AT_FENCE,'ch6-spar':AT_FENCE,'ch6-confession':AT_FENCE,'ch6-rack':AT_FENCE,'ch6-cast':AT_FENCE,'ch6-buckets':AT_FENCE,'ch6-night':HOME,'ch6-complete':HOME};
const chapterSixGuide=stage=>({...CHAPTER6_GUIDE[stage],waypoint:0});
// Chapter 7: Mara is home while Eli runs, in the kitchen at breakfast, on the fence during training, then out on the grass behind the lodge.
const CHAPTER7_GUIDE={'ch7-run':HOME,'ch7-breakfast':HOME,'ch7-squat':AT_FENCE,'ch7-hold':AT_FENCE,'ch7-laps':AT_FENCE,'ch7-rest':{x:REST_SPOT.x-40,y:REST_SPOT.y,areaId:'village'},'ch7-complete':HOME};
const chapterSevenGuide=stage=>({...CHAPTER7_GUIDE[stage],waypoint:0});
const storyGuide=stage=>CHAPTER7_GUIDE[stage]?chapterSevenGuide(stage):chapterSixGuide(stage);
// The training day: Drayfus, Emilia and Mara are out in the yard from Eli's arrival to the last bucket.
const TRAINING_DAY=['ch6-circle','ch6-spar','ch6-confession','ch6-rack','ch6-cast','ch6-buckets'];
// Where the ocelot sits: the corner by the stool in the morning, on the stool at night.
// The ocelot's dissolve takes 8 frames at 6 a second.
const VANISH_TIME=1.4;
export const OCELOT_CORNER={x:340,y:170},OCELOT_STOOL={x:196,y:146};
export const inlandUnlocked=story=>!story||(story.stage==='ch2-complete'||villageStory(story));
export const SCENES={...CHAPTER1_SCENES,...CHAPTER2_SCENES,...CHAPTER3_SCENES,...CHAPTER4_SCENES,...CHAPTER5_SCENES,...CHAPTER6_SCENES,...CHAPTER7_SCENES};
// Save version 4 stored one page per story beat. Each beat now opens on its first spoken line.
export const LURE='Mysterious Lure',REGION_CORE='Region Core';
export const pageForBeat=(scene,beat)=>SCENES[scene]?.findIndex(p=>p.beat===beat)??-1;
export const createStory=()=>({stage:'arrival',lureSeen:false,photoSeen:false,scene:'arrival',page:0,guide:null,rod:false,bow:false,coreIngested:false,callAwakened:false});
// Chapter 1 supper: two Sardines from the dock, then three Deer Meat from the meadow, all cooked at the stove.
export const SUPPER=Object.freeze({Sardine:2,'Deer Meat':3});
export const RACK={x:320,y:96};
const PRE_STORM=['arrival','explore','fish'];
export const rodReady=story=>!story||story.rod!==false;
const carried=(w,name)=>w.inventory.countOf(name);
export const bowAvailable=w=>w.story?.stage==='fish'&&w.story.rod&&carried(w,'Sardine')>=SUPPER.Sardine;
export function supperObjective(w){
 const s=w.story,fish=Math.min(SUPPER.Sardine,carried(w,'Sardine')),meat=Math.min(SUPPER['Deer Meat'],carried(w,'Deer Meat'));
 if(!s.rod)return 'Chapter 1 · Take Grandpa’s fishing rod from the weapon rack in the cabin.';
 if(!s.bow&&fish<SUPPER.Sardine)return `Chapter 1 · Fish 2 Sardines from the dock (${fish}/2).`;
 if(!s.bow)return 'Chapter 1 · Take the hunting bow from the weapon rack in the cabin.';
 if(fish<SUPPER.Sardine||meat<SUPPER['Deer Meat'])return `Chapter 1 · Hunt deer in the meadow and collect 3 Deer Meat (${meat}/3)${fish<SUPPER.Sardine?` · Sardines ${fish}/2`:''}.`;
 return 'Chapter 1 · Bring 2 Sardines and 3 Deer Meat to the cabin stove and cook dinner.';
}
export const cabinDamaged=story=>!!story&&((story.stage==='storm'&&story.scene==='storm'&&story.page>=SCENES.storm.findIndex(p=>p.action==='escape'))||['awakening','complete'].includes(story.stage)||chapterTwo(story)||villageStory(story));
export const chapterHeading=scene=>scene?.startsWith('ch7-')?'CHAPTER 7 · LEGS':scene?.startsWith('ch6-')?'CHAPTER 6 · RESONANCE':scene?.startsWith('ch5-')?'CHAPTER 5 · SUNRISE':scene?.startsWith('ch4-')?'CHAPTER 4 · REGION CORE':scene?.startsWith('ch3-')?'CHAPTER 3 · THE VILLAGE':scene?.startsWith('ch2-')?'CHAPTER 2 · SHADOW WALKER':'CHAPTER 1 · THE OLD FISHING HUT';
export const pendingScene=world=>world?.story?.scene?SCENES[world.story.scene]?.[world.story.page]:null;
export const currentScene=world=>world?.storySuspended?null:pendingScene(world);
export function storyObjective(world){
 const s=world.story;if(!s)return null;
 if(villageStory(s)&&s.stage!=='ch4-complete'&&!chapterFive(s)&&!training(s)&&s.guide?.areaId!==world.areaId){const names={landing:'Reedwater Landing',windchime:'Windchime Path',crossroads:'Willowbank Crossroads',village:'Willowback Village','chief-house':'the chief’s house'};return `Chapter ${chapterFour(s)?4:3} · ${chapterFour(s)?'Mara':'Your guide'} is waiting in ${names[s.guide.areaId]}. Return to her to continue.`;}
 if(s.stage==='fish')return supperObjective(world);
 if(s.stage==='ch6-buckets')return bucketObjective(s.buckets||0,!!s.carrying);
 if(['ch7-run','ch7-laps'].includes(s.stage))return runObjective(s.stage,s.run||0);
 if(s.stage==='ch7-hold')return holdObjective(s.hold||0);
 return ({...CHAPTER3_OBJECTIVES,...CHAPTER4_OBJECTIVES,...CHAPTER5_OBJECTIVES,...CHAPTER6_OBJECTIVES,...CHAPTER7_OBJECTIVES,arrival:'Chapter 1 · Follow the path to Grandpa’s cabin.',explore:'Chapter 1 · Examine the lure box and the photograph inside the cabin.',rest:'Chapter 1 · When you are ready, rest in the cabin bed.',storm:'Chapter 1 · Survive the storm.',awakening:'Chapter 1 · A new morning.',complete:'Chapter 2 · Talk to the girl beside the campfire at Reedwater Landing.',
 'ch2-camp':'Chapter 2 · Talk with your rescuer about last night.',
 'ch2-cabin':'Chapter 2 · Ask the girl about the cabin. You can examine the ruins and dock first.',
 'ch2-home':'Chapter 2 · Ask the girl how to get home.',
 'ch2-ready':'Chapter 2 · Talk to the girl when you are ready to leave the shore.',
 'ch2-follow':'Chapter 2 · Follow the girl toward the inland trail. She waits if you fall behind.',
 'ch2-complete':'Chapter 3 · Return to the girl on the inland trail at Reedwater Landing. Talk when you are ready to visit the village.'})[s.stage];
}
export function storyPrompt(w){
 if(!w.story)return null;
 if(w.storySuspended&&pendingScene(w))return 'Resume conversation';
 if(currentScene(w))return null;
 const p=w.player,near=(x,y,r=90)=>Math.hypot(p.x-x,p.y-y)<r;
 const girl=w.npcs.find(n=>n.id==='mara'&&n.areaId===w.areaId);
 if(girl&&near(girl.x,girl.y,NPC_TYPES.mara.talkRange)){
  const prompt={complete:'Talk about last night','ch2-camp':'Talk about last night','ch2-cabin':'Ask about the cabin','ch2-home':'Ask how to get home','ch2-ready':'Leave with the girl','ch2-complete':'Continue toward the village','ch3-lore':'Ask about shadow walkers','ch3-complete':'Go inside with the girl',...Object.fromEntries(CHAPTER4_SEQUENCE.map(stage=>[stage,'Continue the meeting'])),'ch4-complete':'Go to the guest lodge','ch5-tour':'Continue the tour','ch6-door':'Answer the door','ch7-breakfast':'Have breakfast with Mara'}[w.story.stage];
  if(prompt)return prompt;
 }
 if(w.areaId==='village'&&(chapterFour(w.story)||chapterFive(w.story)||training(w.story))&&near(CHIEF_DOOR.x,CHIEF_DOOR.y+20,70))return 'Enter the chief’s house';
 if(w.areaId==='village'&&w.story.stage==='ch7-rest'&&near(REST_SPOT.x,REST_SPOT.y,60))return 'Lie down on the grass';
 if(w.areaId==='village'&&(chapterFive(w.story)||training(w.story))&&near(LODGE_DOOR.x,LODGE_DOOR.y+20,70))return 'Enter the guest lodge';
 if(w.areaId==='village'&&trainingOpen(w.story)&&near(TRAINING_GATE.x,TRAINING_GATE.y,70))return 'Go to the training ground';
 if(w.areaId===TRAINING_GROUND.id&&training(w.story)){const t=trainingPrompt(w,near);if(t)return t;}
 // The writing hangs in front of Eli wherever he stands in the room, until he reads it.
 if(w.areaId===GUEST_LODGE.id&&w.story.stage==='ch5-morning')return 'Read the floating writing';
 if(w.areaId===GUEST_LODGE.id&&(chapterFive(w.story)||training(w.story))){
  if(near(LODGE_STOOL.x,LODGE_STOOL.y+34,36))return 'Examine the waterskin';
  if(near(LODGE_BED.x+76,LODGE_BED.y+30,50))return ['ch5-night','ch5-sleep','ch6-complete'].includes(w.story.stage)?'Go to sleep':'Examine the bed';
  if(near(LODGE_WINDOW.x,LODGE_WINDOW.y+22,60))return 'Look out the window';
  if(near(LODGE_POT.x-36,LODGE_POT.y,50))return 'Examine the chamber pot';
 }
 if(w.areaId==='village'&&w.story.stage==='ch3-creatures'&&w.story.guide?.waypoint>=CREATURE_ROUTE.length&&near(1220,490,125))return 'Examine the frost-scaled guardian';
 if(w.areaId==='landing'){
  if(near(CABIN.x,CABIN.y+35,115))return cabinDamaged(w.story)?'Examine the damaged cabin':'Enter Grandpa’s cabin';
  if(cabinDamaged(w.story)&&near(1250,1810,115))return 'Look for a way off the shore';
  if(cabinDamaged(w.story)&&near(CAMP.x,CAMP.y,100)&&!near(1850,1640,95))return 'Remember the morning';
 }else if(w.areaId==='cabin'){
  if(PRE_STORM.includes(w.story.stage)&&near(RACK.x,RACK.y,62))return !w.story.rod?'Take Grandpa’s fishing rod':!w.story.bow&&bowAvailable(w)?'Take the hunting bow':'Examine the weapon rack';
  if(near(520,145))return 'Examine the lure box';
  if(near(110,270))return 'Examine the photograph';
  if(near(100,120))return w.story.stage==='rest'?'Dinner is finished':'Cook dinner';
  if(near(510,330))return 'Rest until night';
 }
 return null;
}
// From the moment Mara takes him there, the training ground stays open.
export const trainingOpen=story=>!!story&&STORY_STAGES.indexOf(story.stage)>=STORY_STAGES.indexOf('ch6-circle');
function trainingPrompt(w,near){
 const s=w.story,d=w.npcs.find(n=>n.id==='drayfus'&&n.areaId===w.areaId);
 const byDrayfus=d&&near(d.x,d.y,NPC_TYPES.mara.talkRange);
 if(byDrayfus&&s.stage==='ch6-circle')return 'Meet Drayfus';
 if(byDrayfus&&s.stage==='ch6-spar')return 'Spar with Drayfus';
 if(byDrayfus&&s.stage==='ch6-confession')return 'Continue the conversation';
 if(s.stage==='ch6-rack'&&near(RACK_SPOT.x,RACK_SPOT.y+40,70))return 'Choose a weapon';
 if(s.stage==='ch6-cast'&&near(CAST_SPOT.x,CAST_SPOT.y,60))return 'Cast at the sword';
 if(byDrayfus&&s.stage==='ch7-squat')return 'Report to Drayfus';
 if(s.stage==='ch6-buckets'){
  if(!s.carrying&&near(YARD_WELL.x,YARD_WELL.y+30,70))return 'Fill the buckets';
  if(s.carrying&&near(TROUGH.x,TROUGH.y-30,80))return 'Empty the buckets into the trough';
 }
 return null;
}
// Full buckets slow Eli down, and they get heavier as the trips add up.
export const storySpeed=w=>{const s=w.story;if(s?.stage==='ch7-laps')return Math.max(.6,.85-(s.run||0)*.03);return s?.stage==='ch6-buckets'&&s.carrying?Math.max(.55,.8-(s.buckets||0)*.006):1;};
// Swallowing the core empties the lure's place in the backpack.
export function ingestCore(w){
 w.story.coreIngested=true;
 for(const item of [...w.inventory.allItems])if([LURE,REGION_CORE].includes(item.name))w.inventory.removeId(item.id,Infinity);
}
function show(w,scene){w.storySuspended=false;w.cancel();w.player.vx=0;w.player.vy=0;w.player.dashRemaining=0;w.dialogue=null;w.story.scene=scene;w.story.page=0;}
export function inspectStory(w){
 const prompt=storyPrompt(w);if(!prompt)return false;
 const s=w.story;
 if(prompt==='Resume conversation'){w.storySuspended=false;return true;}
 if(prompt==='Continue toward the village'){show(w,'ch3-start');return true;}
 if(prompt==='Go inside with the girl'){
  s.stage='ch4-house';s.guide={...MARA_SPOT,areaId:CHIEF_HOUSE.id,waypoint:0};w.cancel();w.areaId=CHIEF_HOUSE.id;Object.assign(w.player,CHIEF_HOUSE.spawn);
  w.npcs=createStoryNpcs(s,w.elapsed);show(w,'ch4-house');return true;
 }
 if(prompt==='Enter the chief’s house'){w.cancel();w.areaId=CHIEF_HOUSE.id;Object.assign(w.player,CHIEF_HOUSE.spawn);w.message='Woodsmoke and herbs. The fire is still going.';return true;}
 if(prompt==='Continue the meeting'){show(w,s.stage);return true;}
 if(prompt==='Go to the guest lodge'){
  s.stage='ch5-tour';s.guide=chapterFiveGuide('ch5-tour');w.cancel();w.areaId=GUEST_LODGE.id;Object.assign(w.player,GUEST_LODGE.spawn);
  w.npcs=createStoryNpcs(s,w.elapsed);show(w,'ch5-tour');return true;
 }
 if(prompt==='Continue the tour'){show(w,'ch5-tour');return true;}
 if(prompt==='Enter the guest lodge'){w.cancel();w.areaId=GUEST_LODGE.id;Object.assign(w.player,GUEST_LODGE.spawn);w.message=s.stage==='ch5-morning'?'Sunlight through warped glass. The blanket is still on the floor, and blue writing hangs in the air.':'Eli’s room. Small, plain and quiet.';return true;}
 if(prompt==='Read the floating writing'){show(w,'ch6-wake');return true;}
 if(prompt==='Answer the door'){show(w,'ch6-door');return true;}
 if(prompt==='Go to the training ground'){w.cancel();w.areaId=TRAINING_GROUND.id;Object.assign(w.player,TRAINING_GROUND.spawn,{vx:0,vy:0});w.message=s.stage==='ch6-circle'?'Packed dirt, split-log fences and a man with a very large sword.':'The training ground. The dummies have not recovered.';return true;}
 if(prompt==='Have breakfast with Mara'){show(w,'ch7-breakfast');return true;}
 if(prompt==='Report to Drayfus'){show(w,'ch7-stance');return true;}
 if(prompt==='Lie down on the grass'){Object.assign(w.player,REST_SPOT,{vx:0,vy:0});show(w,'ch7-grass');return true;}
 if(prompt==='Meet Drayfus'){show(w,'ch6-drayfus');return true;}
 if(prompt==='Spar with Drayfus'){show(w,'ch6-spar');return true;}
 if(prompt==='Continue the conversation'){show(w,'ch6-confession');return true;}
 if(prompt==='Choose a weapon'){show(w,'ch6-rod');return true;}
 if(prompt==='Cast at the sword'){Object.assign(w.player,CAST_SPOT,{vx:0,vy:0,facing:'up'});show(w,'ch6-cast');return true;}
 if(prompt==='Fill the buckets'){s.carrying=true;w.message=bucketObjective(s.buckets,true);return true;}
 if(prompt==='Empty the buckets into the trough'){
  s.carrying=false;s.buckets++;
  if(s.buckets>=BUCKET_TRIPS){show(w,'ch6-forty');return true;}
  w.message=BUCKET_NOTES[s.buckets]||bucketObjective(s.buckets,false);return true;
 }
 if(prompt==='Go to sleep'){if(s.stage==='ch6-complete'){show(w,'ch7-up');return true;}s.stage='ch5-sleep';show(w,'ch5-sleep');return true;}
 if(prompt==='Examine the bed'){w.message=['ch6-night','ch6-complete'].includes(s.stage)?'Every part of Eli hurts. The bed has never looked better.':'The blanket is still on the floor where Eli woke up.';return true;}
 if(prompt==='Examine the waterskin'){w.message='Mara’s leather waterskin. “This is all you need for tonight.”';return true;}
 if(prompt==='Look out the window'){w.message=s.stage==='ch5-morning'?'Sunrise over Willowback. Mara is pacing outside the door.':'Real glass, slightly warped. The sky outside has gone from gold to violet to black.';return true;}
 if(prompt==='Examine the chamber pot'){w.message='The chamber pot looks back. A problem for future Eli.';return true;}
 if(prompt==='Examine the frost-scaled guardian'){show(w,'ch3-beasts');return true;}
 if(prompt==='Ask about shadow walkers'){show(w,'ch3-history');return true;}
 if(prompt==='Talk about last night'){s.stage='ch2-camp';show(w,'ch2-shadow');return true;}
 if(prompt==='Ask about the cabin'){show(w,'ch2-cabin');return true;}
 if(prompt==='Ask how to get home'){show(w,'ch2-island');return true;}
 if(prompt==='Leave with the girl'){show(w,'ch2-departure');return true;}
 if(prompt==='Enter Grandpa’s cabin'){w.cancel();w.areaId='cabin';Object.assign(w.player,{x:320,y:395});if(s.stage==='arrival')s.stage='explore';w.message='A swept floor. Clean windows. Someone has been here.';}
 else if(prompt==='Examine the damaged cabin')w.message=chapterTwo(s)?'Grandpa’s cabin. A whole corner of the roof is gone; the wall leans over blackened beams. The girl looks at it as if it means something to her, too.':'A corner of the roof is gone. Blackened beams and a leaning wall are all that remain of Eli’s first night here.';
 else if(prompt==='Look for a way off the shore')w.message=(['ch2-ready','ch2-follow','ch2-complete'].includes(s.stage)||chapterThree(s))?'Empty water stretches into the mist. “This is no island.” The captain’s number is still on Eli’s hand, but his phone has no service.':'The captain’s boat is gone. No pickup arranged. No phone service. Eli promised Shylee a text—and he still hasn’t sent it.';
 else if(prompt==='Remember the morning')show(w,'awakening');
 else if(prompt==='Take Grandpa’s fishing rod'){s.rod=true;w.inventory.equip(1);show(w,'rack-rod');}
 else if(prompt==='Take the hunting bow'){
  s.bow=true;
  if(!w.inventory.allItems.some(i=>i.name==='Hunting Bow')){
   w.inventory.receive({name:'Hunting Bow',category:'weapons',description:'Grandpa’s recurve bow. Its quiver never seems to run dry. 22 damage per arrow.'});
   const bow=w.inventory.allItems.at(-1),slot=w.inventory.slots.indexOf(null);
   if(slot>=0){w.inventory.assignHotbar(bow.id,slot+2);w.inventory.equip(slot+2);}
  }
  show(w,'rack-bow');
 }
 else if(prompt==='Examine the weapon rack')w.message=s.bow?'Empty pegs where the rod and bow hung. A spare rod still waits for someone else.':s.stage==='fish'?'An old recurve bow hangs on the rack. Supper starts with two Sardines from the dock.':'Two fishing rods and an old recurve bow. Grandpa kept everything oiled and ready.';
 else if(prompt==='Examine the lure box')show(w,'lure');
 else if(prompt==='Examine the photograph')show(w,'photo');
 else if(prompt==='Cook dinner'){
  const missing=Object.entries(SUPPER).filter(([name,count])=>carried(w,name)<count);
  if(s.stage!=='fish')w.message='Look around the cabin before settling in for the evening.';
  else if(missing.length)w.message=`Not enough for supper yet. Still needed: ${missing.map(([name,count])=>`${count-carried(w,name)} ${name}${name==='Sardine'&&count-carried(w,name)>1?'s':''}`).join(', ')}.`;
  else{
   for(const [name,count] of Object.entries(SUPPER))w.inventory.removeName(name,count);
   practise(w,w.player,'cooking',COOKING_XP);show(w,'dinner');
  }
 }else if(prompt==='Rest until night'){
  if(s.stage==='rest'){s.stage='storm';show(w,'storm');}
  else w.message='There is still time to explore, fish, and make dinner before bed.';
 }else w.message='The photograph rests beside the salt shaker. Dinner is finished.';
 return true;
}
export function advanceStory(w){
 const s=w.story;if(!currentScene(w))return false;
 if(s.page+1<SCENES[s.scene].length){s.page++;return true;}
 const scene=s.scene;s.scene=null;s.page=0;
 if(scene==='lure')s.lureSeen=true;
 if(scene==='photo')s.photoSeen=true;
 if(['arrival','explore'].includes(s.stage)&&s.lureSeen&&s.photoSeen)s.stage='fish';
 if(scene==='dinner')s.stage='rest';
 if(scene==='storm'){
  s.stage='awakening';w.areaId='landing';Object.assign(w.player,{x:1770,y:1660,vx:0,vy:0});
  w.npcs=createStoryNpcs(s);
  if(!w.inventory.allItems.some(i=>[LURE,REGION_CORE].includes(i.name)))w.inventory.receive({name:'Mysterious Lure',category:'quest-items',description:'Warm blue amber. Its light follows your heartbeat.'});
  show(w,'awakening');
 }
 if(scene==='awakening'&&s.stage==='awakening')s.stage='complete';
 if(scene==='ch2-shadow')s.stage='ch2-cabin';
 if(scene==='ch2-cabin')s.stage='ch2-home';
 if(scene==='ch2-island')s.stage='ch2-ready';
 if(scene==='ch2-departure'){
  s.stage='ch2-follow';const girl=w.npcs.find(n=>n.id==='mara');
  s.guide={x:girl?.x??1850,y:girl?.y??1640,waypoint:0,areaId:'landing'};
  w.npcs=createStoryNpcs(s);
 }
 if(scene==='ch2-end'){s.stage='ch2-complete';w.npcs=createStoryNpcs(s);}
 if(scene==='ch3-start'){s.stage='ch3-chimes';s.guide={...CHAPTER3_ENTRIES.landing,areaId:'landing',waypoint:0};w.npcs=createStoryNpcs(s,w.elapsed);}
 if(scene==='ch3-chimes')s.stage='ch3-travel';
 if(scene==='ch3-arrival'){s.stage='ch3-creatures';s.guide={x:1290,y:580,areaId:'village',waypoint:0};w.npcs=createStoryNpcs(s,w.elapsed);}
 if(scene==='ch3-beasts')s.stage='ch3-lore';
 if(scene==='ch3-history'){s.stage='ch3-chief';s.guide={x:s.guide.x,y:s.guide.y,areaId:'village',waypoint:0};}
 if(scene==='ch3-end'){s.stage='ch3-complete';w.npcs=createStoryNpcs(s,w.elapsed);}
 // The meeting carries straight on; each finished scene is a checkpoint.
 const meeting=CHAPTER4_SEQUENCE.indexOf(scene);
 if(meeting>=0&&s.stage===scene){
  // Once Emilia names it, the backpack shows the lure for what it is.
  if(scene==='ch4-core')for(const item of w.inventory.allItems)if(item.name===LURE)Object.assign(item,{name:REGION_CORE,description:'The Region Core of Reedwater. It pulses in time with Eli’s heartbeat. To take its power, he would have to eat it.'});
  s.stage=CHAPTER4_SEQUENCE[meeting+1]||'ch4-complete';w.npcs=createStoryNpcs(s,w.elapsed);
  if(s.stage!=='ch4-complete')show(w,s.stage);
 }
 if(scene==='ch5-tour'&&s.stage==='ch5-tour'){s.stage='ch5-night';s.guide=chapterFiveGuide('ch5-night');w.npcs=createStoryNpcs(s,w.elapsed);}
 // Eli wakes on the floor the next morning, and Mara is waiting outside his door.
 // He swallowed the Region Core in the night: it leaves the backpack, and the abilities it binds can wake.
 if(scene==='ch5-sleep'&&s.stage==='ch5-sleep'){s.stage='ch5-morning';ingestCore(w);s.guide=chapterFiveGuide('ch5-morning');Object.assign(w.player,LODGE_WAKE_SPOT,{vx:0,vy:0});w.npcs=createStoryNpcs(s,w.elapsed);}
 // Chapter 6. Each finished scene is a checkpoint.
 const sixth=stage=>{s.stage=stage;s.guide=chapterSixGuide(stage);w.npcs=createStoryNpcs(s,w.elapsed);};
 if(scene==='ch6-wake'&&s.stage==='ch5-morning')sixth('ch6-door');
 // The ocelot steps into the sunlight and breaks apart into blue motes.
 if(scene==='ch6-door'&&s.stage==='ch6-door'){sixth('ch6-circle');if(w.areaId===GUEST_LODGE.id)w.npcs.push({id:'ocelot-vanish',name:'',areaId:GUEST_LODGE.id,...OCELOT_CORNER,npc:true,creature:true,spriteId:'ocelot',animationState:'vanish',animationStart:w.elapsed,talkRange:-1,vanishing:true});}
 if(scene==='ch6-drayfus'&&s.stage==='ch6-circle')sixth('ch6-spar');
 if(scene==='ch6-spar'&&s.stage==='ch6-spar'){sixth('ch6-confession');show(w,'ch6-confession');}
 if(scene==='ch6-confession'&&s.stage==='ch6-confession')sixth('ch6-rack');
 // Holding Grandpa's rod with the core inside him wakes Reedwater's Call.
 if(scene==='ch6-rod'&&s.stage==='ch6-rack'){s.callAwakened=true;sixth('ch6-cast');}
 if(scene==='ch6-cast'&&s.stage==='ch6-cast'){practise(w,w.player,'fishing',DISARM_XP);s.buckets=0;s.carrying=false;sixth('ch6-buckets');}
 if(scene==='ch6-forty'&&s.stage==='ch6-buckets'){
  delete s.buckets;delete s.carrying;sixth('ch6-night');
  w.cancel();w.areaId=GUEST_LODGE.id;Object.assign(w.player,{x:LODGE_BED.x+76,y:LODGE_BED.y+30,vx:0,vy:0});show(w,'ch6-night');
 }
 if(scene==='ch6-night'&&s.stage==='ch6-night')sixth('ch6-complete');
 // Chapter 7. Drayfus wakes Eli in the dark and sends him out to run before the sun.
 const seventh=stage=>{s.stage=stage;s.guide=chapterSevenGuide(stage);w.npcs=createStoryNpcs(s,w.elapsed);};
 if(scene==='ch7-up'&&s.stage==='ch6-complete'){s.run=0;seventh('ch7-run');w.cancel();w.areaId='village';Object.assign(w.player,{x:LODGE_DOOR.x,y:LODGE_DOOR.y+40,vx:0,vy:0});}
 if(scene==='ch7-sunrise'&&s.stage==='ch7-run'){delete s.run;seventh('ch7-breakfast');}
 if(scene==='ch7-breakfast'&&s.stage==='ch7-breakfast')seventh('ch7-squat');
 // The squat starts in the middle of the circle, just in front of Drayfus.
 if(scene==='ch7-stance'&&s.stage==='ch7-squat'){s.hold=0;seventh('ch7-hold');Object.assign(w.player,SQUAT_SPOT,{vx:0,vy:0});}
 if(scene==='ch7-cat'&&s.stage==='ch7-hold'){delete s.hold;s.run=0;seventh('ch7-laps');}
 if(scene==='ch7-grass'&&s.stage==='ch7-rest')seventh('ch7-complete');
 w.message=storyObjective(w);return true;
}
// Skip turns every remaining page in one go, so each finished scene still sets its flags, items and stage. It stops at scripted action pages, which play out on their own.
export function skipStory(w){
 let turned=0;
 while(currentScene(w)&&!currentScene(w).action&&turned<1000){advanceStory(w);turned++;}
 return turned>0;
}
export function createStoryNpcs(story,elapsed=0){
 if(!cabinDamaged(story)||story.stage==='storm')return [];
 const position=story.guide||{x:1850,y:1640};
 const list=createNpcs().map(n=>({...n,x:position.x,y:position.y,areaId:position.areaId||'landing',name:(chapterFour(story)&&story.stage!=='ch4-house')||chapterFive(story)||training(story)?'Mara':'The girl',spriteId:'mara-story',
  greeting:story.stage==='ch5-morning'?CHAPTER5_MARA_GREETING:chapterSeven(story)?MARA_CH7[story.stage]:chapterSix(story)?MARA_CH6[story.stage]||'Drayfus will have you up before the sun tomorrow. Sleep, Eli.':chapterFive(story)?'Get some sleep, Eli. Sunrise.':story.stage==='ch4-complete'?'The guest lodge is this way. Grandma wants us back at sunrise.':chapterFour(story)?'Grandma is waiting inside.':chapterThree(story)?(story.stage==='ch3-complete'?'The chief is inside. We’ll speak to her next.':'Stay on the trail. I’ll wait if you need a moment.'):story.stage==='ch2-complete'?'The village is further inland. Stay on the trail.':story.stage==='ch2-follow'?'Stay close. I’ll wait for you.':'You’re finally awake. You were lucky I found you.'}));
 const yard=TRAINING_DAY.includes(story.stage);
 // Emilia is out when Eli comes in for breakfast.
 if((chapterFour(story)||chapterFive(story)||training(story))&&story.stage!=='ch7-breakfast')list.push({id:'emilia',name:story.stage==='ch4-house'?'The old woman':story.stage==='ch4-complete'||chapterFive(story)||training(story)?'Emilia':'The chief',...(yard?{areaId:TRAINING_GROUND.id,...TRAINING_EMILIA_SPOT}:{areaId:CHIEF_HOUSE.id,...EMILIA_SPOT}),...NPC_TYPES.villager,npc:true,spriteId:'emilia-story',talkRange:95,
  greeting:yard?'Go on, Eli. I’ll be right here with my tea.':chapterSeven(story)?'Running already? Good. Eat something, Eli, and mind your legs.':chapterSix(story)?'Drayfus says you finished all forty. Rest, Eli. You’ve earned it.':['ch5-morning','ch6-door'].includes(story.stage)?'Good morning, Eli. Drayfus will be waiting for you both.':'Rest well, Eli. Sunrise comes early.'});
 if(chapterSix(story)&&story.stage!=='ch6-door')list.push({id:'drayfus',name:'Drayfus',areaId:TRAINING_GROUND.id,...DRAYFUS_SPOT,...NPC_TYPES.villager,npc:true,spriteId:'drayfus-story',talkRange:95,animationState:['ch6-circle','ch6-spar'].includes(story.stage)?'beckon':'idle',greeting:DRAYFUS_CH6[story.stage]||'Before the sun. Don’t be late again.'});
 // Chapter 7: Drayfus watches the runs from the watchtower platform, and teaches in the circle the rest of the day.
 if(chapterSeven(story)){
  const tower=['ch7-run','ch7-laps'].includes(story.stage);
  list.push({id:'drayfus',name:'Drayfus',...(tower?{areaId:'village',...TOWER_PLATFORM,sortY:TOWER_PLATFORM.y+140,talkRange:-1}:{areaId:TRAINING_GROUND.id,...DRAYFUS_SPOT,talkRange:95}),...NPC_TYPES.villager,npc:true,spriteId:'drayfus-story',animationState:'idle',direction:'down',greeting:DRAYFUS_CH7[story.stage]||'Before the sun. Every day.'});
  // A guard at every post on the path round the village.
  if(tower)PERIMETER.forEach((post,i)=>{if(!post.tower)list.push({id:`guard-${i}`,name:'Guard',areaId:'village',x:post.x+34,y:post.y-6,...NPC_TYPES.villager,npc:true,spriteId:'villager-fisher',talkRange:70,greeting:story.stage==='ch7-run'?'Morning, Oscar’s boy.':'Afternoon, Oscar’s boy. Keep going.'});});
 }
 // Only Eli can see the ocelot. It sits in his room in the morning, then lives in his stomach until night.
 if(['ch5-morning','ch6-door','ch6-night','ch6-complete','ch7-complete'].includes(story.stage))list.push({id:'ocelot',name:'The ocelot',areaId:GUEST_LODGE.id,...(story.stage.startsWith('ch5')||story.stage==='ch6-door'?OCELOT_CORNER:OCELOT_STOOL),...NPC_TYPES.flitlynx,npc:true,creature:true,spriteId:'ocelot',talkRange:80,
  greeting:story.stage==='ch5-morning'?'The ocelot watches you with core-blue eyes, and waits for you to read.':story.stage==='ch6-door'?'It flicks its tail toward the door. Somebody is about to break it down.':'Sleep. Drayfus will wake you before the sun.'});
 if(villageStory(story)&&(position.areaId==='village'||chapterFour(story)||chapterFive(story)||training(story)))list.push(...createVillageResidents(elapsed));
 return list;
}
const MARA_CH7={'ch7-run':'Morning! Keep your elbows in!','ch7-breakfast':'Sit. Eat. You look like a ghost.','ch7-squat':'He’s in the circle. Good luck with your legs.','ch7-hold':'Don’t look at me, look at your feet!','ch7-laps':'Go! I’m not carrying you.','ch7-rest':'You look like a dropped sack of flour.','ch7-complete':'Not today, Eli.'};
const DRAYFUS_CH7={'ch7-breakfast':'Eat. Then the circle.','ch7-squat':'Come here.','ch7-hold':'Hold.','ch7-rest':'Tomorrow, before the sun.','ch7-complete':'Tomorrow, before the sun.'};
// Where Eli squats: the middle of the circle, just in front of Drayfus.
const SQUAT_SPOT={x:DRAYFUS_SPOT.x,y:DRAYFUS_SPOT.y+60};
const MARA_CH6={'ch6-door':'Come on, sleepyhead.','ch6-circle':'Drayfus is in the middle. Try not to die.','ch6-spar':'Go on. He won’t bite. Much.','ch6-confession':'You ate it. You actually ate it.','ch6-rack':'Pick something, Eli. Anything but an axe.','ch6-cast':'Go on. Show him.','ch6-buckets':'Forty. I counted my first time too.'};
const DRAYFUS_CH6={'ch6-circle':'Sunrise was some time ago.','ch6-spar':'Pick up a sword.','ch6-confession':'Up.','ch6-rack':'Choose.','ch6-cast':'Well? I’m waiting.','ch6-buckets':'The trough is not full yet.','ch6-night':'Go to bed.'};
// The sheet row a walker uses: whichever way it is mostly heading.
const walkDirection=(dx,dy)=>Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):(dy<0?'up':'down');
function updateChapterTwo(w,dt,walkable){
 const s=w.story;if(s?.stage!=='ch2-follow'||pendingScene(w)||w.areaId!=='landing'||w.player.health<=0)return;
 const n=w.npcs.find(n=>n.id==='mara'),g=s.guide;if(!n||!g)return;
 n.animationState='idle';
 const config=NPC_TYPES.mara.guide,distance=Math.hypot(w.player.x-n.x,w.player.y-n.y);
 if(g.waypoint>=GUIDE_ROUTE.length){if(distance<=config.arrivalRange)show(w,'ch2-end');return;}
 if(distance>config.waitRange||w.fishing.state!=='idle')return;
 const goal=GUIDE_ROUTE[g.waypoint],dx=goal.x-n.x,dy=goal.y-n.y,length=Math.hypot(dx,dy),travel=Math.min(length,config.speed*dt);
 if(length<1){g.waypoint++;return;}
 const steps=Math.max(1,Math.ceil(travel/4)),sx=dx/length*travel/steps,sy=dy/length*travel/steps;
 const before={x:n.x,y:n.y};
 for(let i=0;i<steps;i++){
  if(walkable(n.x+sx,n.y,'landing'))n.x+=sx;
  if(walkable(n.x,n.y+sy,'landing'))n.y+=sy;
 }
 const moved=Math.hypot(n.x-before.x,n.y-before.y);
 if(moved>0){n.animationState='walk';n.facingX=dx;n.direction=walkDirection(dx,dy);n.walkTime=(n.walkTime||0)+moved*.14;}
 g.x=n.x;g.y=n.y;
 if(Math.hypot(n.x-goal.x,n.y-goal.y)<1)g.waypoint++;
}
export function storyTransitionAllowed(w,next){
 const s=w.story;if(next.areaId===TRAINING_GROUND.id)return trainingOpen(s);if(!villageStory(s)||!s.guide||s.guide.areaId!==w.areaId||!TRAVEL_AREAS.includes(w.areaId))return true;
 const forward=TRAVEL_AREAS[TRAVEL_AREAS.indexOf(w.areaId)+1];
 return next.areaId!==forward||s.guide.waypoint>=chapter3Route(s).length;
}
export function onStoryAreaChange(w,previous){
 const s=w.story;if(!villageStory(s)||!s.guide||s.guide.areaId!==previous||!TRAVEL_AREAS.includes(previous))return;
 const next=TRAVEL_AREAS[TRAVEL_AREAS.indexOf(previous)+1];
 if(w.areaId!==next||s.guide.waypoint<chapter3Route(s).length)return;
 s.guide={...CHAPTER3_ENTRIES[next],areaId:next,waypoint:0};w.npcs=createStoryNpcs(s,w.elapsed);
 w.message=storyObjective(w);
}
// Chapter 7's two runs past the guard posts, and the squat in the circle.
function updateChapterSeven(w,dt){
 const s=w.story,p=w.player;if(pendingScene(w)||p.health<=0)return;
 if(['ch7-run','ch7-laps'].includes(s.stage)&&w.areaId==='village'){
  if(s.run>=PERIMETER.length){if(s.stage==='ch7-run')show(w,'ch7-sunrise');return;}
  const post=PERIMETER[s.run];
  if(Math.hypot(p.x-post.x,p.y-post.y)<60){
   s.run++;
   if(post.tower){
    if(s.stage==='ch7-run'){show(w,'ch7-sunrise');return;}
    delete s.run;s.stage='ch7-rest';s.guide=chapterSevenGuide('ch7-rest');w.npcs=createStoryNpcs(s,w.elapsed);
    w.message='The last lap. Eli’s legs are done. The grass beside the guest lodge is calling his name.';return;
   }
   w.message=`${POST_LINES[s.stage][s.run-1]} (${s.run}/${PERIMETER.length})`;
  }
  // Standing still in the dark gets noticed.
  if(s.stage==='ch7-run'){w.runStill=Math.hypot(p.vx||0,p.vy||0)<5?(w.runStill||0)+dt:0;if(w.runStill>4){w.message=IDLE_NAG;w.runStill=-6;}}
  return;
 }
 if(s.stage==='ch7-hold'&&w.areaId===TRAINING_GROUND.id){
  const moved=Math.hypot(p.vx||0,p.vy||0)>5||Math.hypot(p.x-SQUAT_SPOT.x,p.y-SQUAT_SPOT.y)>18;
  if(moved){
   if(s.hold>1)w.message=HOLD_RESET;
   s.hold=0;
   return;
  }
  const before=s.hold;s.hold=Math.min(HOLD_SECONDS,s.hold+dt);
  for(const [at,note] of Object.entries(HOLD_NOTES))if(before<at&&s.hold>=at)w.message=note;
  if(s.hold>=HOLD_SECONDS)show(w,'ch7-cat');
 }
}
export function updateStory(w,dt,walkable){
 updateVillageResidents(w.npcs,w.elapsed);
 if(w.npcs?.some(n=>n.vanishing&&w.elapsed-n.animationStart>VANISH_TIME))w.npcs=w.npcs.filter(n=>!n.vanishing||w.elapsed-n.animationStart<=VANISH_TIME);
 const s=w.story;if(!villageStory(s)){updateChapterTwo(w,dt,walkable);return;}
 if(chapterSeven(s)){updateChapterSeven(w,dt);return;}
 if(pendingScene(w)||['ch3-lore','ch3-complete'].includes(s.stage)||chapterFour(s)||chapterFive(s)||chapterSix(s)||w.player.health<=0)return;
 const n=w.npcs.find(n=>n.id==='mara'),g=s.guide;if(!n||!g)return;
 n.animationState='idle';if(w.areaId!==g.areaId)return;
 const distance=Math.hypot(w.player.x-n.x,w.player.y-n.y),route=chapter3Route(s),config=NPC_TYPES.mara.guide;
 if(s.stage==='ch3-chimes'&&g.waypoint>=1){if(distance<=config.arrivalRange)show(w,'ch3-chimes');return;}
 if(g.waypoint>=route.length){
  if(distance<=config.arrivalRange&&s.stage==='ch3-travel'&&g.areaId==='village')show(w,'ch3-arrival');
  if(distance<=config.arrivalRange&&s.stage==='ch3-chief')show(w,'ch3-end');
  return;
 }
 if(distance>config.waitRange||w.fishing.state!=='idle')return;
 const goal=route[g.waypoint],dx=goal.x-n.x,dy=goal.y-n.y,length=Math.hypot(dx,dy),travel=Math.min(length,config.travelSpeed*dt);
 if(length<1){g.waypoint++;return;}
 const steps=Math.max(1,Math.ceil(travel/4)),sx=dx/length*travel/steps,sy=dy/length*travel/steps,before={x:n.x,y:n.y};
 for(let i=0;i<steps;i++){if(walkable(n.x+sx,n.y,g.areaId))n.x+=sx;if(walkable(n.x,n.y+sy,g.areaId))n.y+=sy;}
 const moved=Math.hypot(n.x-before.x,n.y-before.y);
 if(moved>0){n.animationState='walk';n.facingX=dx;n.direction=walkDirection(dx,dy);n.walkTime=(n.walkTime||0)+moved*.14;}
 g.x=n.x;g.y=n.y;if(Math.hypot(n.x-goal.x,n.y-goal.y)<1)g.waypoint++;
}
// Every story stage in the order Eli reaches them.
export const STORY_STAGES=Object.freeze(['arrival','explore','fish','rest','storm','awakening','complete',...CHAPTER_TWO_STAGES,...CHAPTER_THREE_STAGES,...CHAPTER_FOUR_STAGES,...CHAPTER_FIVE_STAGES,...CHAPTER_SIX_STAGES,...CHAPTER_SEVEN_STAGES]);
export function restoreStory(data){
 if(data===null)return null;
 if(!data||!STORY_STAGES.includes(data.stage)||typeof data.lureSeen!=='boolean'||typeof data.photoSeen!=='boolean'||(data.scene!==null&&!Object.hasOwn(SCENES,data.scene))||!Number.isInteger(data.page)||data.page<0||(data.scene?data.page>=SCENES[data.scene].length:data.page!==0))throw Error('Invalid story progress.');
 if((data.stage==='storm'&&data.scene!=='storm')||(data.stage==='awakening'&&data.scene!=='awakening')||(data.scene==='storm'&&data.stage!=='storm'))throw Error('Invalid story scene.');
 if(['fish','rest','storm','awakening','complete',...CHAPTER_TWO_STAGES,...CHAPTER_THREE_STAGES,...CHAPTER_FOUR_STAGES,...CHAPTER_FIVE_STAGES,...CHAPTER_SIX_STAGES,...CHAPTER_SEVEN_STAGES].includes(data.stage)&&(!data.lureSeen||!data.photoSeen))throw Error('Invalid story discoveries.');
 const sceneStages={'ch2-shadow':'ch2-camp','ch2-cabin':'ch2-cabin','ch2-island':'ch2-home','ch2-departure':'ch2-ready','ch2-end':'ch2-follow','ch3-start':'ch2-complete','ch3-chimes':'ch3-chimes','ch3-arrival':'ch3-travel','ch3-beasts':'ch3-creatures','ch3-history':'ch3-lore','ch3-end':'ch3-chief',...Object.fromEntries(CHAPTER4_SEQUENCE.map(scene=>[scene,scene])),'ch5-tour':'ch5-tour','ch5-sleep':'ch5-sleep','ch6-wake':'ch5-morning','ch7-up':'ch6-complete','ch7-sunrise':'ch7-run','ch7-breakfast':'ch7-breakfast','ch7-stance':'ch7-squat','ch7-cat':'ch7-hold','ch7-grass':'ch7-rest','ch6-door':'ch6-door','ch6-drayfus':'ch6-circle','ch6-spar':'ch6-spar','ch6-confession':'ch6-confession','ch6-rod':'ch6-rack','ch6-cast':'ch6-cast','ch6-forty':'ch6-buckets','ch6-night':'ch6-night'};
 if(sceneStages[data.scene]&&sceneStages[data.scene]!==data.stage)throw Error('Invalid story scene.');
 if(data.stage==='ch2-camp'&&data.scene!=='ch2-shadow')throw Error('Invalid story scene.');
 let guide=null;
 if(['ch2-follow','ch2-complete'].includes(data.stage)||villageStory(data)){
  const g=data.guide;
  const limits={landing:[2800,2200],windchime:[1200,1800],crossroads:[1600,1280],village:[1920,2000],'chief-house':[CHIEF_HOUSE.width,CHIEF_HOUSE.height],[GUEST_LODGE.id]:[GUEST_LODGE.width,GUEST_LODGE.height],[TRAINING_GROUND.id]:[TRAINING_GROUND.width,TRAINING_GROUND.height]},bounds=g&&Object.hasOwn(limits,g.areaId)?limits[g.areaId]:null;
  if(!g||!bounds||!Number.isFinite(g.x)||!Number.isFinite(g.y)||g.x<24||g.x>bounds[0]-24||g.y<24||g.y>bounds[1]-24||!Number.isInteger(g.waypoint)||g.waypoint<0)throw Error('Invalid story guide.');
  const route=villageStory(data)?chapter3Route(data):GUIDE_ROUTE;
  if(g.waypoint>route.length)throw Error('Invalid story guide.');
  if(!villageStory(data)&&(g.areaId!=='landing'||g.x<1350||g.x>1900||g.y<1390||g.y>1690))throw Error('Invalid story guide.');
  // Chapter 4 keeps Mara at her place inside the chief's house.
  if(chapterFour(data)&&(g.areaId!==CHIEF_HOUSE.id||g.waypoint!==0||Math.hypot(g.x-MARA_SPOT.x,g.y-MARA_SPOT.y)>2))throw Error('Invalid story guide destination.');
  if(chapterSeven(data)){const spot=CHAPTER7_GUIDE[data.stage];if(g.areaId!==spot.areaId||g.waypoint!==0||Math.hypot(g.x-spot.x,g.y-spot.y)>2)throw Error('Invalid story guide destination.');}
  if(chapterSix(data)){const spot=CHAPTER6_GUIDE[data.stage];if(g.areaId!==spot.areaId||g.waypoint!==0||Math.hypot(g.x-spot.x,g.y-spot.y)>2)throw Error('Invalid story guide destination.');}
  if(chapterFive(data)){const spot=CHAPTER5_GUIDE[data.stage];if(g.areaId!==spot.areaId||g.waypoint!==0||Math.hypot(g.x-spot.x,g.y-spot.y)>2)throw Error('Invalid story guide destination.');}
  if(['ch3-creatures','ch3-lore','ch3-chief','ch3-complete'].includes(data.stage)&&g.areaId!=='village'||data.stage==='ch3-chimes'&&g.areaId!=='landing')throw Error('Invalid story guide area.');
  if((['ch2-complete','ch3-complete'].includes(data.stage)||['ch2-end','ch3-end','ch3-arrival','ch3-beasts'].includes(data.scene))&&(g.waypoint!==route.length||Math.hypot(g.x-route.at(-1).x,g.y-route.at(-1).y)>2))throw Error('Invalid story guide destination.');
  guide={x:g.x,y:g.y,waypoint:g.waypoint,areaId:g.areaId};
 }else if(data.guide!==null)throw Error('Invalid story guide.');
 // Saves from before the weapon rack: later chapters already carry the rod; a supper in progress fetches its tools.
 for(const key of ['rod','bow'])if(data[key]!==undefined&&typeof data[key]!=='boolean')throw Error('Invalid story tools.');
 const tools=!PRE_STORM.includes(data.stage),rod=tools||data.rod===true,bow=tools||(rod&&data.bow===true);
 // The core abilities follow from the stage reached, so saves from before the ingest scene catch up on their own.
 const reached=stage=>STORY_STAGES.indexOf(data.stage)>=STORY_STAGES.indexOf(stage);
 const story={stage:data.stage,lureSeen:data.lureSeen,photoSeen:data.photoSeen,scene:data.scene,page:data.page,guide,rod,bow,coreIngested:reached('ch5-morning'),callAwakened:reached('ch6-cast')};
 // Drayfus's bucket count exists only while Eli is carrying water.
 if(data.stage==='ch6-buckets'){
  if(!Number.isInteger(data.buckets)||data.buckets<0||data.buckets>BUCKET_TRIPS||typeof data.carrying!=='boolean'||(data.scene==='ch6-forty')!==(data.buckets===BUCKET_TRIPS)||(data.carrying&&data.buckets===BUCKET_TRIPS))throw Error('Invalid bucket trips.');
  Object.assign(story,{buckets:data.buckets,carrying:data.carrying});
 }else if(data.buckets!==undefined||data.carrying!==undefined)throw Error('Invalid bucket trips.');
 // Chapter 7: the guard posts passed on a run, and the seconds the squat has been held.
 if(['ch7-run','ch7-laps'].includes(data.stage)){
  if(!Number.isInteger(data.run)||data.run<0||data.run>PERIMETER.length||(data.run===PERIMETER.length&&!(data.stage==='ch7-run'&&data.scene==='ch7-sunrise')))throw Error('Invalid run progress.');
  story.run=data.run;
 }else if(data.run!==undefined)throw Error('Invalid run progress.');
 if(data.stage==='ch7-hold'){
  if(!Number.isFinite(data.hold)||data.hold<0||data.hold>HOLD_SECONDS)throw Error('Invalid squat progress.');
  story.hold=data.hold;
 }else if(data.hold!==undefined)throw Error('Invalid squat progress.');
 return story;
}


