// Story geography and dialogue only. Rendering and collision remain in their own systems.
import {script,say,think,narrate} from './scene-script.js';
const eli=text=>say('Eli',text),girl=text=>say('The girl',text);
export const CHAPTER_THREE_STAGES=['ch3-chimes','ch3-travel','ch3-creatures','ch3-lore','ch3-chief','ch3-complete'];
export const chapterThree=s=>!!s&&CHAPTER_THREE_STAGES.includes(s.stage);
export const TRAVEL_AREAS=['landing','windchime','crossroads','village'];
export const CHAPTER3_ROUTES={
 landing:[{x:1380,y:1180},{x:1350,y:800},{x:1400,y:50}],
 windchime:[{x:600,y:1330},{x:520,y:1000},{x:650,y:650},{x:600,y:320},{x:600,y:50}],
 crossroads:[{x:800,y:1080},{x:760,y:870},{x:800,y:680},{x:610,y:630},{x:400,y:490},{x:170,y:460},{x:50,y:460}],
 village:[{x:1680,y:530},{x:1570,y:580},{x:1290,y:580}]
};
export const CHAPTER3_ENTRIES={landing:{x:1390,y:1420},windchime:{x:600,y:1510},crossroads:{x:800,y:1130},village:{x:1800,y:530}};
export const CREATURE_ROUTE=[{x:1290,y:580},{x:1220,y:520}];
export const CHIEF_ROUTE=[{x:1140,y:580},{x:850,y:580},{x:850,y:420},{x:780,y:390}];
export function chapter3Route(s){return s.stage==='ch3-creatures'?CREATURE_ROUTE:['ch3-chief','ch3-complete'].includes(s.stage)?CHIEF_ROUTE:s.stage==='ch3-lore'?CREATURE_ROUTE:CHAPTER3_ROUTES[s.guide?.areaId]||[];}
export const CHAPTER3_OBJECTIVES={
 'ch3-chimes':'Chapter 3 · Follow the girl to the three wooden chimes.',
 'ch3-travel':'Chapter 3 · Follow your guide north through Windchime Path, then west at the crossroads to Willowback Village.',
 'ch3-creatures':'Chapter 3 · Follow the girl to the blacksmith’s shop. Examine the frost-scaled guardian from the lane.',
 'ch3-lore':'Chapter 3 · Ask the girl what shadow walkers really are.',
 'ch3-chief':'Chapter 3 · Follow the girl to the chief’s red house.',
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
  {title:'Willowback Village',art:null,lines:[narrate('The trees thin. A dirt road runs between timber-and-stone houses with steep roofs and smoking chimneys. A well anchors the square. Fields lie to the east; boats bump against the docks to the south. The village is alive.')]},
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
