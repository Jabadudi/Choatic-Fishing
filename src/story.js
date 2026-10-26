import {CHAPTER_THREE_STAGES,chapterThree,CHAPTER3_SCENES,CHAPTER3_OBJECTIVES,CHAPTER3_ROUTES,CHAPTER3_ENTRIES,TRAVEL_AREAS,CREATURE_ROUTE,CHIEF_ROUTE,chapter3Route} from './chapter3.js';
import {CHAPTER_FOUR_STAGES,chapterFour,CHAPTER4_SCENES,CHAPTER4_OBJECTIVES,CHAPTER4_SEQUENCE} from './chapter4.js';
import {CHAPTER1_SCENES,CHAPTER2_SCENES} from './chapter1.js';
import {CHIEF_DOOR,CHIEF_HOUSE,EMILIA_SPOT,MARA_SPOT} from './chief-house.js';
import {createVillageResidents,updateVillageResidents} from './village-life.js';
import {createNpcs} from './npcs.js';
import {NPC_TYPES} from './entities.js';
// Saved narrative milestones. Simulation owns changes; artwork only reads them.
export const CABIN={x:1630,y:1510,left:1490,right:1760,top:1320,bottom:1515};
export const CAMP={x:1810,y:1640};
export const GUIDE_ROUTE=[{x:1770,y:1580},{x:1630,y:1555},{x:1510,y:1570},{x:1400,y:1600},{x:1400,y:1500},{x:1390,y:1420}];
export const CHAPTER_TWO_STAGES=['ch2-camp','ch2-cabin','ch2-home','ch2-ready','ch2-follow','ch2-complete'];
export const chapterTwo=story=>!!story&&CHAPTER_TWO_STAGES.includes(story.stage);
// Chapters 3 and 4 share the village guide: she walks in Chapter 3 and waits on the chief's porch in Chapter 4.
const villageStory=s=>chapterThree(s)||chapterFour(s);
export const inlandUnlocked=story=>!story||(story.stage==='ch2-complete'||villageStory(story));
export const SCENES={...CHAPTER1_SCENES,...CHAPTER2_SCENES,...CHAPTER3_SCENES,...CHAPTER4_SCENES};
// Save version 4 stored one page per story beat. Each beat now opens on its first spoken line.
export const LURE='Mysterious Lure',REGION_CORE='Region Core';
export const pageForBeat=(scene,beat)=>SCENES[scene]?.findIndex(p=>p.beat===beat)??-1;
export const createStory=()=>({stage:'arrival',lureSeen:false,photoSeen:false,scene:'arrival',page:0,guide:null});
export const cabinDamaged=story=>!!story&&((story.stage==='storm'&&story.scene==='storm'&&story.page>=SCENES.storm.findIndex(p=>p.action==='escape'))||['awakening','complete'].includes(story.stage)||chapterTwo(story)||villageStory(story));
export const chapterHeading=scene=>scene?.startsWith('ch4-')?'CHAPTER 4 · REGION CORE':scene?.startsWith('ch3-')?'CHAPTER 3 · THE VILLAGE':scene?.startsWith('ch2-')?'CHAPTER 2 · SHADOW WALKER':'CHAPTER 1 · THE OLD FISHING HUT';
export const pendingScene=world=>world?.story?.scene?SCENES[world.story.scene]?.[world.story.page]:null;
export const currentScene=world=>world?.storySuspended?null:pendingScene(world);
export function storyObjective(world){
 const s=world.story;if(!s)return null;
 if(villageStory(s)&&s.stage!=='ch4-complete'&&s.guide?.areaId!==world.areaId){const names={landing:'Reedwater Landing',windchime:'Windchime Path',crossroads:'Willowbank Crossroads',village:'Willowback Village','chief-house':'the chief’s house'};return `Chapter ${chapterFour(s)?4:3} · ${chapterFour(s)?'Mara':'Your guide'} is waiting in ${names[s.guide.areaId]}. Return to her to continue.`;}
 return ({...CHAPTER3_OBJECTIVES,...CHAPTER4_OBJECTIVES,arrival:'Chapter 1 · Follow the path to Grandpa’s cabin.',explore:'Chapter 1 · Examine the lure box and the photograph inside the cabin.',fish:'Chapter 1 · Fish from the dock, then bring a Sardine to the cabin stove.',rest:'Chapter 1 · When you are ready, rest in the cabin bed.',storm:'Chapter 1 · Survive the storm.',awakening:'Chapter 1 · A new morning.',complete:'Chapter 2 · Talk to the girl beside the campfire at Reedwater Landing.',
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
  const prompt={complete:'Talk about last night','ch2-camp':'Talk about last night','ch2-cabin':'Ask about the cabin','ch2-home':'Ask how to get home','ch2-ready':'Leave with the girl','ch2-complete':'Continue toward the village','ch3-lore':'Ask about shadow walkers','ch3-complete':'Go inside with the girl',...Object.fromEntries(CHAPTER4_SEQUENCE.map(stage=>[stage,'Continue the meeting']))}[w.story.stage];
  if(prompt)return prompt;
 }
 if(w.areaId==='village'&&chapterFour(w.story)&&near(CHIEF_DOOR.x,CHIEF_DOOR.y+20,70))return 'Enter the chief’s house';
 if(w.areaId==='village'&&w.story.stage==='ch3-creatures'&&w.story.guide?.waypoint>=CREATURE_ROUTE.length&&near(1220,490,125))return 'Examine the frost-scaled guardian';
 if(w.areaId==='landing'){
  if(near(CABIN.x,CABIN.y+35,115))return cabinDamaged(w.story)?'Examine the damaged cabin':'Enter Grandpa’s cabin';
  if(cabinDamaged(w.story)&&near(1250,1810,115))return 'Look for a way off the shore';
  if(cabinDamaged(w.story)&&near(CAMP.x,CAMP.y,100)&&!near(1850,1640,95))return 'Remember the morning';
 }else if(w.areaId==='cabin'){
  if(near(520,145))return 'Examine the lure box';
  if(near(110,270))return 'Examine the photograph';
  if(near(100,120))return w.story.stage==='rest'?'Dinner is finished':'Cook dinner';
  if(near(510,330))return 'Rest until night';
 }
 return null;
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
 else if(prompt==='Examine the lure box')show(w,'lure');
 else if(prompt==='Examine the photograph')show(w,'photo');
 else if(prompt==='Cook dinner'){
  const fish=w.inventory.allItems.find(i=>i.name==='Sardine');
  if(s.stage!=='fish')w.message='Look around the cabin before settling in for the evening.';
  else if(!fish)w.message='Catch a Sardine from the dock and bring it back to the stove.';
  else{w.inventory.removeId(fish.id);show(w,'dinner');}
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
 w.message=storyObjective(w);return true;
}
export function createStoryNpcs(story,elapsed=0){
 if(!cabinDamaged(story)||story.stage==='storm')return [];
 const position=story.guide||{x:1850,y:1640};
 const list=createNpcs().map(n=>({...n,x:position.x,y:position.y,areaId:position.areaId||'landing',name:chapterFour(story)&&story.stage!=='ch4-house'?'Mara':'The girl',spriteId:'mara-story',
  greeting:story.stage==='ch4-complete'?'The guest lodge is this way. Grandma wants us back at sunrise.':chapterFour(story)?'Grandma is waiting inside.':chapterThree(story)?(story.stage==='ch3-complete'?'The chief is inside. We’ll speak to her next.':'Stay on the trail. I’ll wait if you need a moment.'):story.stage==='ch2-complete'?'The village is further inland. Stay on the trail.':story.stage==='ch2-follow'?'Stay close. I’ll wait for you.':'You’re finally awake. You were lucky I found you.'}));
 if(chapterFour(story))list.push({id:'emilia',name:story.stage==='ch4-house'?'The old woman':story.stage==='ch4-complete'?'Emilia':'The chief',areaId:CHIEF_HOUSE.id,...EMILIA_SPOT,...NPC_TYPES.villager,npc:true,spriteId:'emilia-story',talkRange:95,greeting:'Rest well, Eli. Sunrise comes early.'});
 if(villageStory(story)&&(position.areaId==='village'||chapterFour(story)))list.push(...createVillageResidents(elapsed));
 return list;
}
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
 if(moved>0){n.animationState='walk';n.facingX=dx;n.walkTime=(n.walkTime||0)+moved*.14;}
 g.x=n.x;g.y=n.y;
 if(Math.hypot(n.x-goal.x,n.y-goal.y)<1)g.waypoint++;
}
export function storyTransitionAllowed(w,next){
 const s=w.story;if(!villageStory(s)||!s.guide||s.guide.areaId!==w.areaId||!TRAVEL_AREAS.includes(w.areaId))return true;
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
export function updateStory(w,dt,walkable){
 updateVillageResidents(w.npcs,w.elapsed);
 const s=w.story;if(!villageStory(s)){updateChapterTwo(w,dt,walkable);return;}
 if(pendingScene(w)||['ch3-lore','ch3-complete'].includes(s.stage)||chapterFour(s)||w.player.health<=0)return;
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
 if(moved>0){n.animationState='walk';n.facingX=dx;n.walkTime=(n.walkTime||0)+moved*.14;}
 g.x=n.x;g.y=n.y;if(Math.hypot(n.x-goal.x,n.y-goal.y)<1)g.waypoint++;
}
export function restoreStory(data){
 if(data===null)return null;
 const stages=['arrival','explore','fish','rest','storm','awakening','complete',...CHAPTER_TWO_STAGES,...CHAPTER_THREE_STAGES,...CHAPTER_FOUR_STAGES];
 if(!data||!stages.includes(data.stage)||typeof data.lureSeen!=='boolean'||typeof data.photoSeen!=='boolean'||(data.scene!==null&&!Object.hasOwn(SCENES,data.scene))||!Number.isInteger(data.page)||data.page<0||(data.scene?data.page>=SCENES[data.scene].length:data.page!==0))throw Error('Invalid story progress.');
 if((data.stage==='storm'&&data.scene!=='storm')||(data.stage==='awakening'&&data.scene!=='awakening')||(data.scene==='storm'&&data.stage!=='storm'))throw Error('Invalid story scene.');
 if(['fish','rest','storm','awakening','complete',...CHAPTER_TWO_STAGES,...CHAPTER_THREE_STAGES,...CHAPTER_FOUR_STAGES].includes(data.stage)&&(!data.lureSeen||!data.photoSeen))throw Error('Invalid story discoveries.');
 const sceneStages={'ch2-shadow':'ch2-camp','ch2-cabin':'ch2-cabin','ch2-island':'ch2-home','ch2-departure':'ch2-ready','ch2-end':'ch2-follow','ch3-start':'ch2-complete','ch3-chimes':'ch3-chimes','ch3-arrival':'ch3-travel','ch3-beasts':'ch3-creatures','ch3-history':'ch3-lore','ch3-end':'ch3-chief',...Object.fromEntries(CHAPTER4_SEQUENCE.map(scene=>[scene,scene]))};
 if(sceneStages[data.scene]&&sceneStages[data.scene]!==data.stage)throw Error('Invalid story scene.');
 if(data.stage==='ch2-camp'&&data.scene!=='ch2-shadow')throw Error('Invalid story scene.');
 let guide=null;
 if(['ch2-follow','ch2-complete'].includes(data.stage)||villageStory(data)){
  const g=data.guide;
  const limits={landing:[2800,2200],windchime:[1200,1800],crossroads:[1600,1280],village:[1920,2000],'chief-house':[CHIEF_HOUSE.width,CHIEF_HOUSE.height]},bounds=g&&Object.hasOwn(limits,g.areaId)?limits[g.areaId]:null;
  if(!g||!bounds||!Number.isFinite(g.x)||!Number.isFinite(g.y)||g.x<24||g.x>bounds[0]-24||g.y<24||g.y>bounds[1]-24||!Number.isInteger(g.waypoint)||g.waypoint<0)throw Error('Invalid story guide.');
  const route=villageStory(data)?chapter3Route(data):GUIDE_ROUTE;
  if(g.waypoint>route.length)throw Error('Invalid story guide.');
  if(!villageStory(data)&&(g.areaId!=='landing'||g.x<1350||g.x>1900||g.y<1390||g.y>1690))throw Error('Invalid story guide.');
  // Chapter 4 keeps Mara at her place inside the chief's house.
  if(chapterFour(data)&&(g.areaId!==CHIEF_HOUSE.id||g.waypoint!==0||Math.hypot(g.x-MARA_SPOT.x,g.y-MARA_SPOT.y)>2))throw Error('Invalid story guide destination.');
  if(['ch3-creatures','ch3-lore','ch3-chief','ch3-complete'].includes(data.stage)&&g.areaId!=='village'||data.stage==='ch3-chimes'&&g.areaId!=='landing')throw Error('Invalid story guide area.');
  if((['ch2-complete','ch3-complete'].includes(data.stage)||['ch2-end','ch3-end','ch3-arrival','ch3-beasts'].includes(data.scene))&&(g.waypoint!==route.length||Math.hypot(g.x-route.at(-1).x,g.y-route.at(-1).y)>2))throw Error('Invalid story guide destination.');
  guide={x:g.x,y:g.y,waypoint:g.waypoint,areaId:g.areaId};
 }else if(data.guide!==null)throw Error('Invalid story guide.');
 return {stage:data.stage,lureSeen:data.lureSeen,photoSeen:data.photoSeen,scene:data.scene,page:data.page,guide};
}


