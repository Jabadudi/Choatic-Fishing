// Story dialogue only. Chapter 4 takes place inside the chief's red house; the guide stays on its porch.
export const CHAPTER_FOUR_STAGES=['ch4-house','ch4-oscar','ch4-world','ch4-core','ch4-journey','ch4-complete'];
export const chapterFour=s=>!!s&&CHAPTER_FOUR_STAGES.includes(s.stage);
// The meeting plays as one conversation. Each scene is a saved checkpoint and leads into the next.
export const CHAPTER4_SEQUENCE=['ch4-house','ch4-oscar','ch4-world','ch4-core','ch4-journey'];
export const CHAPTER4_OBJECTIVES={
 'ch4-house':'Chapter 4 · Meet the chief of Willowback.',
 'ch4-oscar':'Chapter 4 · Talk with the chief about Grandpa.',
 'ch4-world':'Chapter 4 · Ask the chief how to get home.',
 'ch4-core':'Chapter 4 · Show the chief the lure.',
 'ch4-journey':'Chapter 4 · Ask the chief about the road ahead.',
 'ch4-complete':'Chapter 4 complete · Rest at the guest lodge. Training with Drayfus begins at sunrise in Chapter 5.'
};
export const CHAPTER4_SCENES={
 'ch4-house':[
  {title:'The red house',speaker:'The girl',text:'“We’re here.” It isn’t a palace. Still timber and stone like the rest. But it is painted deep red with white trim, there are carvings around the door and a little covered porch, and it has the general vibe of a building that belongs to somebody in charge.',art:'hearth'},
  {title:'Permanently unimpressed',speaker:'Eli',text:'Two guards by the door confirm it. They are big. They have spears. One has a scar through his eyebrow that makes him look permanently unimpressed with Eli, which, to be fair, is probably accurate. They look at Eli. They look at the girl. They step aside.',art:'hearth'},
  {title:'Woodsmoke and herbs',speaker:'Eli',text:'Inside, it is warm and smells of woodsmoke and something herbal. An old woman stands at the hearth, pouring steaming water into a clay pot. Beside her, a man talks in a low voice. Not a farmer. He has the build, the scars and the very big sword of someone who fights for a living.',art:'hearth'},
  {title:'A short number',speaker:'Eli',text:'The old woman turns. Her eyes go to Eli and stay there. She says a quiet word to the swordsman, who gives Eli a long, measuring look on his way out, like he is working out how long Eli would last in a fight. The number seems short. The door closes behind him.',art:'hearth'},
  {title:'Sit, sit',speaker:'The old woman',text:'“Sit, sit.” She waves them toward a low round table by the fire: too small to be a dining table, too big to be a coffee table. Eli sits with the caution of someone who was nearly murdered recently. The girl sits beside him, then pauses, as if realizing something for the first time.',art:'hearth'}
 ],
 'ch4-oscar':[
  {title:'Introductions',speaker:'The girl',text:'“This is my grandmother. She’s chief of the village. And—” She stops. Winces. “Ah. We never actually introduced ourselves, did we?” They did not. She rescued him, fed him half a burned fish and marched him through a monster village, and Eli still doesn’t know her name.',art:'hearth'},
  {title:'Mara',speaker:'Mara',text:'“I’m Mara.” “Eli.” Mara turns to her grandmother, and the smile that breaks across her face is the first one Eli has seen from her that isn’t sarcastic. “Grandma, this is Oscar’s grandson.” The old woman goes very still. “Is this true?”',art:'hearth'},
  {title:'Look how you’ve grown',speaker:'The chief',text:'“Yeah,” Eli says, a bit lost. “Oscar was my grandpa.” She sets down the kettle, comes around the table and takes his face gently in both hands. “Oh, my. Look how you’ve grown. I can’t believe it’s really you.” Eli has never seen this woman in his life. Has he?',art:'hearth'},
  {title:'It isn’t a question',speaker:'The chief',text:'Her face folds, just slightly, around the eyes. “If you are here, then Oscar is gone.” “He passed away a few months ago,” Eli says. “But how did you know that? How do you know my grandpa at all?” She sits across from him, slowly, the way people sit when their knees have opinions.',art:'hearth'},
  {title:'His treasure',speaker:'The chief',text:'“Oscar never stopped talking about you. Never. He loved you so much, Eli. He was so proud to have you as his grandson. You were his treasure. More than his own son, I think, and he’d have been embarrassed to hear me say it.”',art:'hearth'},
  {title:'That sentence',speaker:'Eli',text:'Lightning. An axe murderer. A wolf the size of a pony. A dog with frost scales. Eli handled all of it. Badly, but he handled it. That sentence, he does not handle. His eyes go hot all at once. He tries very hard not to cry in front of two women he just met. He loses. Quietly, but he loses.',art:'hearth'},
  {title:'Time later',speaker:'Eli',text:'Years of letting Grandpa do all the talking. Years of assuming there would be time later. And all along, Grandpa was out here telling a woman Eli had never met how proud he was, when Eli had never done one thing worth being proud of. He wishes he had been better for him.',art:'hearth'},
  {title:'I want to go home',speaker:'Mara',text:'“What’s wrong?” Mara asks softly. Her grandmother gives a small giggle, the kind you give a kid deciding whether to cry about a fall. Eli wipes his face with the heel of his hand. “I’m fine. Just miss my grandpa.” Neither of them says anything. They don’t need to. “I want to go home.”',art:'hearth'}
 ],
 'ch4-world':[
  {title:'Three cups',speaker:'The chief',text:'She pours the tea before she answers. Three cups. “I’m not sure I know how to help you with that. But Oscar used special stones, found on the slopes of the Ember Volcano, far to the northeast, beyond the Crystal Lakes. He used them to gather enough mana to jump through space.”',art:'hearth'},
  {title:'Another world',speaker:'The chief',text:'She shakes her head slightly. “I never fully understood what he meant by that. Not even today. But I knew he came from another world. He was truly a powerful and extraordinary man.” Eli doesn’t drink the tea. He doesn’t do anything. Mana. Jump through space. Another world.',art:'hearth'},
  {title:'Like a piano',speaker:'Eli',text:'It doesn’t so much click as fall on him, like a piano dropped from a window. Not an island. Not a village with bad zoning laws and an animal-breeding problem. A completely different world. The stone road under the lake. The wolves on the shore at night. The girl who whistled fish into the basket.',art:null},
  {title:'Remembering',speaker:'Eli',text:'Grandpa told those stories a hundred times, and the details never changed. Not once, even when Eli tried to catch him out. Because he wasn’t making them up. He was remembering them. The whole time, he was telling Eli exactly where he had been. Holy shit. This is insane.',art:null},
  {title:'All good',speaker:'Mara',text:'“Is… everything okay?” Mara asks slowly, in the voice you use on someone who might faint. Excitement. Shock. Twenty years of not getting it. And underneath, a cold, quiet terror getting less quiet by the second. “Yeah. Sorry. All good.” He is not all good. But he has to get home. Somehow.',art:'hearth'},
  {title:'Heat',speaker:'Eli',text:'“I need those stones.” Eli stands, fast, like he is about to march out the door and up a volcano. “I need to get back home—” Heat flares against his thigh and a jolt shoots down his leg. “Ow!” Both women jump to their feet. “Are you okay?” they say, in perfect sync.',art:'hearth'}
 ],
 'ch4-core':[
  {title:'So much for hiding it',speaker:'Eli',text:'“I’m fine. It’s just this stupid lure. I grabbed it from Grandpa’s cabin.” So much for keeping it hidden. Still hot enough to sting, dark and translucent like old blue amber, its markings glowing faintly. Bright. Dim. Bright. “It’s been glowing in time with my heartbeat ever since I found it.”',art:'hearth'},
  {title:'Awe',speaker:'Eli',text:'Neither of them answers. Mara stares at the lure, then at Eli. So does her grandmother. It is not the look you give a guy zapped by his own fishing tackle. It is awe, and something that looks a lot like hope. “You are truly his grandson,” the old woman says quietly. She doesn’t touch it.',art:'hearth'},
  {title:'Chosen by the land',speaker:'The chief',text:'“It’s called a Region Core. The one you’re holding belongs to Reedwater. Only those the land itself chooses can resonate with a core, and take its power.” Eli looks down at the blue light pulsing in time with his heart. Chosen by the land. This world is truly, completely surreal.',art:'hearth'},
  {title:'Ingest it',speaker:'The chief',text:'“To accept its power, you have to ingest it.” “I have to what?” “Ingest it.” “Like… eat it?” “Yes.” The lure is the size of his finger, and it glows. People don’t eat things that glow. “I’ll think about it.” Eli puts it very carefully back in his pocket.',art:'hearth'}
 ],
 'ch4-journey':[
  {title:'The Listening Tree',speaker:'The chief',text:'“How do I get to this Ember Volcano?” She folds her hands on the table. “North of the village, at the edge of the Whispering Forest, there is a great hollow tree. We call it the Listening Tree. The elk spirit lives there. If it chooses to, it can take you close enough to the volcano.”',art:'hearth'},
  {title:'Much stronger',speaker:'The chief',text:'“If it chooses to,” Eli repeats. “It’s rough country between here and there. Your journey will not be easy. You’ll need proper gear, and you’ll need to be much stronger than you are now.” A generous way to describe a guy who was knocked out by his own fishing lure.',art:'hearth'},
  {title:'Two full moons',speaker:'The chief',text:'“Stay here two full moons. I’ll teach you what this world has to offer. I will prepare you for your journey.” Two months of training, monsters and possibly eating fishing tackle. But it is a plan, the first since he woke up in the mud. “Thank you. Seriously. Thank you so much, uh…”',art:'hearth'},
  {title:'Just Emilia',speaker:'Emilia',text:'She smiles. For a second, a much younger woman looks out of that face. Long dark hair. Laughing at something just off to one side. Eli has seen that laugh before. Somewhere. “Emilia. Just Emilia.”',art:'hearth'},
  {title:'At sunrise',speaker:'Emilia',text:'Then the chief comes back into her voice. “Mara. Find the boy a place to rest in the guest lodge. Both of you come back here tomorrow at sunrise, and I’ll have Drayfus begin your training.” Mara lights up like someone just handed her a birthday present. “Thank you, Grandma!”',art:'hearth'}
 ]
};
