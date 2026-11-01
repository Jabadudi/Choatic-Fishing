// Story geography and dialogue only. Rendering and collision remain in their own systems.
import {script,say,think,narrate} from './scene-script.js';
const eli=text=>say('Eli',text),girl=text=>say('The girl',text);
export const CHAPTER_THREE_STAGES=['ch3-chimes','ch3-travel','ch3-creatures','ch3-lore','ch3-chief','ch3-complete'];
export const chapterThree=s=>!!s&&CHAPTER_THREE_STAGES.includes(s.stage);
// The walk to Willowback: up Windchime Path, west at the crossroads, along the farm road and through the Willowback
// Gate into the Merchant Quarter, where the blacksmith's guardian sleeps. Then on to the chief's house on the square.
export const TRAVEL_AREAS=['landing','windchime','crossroads','village-farm','village-market'];
export const CHIEF_AREAS=['village-market','village'];
export const travelAreas=s=>['ch3-chief','ch3-complete'].includes(s?.stage)?CHIEF_AREAS:TRAVEL_AREAS;
export const CHAPTER3_ROUTES={
 landing:[{x:1380,y:1180},{x:1350,y:800},{x:1400,y:50}],
 windchime:[{x:348,y:1060},{x:303,y:928},{x:366,y:692},{x:511,y:510},{x:711,y:382},{x:892,y:291},{x:1128,y:164},{x:1150,y:50}],
 crossroads:[{x:800,y:1080},{x:760,y:870},{x:800,y:680},{x:610,y:630},{x:400,y:490},{x:170,y:460},{x:50,y:460}],
 'village-farm':[{x:1800,y:840},{x:1300,y:905},{x:900,y:1015},{x:500,y:1115},{x:50,y:1150}],
 'village-market':[{x:1450,y:540},{x:1300,y:520}]
};
export const CHAPTER3_ENTRIES={landing:{x:1390,y:1420},windchime:{x:330,y:1120},crossroads:{x:800,y:1130},'village-farm':{x:1930,y:830},'village-market':{x:1540,y:530},village:{x:1850,y:590}};
// In the Merchant Quarter: up to the blacksmith's door, where the Rimejaw sleeps.
export const CREATURE_ROUTE=[{x:1300,y:520},{x:1360,y:420}];
export const GUARDIAN_SPOT={x:1420,y:390};
// Then west along the main street to the square, and across the commons to the chief's porch.
export const CHIEF_LEAVE_ROUTE=[{x:1100,y:550},{x:600,y:600},{x:300,y:592},{x:50,y:590}];
export const CHIEF_ROUTE=[{x:1700,y:600},{x:1460,y:560},{x:1260,y:470},{x:1250,y:400}];
export function chapter3Route(s){
 if(['ch3-creatures','ch3-lore'].includes(s.stage))return CREATURE_ROUTE;
 if(['ch3-chief','ch3-complete'].includes(s.stage))return s.guide?.areaId==='village-market'?CHIEF_LEAVE_ROUTE:CHIEF_ROUTE;
 return CHAPTER3_ROUTES[s.guide?.areaId]||[];
}
export const CHAPTER3_OBJECTIVES={
 'ch3-chimes':'Chapter 3 · Follow the girl to the three wooden chimes.',
 'ch3-travel':'Chapter 3 · Follow your guide north through Windchime Path, then west at the crossroads, past the farms and through the Willowback Gate.',
 'ch3-creatures':'Chapter 3 · Follow the girl to the blacksmith’s house in the Merchant Quarter. Examine the frost-scaled guardian from the street.',
 'ch3-lore':'Chapter 3 · Ask the girl what shadow walkers really are.',
 'ch3-chief':'Chapter 3 · Follow the girl west to the Town Square and the chief’s red house.',
 'ch3-complete':'Chapter 4 · Talk to the girl on the chief’s porch when you are ready to go inside.'
};
export const CHAPTER3_SCENES={
 'ch3-start':script([
  {title:'The Village',art:null,lines:[narrate('It was a short walk. Short for her, anyway. She moves through the trees as if she knows every root. Eli follows like a man who was electrocuted, knocked unconscious, and left to sleep in a wet field. Which he was.')]}
 ]),
 'ch3-chimes':script([
  {title:'Three hollow notes',art:null,lines:[narrate('A crooked branch holds three old wooden chimes. The breeze off the water knocks them together, one low note after another. The sound follows them farther into the trees than sound should.'),think('Eli','I’m not going to ask. My collection of unanswered questions is growing.')]}
 ]),
 'ch3-arrival':script([
  {title:'Willowback Village',art:null,lines:[narrate('The trees thin. The road runs between fields and a turning mill wheel, through a timber gate, and into a street of timber-and-stone houses with steep roofs and smoking chimneys. Market stalls, a forge, lanterns strung overhead. Somewhere to the west, boats bump against a dock. The village is alive.')]},
  {title:'Life after the storm',art:null,lines:[narrate('Nets, baskets, shouting across lanes. A hammer rings out from a workshop. Children chase each other around the well. Every shade and build of person seems to have found a place here. Then Eli notices the animals.'),think('Eli','None of them are normal.')]}
 ]),
 'ch3-beasts':script([
  {title:'The guardian at the door',art:'blacksmith',lines:[narrate('A mastiff-sized creature rests across the blacksmith’s doorway. A heavy mane gives way to overlapping blue-gray scales. Frost gathers between them, though the morning isn’t cold. It opens one eye. Eli keeps his distance.')]},
  {title:'Something on the roof',art:'blacksmith',lines:[narrate('Above it, a bobcat-sized creature cleans its paw. Tufted ears. A stubby tail. Leathery wings folded along its back. A bird lands too close; the wings snap open. The bird’s morning gets considerably worse.')]},
  {title:'Real. Annoyingly real.',art:'blacksmith',lines:[think('Eli','Somebody is crossing a lizard with a dog and absolutely no adult supervision. That must be it.'),narrate('Eli pinches his hand.'),eli('Ow.'),narrate('The girl glances back.'),girl('What’s wrong?'),eli('Nothing. What’s with… those?')]},
  {title:'Rimejaw. Flitlynx.',art:'blacksmith',lines:[girl('The big one is a Rimejaw. The little one with wings is a Flitlynx. I would stay away from the Rimejaw if I were you.'),eli('Wasn’t planning on hugging it.'),girl('Good. Their bite freezes whatever it catches. It took us generations to tame them.')]},
  {title:'Even a beast like that',art:'blacksmith',lines:[girl('They fought with us last night, alongside the Moonfang. They’re very useful in a fight. But even a beast like that can’t hold off the shadow walkers alone. Not for long.'),narrate('Eli looks back at the armored guardian.'),think('Eli','There’s that name again.')]}
 ]),
 'ch3-history':script([
  {title:'Grim-jaw',art:null,lines:[eli('What are the shadow walkers? Because I saw one, and I’d like to know what could take on a… grim-jaw.'),girl('Rimejaw.'),eli('That’s what I said.'),girl('It isn’t.'),narrate('Her voice grows flatter and quieter.')]},
  {title:'The dark army',art:null,lines:[girl('The shadow walkers are ancient. They walked this land long before we did, and they come in every shape and size. They’re what’s left of the dark army that served Croshelda, the Witch of Darkness.')]},
  {title:'Four hundred years',art:null,lines:[girl('Four hundred years ago, Goldanir disappeared from this region. That’s when the shadow walkers began coming back. They want to devour everything in their path, and they don’t stop.')]},
  {title:'What they infect',art:'blacksmith',lines:[girl('They take the power of whatever they infect, and multiply it. Several times over.'),narrate('She falls quiet.'),girl('Last night, we were lucky. We only lost one Rimejaw. No one else.'),narrate('She says lucky like she means it.')]},
  {title:'Where the hell am I?',art:null,lines:[narrate('Eli pictures the frost-scaled guardian infected and made several times worse.'),think('Eli','A witch of darkness. Creatures I’ve never seen. An ancient protector who vanished. Is this some kind of fantasy world?'),narrate('He tries to stop thinking about it. It doesn’t work.')]}
 ]),
 'ch3-end':script([
  {title:'The red house',art:null,lines:[narrate('The girl leads him past the square toward a larger house painted deep red, its trim picked out in white.'),think('Eli','Someone here might know a way home.'),narrate('Eli follows her to the porch, carrying more questions than he had at the shore.')]}
 ])
};
