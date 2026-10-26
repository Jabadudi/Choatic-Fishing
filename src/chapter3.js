// Story geography and dialogue only. Rendering and collision remain in their own systems.
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
export function chapter3Route(s){return s.stage==='ch3-creatures'?CREATURE_ROUTE:(['ch3-chief','ch3-complete'].includes(s.stage)||s.stage.startsWith('ch4-'))?CHIEF_ROUTE:s.stage==='ch3-lore'?CREATURE_ROUTE:CHAPTER3_ROUTES[s.guide?.areaId]||[];}
export const CHAPTER3_OBJECTIVES={
 'ch3-chimes':'Chapter 3 · Follow the girl to the three wooden chimes.',
 'ch3-travel':'Chapter 3 · Follow your guide north through Windchime Path, then west at the crossroads to Willowback Village.',
 'ch3-creatures':'Chapter 3 · Follow the girl to the blacksmith’s shop. Examine the frost-scaled guardian from the lane.',
 'ch3-lore':'Chapter 3 · Ask the girl what shadow walkers really are.',
 'ch3-chief':'Chapter 3 · Follow the girl to the chief’s red house.',
 'ch3-complete':'Chapter 4 · Talk to the girl on the chief’s porch when you are ready to go inside.'
};
export const CHAPTER3_SCENES={
 'ch3-start':[{title:'The Village',speaker:'Eli',text:'It was a short walk. Short for her, anyway. She moves through the trees as if she knows every root. Eli follows like a man who was electrocuted, knocked unconscious, and left to sleep in a wet field. Which he was.',art:null}],
 'ch3-chimes':[{title:'Three hollow notes',speaker:'Eli',text:'A crooked branch holds three old wooden chimes. The breeze off the water knocks them together, one low note after another. The sound follows them farther into the trees than sound should. Eli doesn’t ask. His collection of unanswered questions is growing.',art:null}],
 'ch3-arrival':[
  {title:'Willowback Village',speaker:'Eli',text:'The trees thin. A dirt road runs between timber-and-stone houses with steep roofs and smoking chimneys. A well anchors the square. Fields lie to the east; boats bump against the docks to the south. The village is alive.',art:null},
  {title:'Life after the storm',speaker:'Eli',text:'Nets, baskets, shouting across lanes. A hammer rings out from a workshop. Children chase each other around the well. Every shade and build of person seems to have found a place here. Then Eli notices the animals. None of them are normal.',art:null}
 ],
 'ch3-beasts':[
  {title:'The guardian at the door',speaker:'Eli',text:'A mastiff-sized creature rests across the blacksmith’s doorway. A heavy mane gives way to overlapping blue-gray scales. Frost gathers between them, though the morning isn’t cold. It opens one eye. Eli keeps his distance.',creature:'rimejaw-illustration'},
  {title:'Something on the roof',speaker:'Eli',text:'Above it, a bobcat-sized creature cleans its paw. Tufted ears. A stubby tail. Leathery wings folded along its back. A bird lands too close; the wings snap open. The bird’s morning gets considerably worse.',creature:'flitlynx-illustration'},
  {title:'Real. Annoyingly real.',speaker:'Eli',text:'Somebody is crossing a lizard with a dog and absolutely no adult supervision. That must be it. Eli pinches his hand. “Ow.” The girl glances back. “What’s wrong?” “Nothing. What’s with… those?”',creature:'rimejaw-illustration'},
  {title:'Rimejaw. Flitlynx.',speaker:'The girl',text:'“The big one is a Rimejaw. The little one with wings is a Flitlynx. I would stay away from the Rimejaw if I were you.” “Wasn’t planning on hugging it.” “Good. Their bite freezes whatever it catches. It took us generations to tame them.”',creature:'flitlynx-illustration'},
  {title:'Even a beast like that',speaker:'The girl',text:'“They fought with us last night, alongside the Moonfang. They’re very useful in a fight. But even a beast like that can’t hold off the shadow walkers alone. Not for long.” Eli looks back at the armored guardian. There’s that name again.',creature:'rimejaw-illustration'}
 ],
 'ch3-history':[
  {title:'Grim-jaw',speaker:'Eli',text:'“What are the shadow walkers? Because I saw one, and I’d like to know what could take on a… grim-jaw.” “Rimejaw,” she corrects. “That’s what I said.” “It isn’t.” Her voice grows flatter and quieter.',art:null},
  {title:'The dark army',speaker:'The girl',text:'“The shadow walkers are ancient. They walked this land long before we did, and they come in every shape and size. They’re what’s left of the dark army that served Croshelda, the Witch of Darkness.”',art:null},
  {title:'Four hundred years',speaker:'The girl',text:'“Four hundred years ago, Goldanir disappeared from this region. That’s when the shadow walkers began coming back. They want to devour everything in their path, and they don’t stop.”',art:null},
  {title:'What they infect',speaker:'The girl',text:'“They take the power of whatever they infect, and multiply it. Several times over.” She falls quiet. “Last night, we were lucky. We only lost one Rimejaw. No one else.” She says lucky like she means it.',creature:'rimejaw-illustration'},
  {title:'Where the hell am I?',speaker:'Eli',text:'Eli pictures the frost-scaled guardian infected and made several times worse. A witch of darkness. Creatures he has never seen. An ancient protector who vanished. Was this some kind of fantasy world? He tries to stop thinking about it. It doesn’t work.',art:null}
 ],
 'ch3-end':[{title:'The red house',speaker:'Eli',text:'The girl leads him past the square toward a larger house painted deep red, its trim picked out in white. Someone here might know a way home. Eli follows her to the porch, carrying more questions than he had at the shore.',art:null}]
};
