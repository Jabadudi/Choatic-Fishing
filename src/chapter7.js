import {script,say,think,narrate} from './scene-script.js';
import {CORE,OCELOT} from './chapter6.js';
// Story dialogue and route only. Chapter 7 starts when Eli goes to bed at the end of Chapter 6: Drayfus wakes him
// in the dark, he runs the edge of Willowback until the sun comes up, eats breakfast with Mara, holds a squat in the
// training circle until Drayfus freezes at the word "grandmother", runs again, and ends on the grass behind the lodge.
export const CHAPTER_SEVEN_STAGES=['ch7-run','ch7-breakfast','ch7-squat','ch7-hold','ch7-laps','ch7-rest','ch7-complete'];
export const chapterSeven=s=>!!s&&CHAPTER_SEVEN_STAGES.includes(s.stage);
// The guard posts on the path around Willowback, in running order. The run leaves the lodge door, climbs the forest
// track on the north side of the square, swings east past the Willow Hearth into the Merchant Quarter (its north lane,
// the Willowback Gate, the Stonefall lane), comes back across the square and down the lane to the Port, runs the
// length of the upper deck and finishes at the watchtower over the lagoon, where the sun comes up.
export const PERIMETER=[
 {areaId:'village',x:740,y:220,place:'the forest track'},
 {areaId:'village',x:1840,y:340,place:'the Willow Hearth'},
 {areaId:'village-market',x:420,y:150,place:'the north lane'},
 {areaId:'village-market',x:1470,y:530,place:'the Willowback Gate'},
 {areaId:'village-market',x:890,y:1260,place:'the Stonefall lane'},
 {areaId:'village-port',x:1580,y:300,place:'the east sheds'},
 {areaId:'village-port',x:240,y:300,place:'the west sheds'},
 {areaId:'village',x:150,y:850,place:'the watchtower',tower:true}
];
// The watchtower stands at the west end of the square, over the lagoon; Drayfus watches from the platform.
export const WATCHTOWER={x:150,y:800};
export const TOWER_PLATFORM={x:150,y:690};
// Eli squats in the middle of the training circle, just in front of Drayfus.
export const HOLD_SECONDS=20;
// Where Eli lies down at the end of the day: the grass behind the guest lodge, out of sight of the square.
export const REST_SPOT={x:520,y:440};
const eli=text=>say('Eli',text),mara=text=>say('Mara',text),drayfus=text=>say('Drayfus',text),ocelot=text=>say(OCELOT,text),core=text=>say(CORE,text);
export const CHAPTER7_OBJECTIVES={
 'ch7-breakfast':'Chapter 7 · Breakfast. Mara is waiting in the chief’s kitchen.',
 'ch7-squat':'Chapter 7 · Go to the training yard, past the Willowback Gate, and report to Drayfus.',
 'ch7-rest':'Chapter 7 · Lie down on the grass behind the guest lodge.',
 'ch7-complete':'Chapter 7 complete · Not my grandmother. Then who?'
};
export const runObjective=(stage,posts)=>stage==='ch7-laps'
 ?`Chapter 7 · Eleven laps. Keep going past the guard posts, whatever your legs say (${posts}/${PERIMETER.length}).`
 :`Chapter 7 · Run the path around Willowback, past every guard post to the watchtower, before the sun comes up (${posts}/${PERIMETER.length}).`;
export const holdObjective=seconds=>`Chapter 7 · Hold the squat in the middle of the circle, in front of Drayfus. Don’t move (${Math.floor(seconds)}/${HOLD_SECONDS} seconds).`;
// What the guards and Eli's legs say as the posts go by.
export const POST_LINES={
 'ch7-run':['A guard wrapped in a cloak, leaning on a spear: “Morning, Oscar’s boy.”','“Morning, Oscar’s boy.” He is trying very hard not to laugh.','A guard asleep on his feet opens one eye. “Morning, Oscar’s boy.” It closes again.','“Morning, Oscar’s boy.” Eli has stopped being able to feel his feet.','“Morning, Oscar’s boy.” The wind off the river cuts straight through Eli’s shirt.','“Morning, Oscar’s boy.” Eli could not tell you his own name.','“Morning, Oscar’s boy.” The sky behind the watchtower is going gray.'],
 'ch7-laps':['Lap five. His legs give out. He gets up.','“Afternoon, Oscar’s boy.” Eli walks this part.','Lap seven, on his hands and knees, to see if it counts. It doesn’t.','“Afternoon, Oscar’s boy.” The guard looks worried now.','Still going.','Nearly. Nearly.','“Afternoon, Oscar’s boy.” Nearly there.']
};
export const IDLE_NAG='From the watchtower, Drayfus is watching your shoulders. Keep moving.';
export const HOLD_NOTES={7:'Eli’s legs start to shake: a fine, fast tremble, like a plucked string.',14:'“This is where your power is,” Drayfus says. “Not your arms. Not your head. Your legs.”'};
export const HOLD_RESET='Eli’s heel comes up. Drayfus pushes his ankle back out with one boot. “Again.”';
export const CHAPTER7_SCENES={
 // Plays in Eli's room when he goes to bed at the end of Chapter 6.
 'ch7-up':script([
  {title:'Up',lines:[narrate('Drayfus doesn’t knock. The door of the guest lodge swings open on its own weight, a lantern comes in, and behind it a very large shape stands in the dark.'),drayfus('Up.'),narrate('Eli opens one eye. The window is black. Not dawn-black. The kind of black that has been awake all night and is not ready to hand anything over.'),eli('It’s not morning.'),drayfus('It is for you.'),eli('The sun isn’t up.')]},
  {title:'Eleven hundred paces',lines:[drayfus('Then you have until it is. The path around Willowback is eleven hundred paces. You will run it until the sun shows. If you stop, I will know.'),eli('How will you know?'),drayfus('Because I’ll be up in the watchtower, watching your shoulders.'),narrate('He leaves. He leaves the door open, which Eli takes personally.')]},
  {title:'Everything',lines:[think('Eli','Here is a list of everything that hurts when I try to sit up. Everything.'),narrate('His thighs have gone past sore and out the other side into a tight, buzzing numbness. His palms are raw where the bucket handles were. And the hollow place behind his breastbone is still mostly hollow. Mostly. There is a little something in it now, like water at the bottom of a well. A cupful.'),core('Reserves: recovering.')]},
  {title:'Eight weeks',lines:[ocelot('Good morning.'),narrate('It is on the stool again. Eli is starting to think the stool is its.'),eli('Is this how the training goes? Every day? Before the sun?'),ocelot('Eight weeks.'),eli('I’m going to die.'),ocelot('No. But you will wish to, around the third week. That is normal. It passes.')]},
  {title:'You did not dream',lines:[narrate('He puts his shoes on sitting down. The ocelot watches him tie the second lace.'),ocelot('You did not dream.'),eli('No. I didn’t.'),ocelot('I thought not.'),eli('Is that bad?'),narrate('In the lantern light from the open door, its blue eyes have gone narrow, the way a cat’s do when something on the other side of a window has moved.'),ocelot('It is interesting.'),think('Eli','I know a lot of words now. Interesting is starting to sound like the worst one.')]}
 ]),
 // When Eli reaches the watchtower at the end of the dawn run.
 'ch7-sunrise':script([
  {title:'Sunrise',lines:[narrate('The sun comes up while Eli is bent over with his hands on his knees, trying very hard not to throw up on a flower bed. A thin line of gold at the edge of the world, then a bar, then a rush of light over the roofs and the lagoon, and every window in the village goes bright at once.'),think('Eli','It’s kind of beautiful. I hate it.')]},
  {title:'Eleven laps',lines:[drayfus('Eleven laps.'),eli('I thought it was one.'),drayfus('It was until you stopped counting.'),narrate('He is crouched on the edge of the watchtower platform, one boot on the rail. In the new light the scar across his jaw looks paler, and there is something almost like tiredness in his face. He has probably been up all night.'),drayfus('Water.'),narrate('A waterskin drops into Eli’s hands. He drinks half of it before he realizes he has stopped breathing to do it.')]},
  {title:'Still alive',lines:[drayfus('You didn’t stop.'),eli('I wanted to.'),drayfus('That wasn’t the question.'),narrate('He comes down the ladder in three quick steps and lands lightly for a man his size.'),drayfus('Mara has been running that path since she was nine.'),eli('Is that why she’s so fast?'),drayfus('That is why she is still alive.')]},
  {title:'Did you throw up?',lines:[narrate('Mara comes around the corner at a jog. She isn’t out of breath. Her hair is tied back tight and she moves like running is just walking with ambitions. She looks at the flower bed, then at Eli.'),mara('Did you throw up?'),eli('No.'),mara('You’re about to.'),eli('I’m not.'),mara('You’re green. Okay, fine, I’ll be nice. You did better than I thought.')]},
  {title:'Thirty',lines:[eli('How many did you do?'),mara('Thirty.'),eli('Thirty laps?'),mara('I started before you. Obviously.'),narrate('She holds out her hand and hauls him upright like he weighs nothing.'),mara('Come on. Breakfast. You’ll need it.'),narrate('Eli looks for Drayfus. He has already gone.')]}
 ]),
 'ch7-breakfast':script([
  {title:'The food is good',lines:[think('Eli','Here’s something about this world I didn’t expect: the food is good. Not good for a fantasy village. Good.'),narrate('Thick, nutty porridge with some dried fruit Eli doesn’t recognize. Bread, still hot. Butter that tastes like actual grass. Smoked river fish cut thin and laid over the top. He eats three bowls. Mara watches him do it with growing alarm.'),mara('You eat like you’ve been starved.'),eli('I was running for two hours.'),mara('I don’t eat like that.')]},
  {title:'You’re a mess',lines:[eli('You’re built different. I mean, like, you do it every day. You’ve adapted.'),narrate('She gives him the look you would give a dog that has very proudly brought you something dead.'),mara('You’re a mess.'),narrate('But she pushes the rest of the bread toward him.')]},
  {title:'Arguing with it',lines:[narrate('Emilia’s kitchen is warm and small, with drying herbs hanging from the rafters. The old woman herself is nowhere to be seen. Yesterday in the circle she said something about Grandpa that Eli hasn’t been able to stop thinking about. Sometimes he’d laugh at it. Sometimes he’d argue with it.'),think('Eli','I haven’t told her about the ocelot. I’m not going to. But I keep thinking about Grandpa, alone on the dock of the old fishing hut, arguing with something nobody else could see.'),mara('What are you thinking about?'),eli('Nothing.'),mara('You’ve been staring at that bread for a minute.'),eli('It’s very good bread.'),narrate('She narrows her eyes, then shrugs. Eli takes it as a win.')]}
 ]),
 // At the training circle: Drayfus sets the stance, and then Eli has to hold it.
 'ch7-stance':script([
  {title:'Not yet',lines:[narrate('Drayfus is waiting in the circle with nothing in his hands. No sword. No bucket. The rod is leaning against the fence where he left it, and Eli looks at it with real longing.'),drayfus('Not yet.'),eli('I wasn’t going to—'),drayfus('You were going to look at it until I let you touch it, and I’m not going to let you touch it. Come here.')]},
  {title:'Squat',lines:[drayfus('Squat. Like you’re sitting in a chair.'),narrate('He walks around Eli twice, slowly, the way you would inspect a horse. Then he puts one boot against Eli’s ankle and pushes it three inches wider.'),drayfus('Back straight.'),eli('It is straight.'),drayfus('It isn’t. Chest up. Your weight is on your toes. Move it to your heels. There.'),narrate('All the weight in the world comes down through Eli’s thighs. It shakes. But it also feels oddly solid, like he is standing on something instead of hanging above it.'),drayfus('Hold it. If you move, we start again.')]}
 ]),
 // When the squat has been held: the cat, Oscar, and the question Drayfus won't answer.
 'ch7-cat':script([
  {title:'The cat',lines:[drayfus('Everything you do will start here. If it doesn’t, it’s coming from somewhere it shouldn’t.'),think('Eli','A man with weak legs bends from the waist and hauls the box up with his back and his arms and his teeth.'),drayfus('Did you talk to the cat?'),narrate('Eli almost falls over.'),eli('The… what?'),drayfus('The cat. Don’t pretend. You stare at that corner of the stool when you think no one’s looking.'),eli('I don’t—there’s no—'),drayfus('Oscar did that too.')]},
  {title:'Talking to no one',lines:[drayfus('The summer he trained me, he used to sit up in that tower at night. Talking to no one. I thought he’d gone soft in the head. I was a boy. I was an idiot.'),eli('What did it say? To him. The thing he was talking to.'),drayfus('I never asked.'),eli('Why not?'),drayfus('Because I was a boy, and he was the strongest man I’d ever met, and I thought if I asked, he’d stop.')]},
  {title:'Grandmother',lines:[narrate('Eli stays in the squat. It seems like the only thing he can do. Then, because he has been waiting since last night, he asks, and he watches Drayfus’s face while he does. The ocelot told him to.'),eli('Did Grandpa ever talk about my grandmother?'),narrate('Drayfus doesn’t move. Not his hands, not his shoulders, not his eyes. For two heartbeats it is as if somebody reached into him and pressed pause. Then something behind his face closes, hard, like a shutter slamming down in a storm.'),drayfus('Hold that for another minute.'),eli('Drayfus.'),drayfus('A minute.'),eli('Did he?'),drayfus('Run. When you can stand, run. Eleven laps. Now.')]}
 ]),
 // Behind the guest lodge, well past noon.
 'ch7-grass':script([
  {title:'Bread',lines:[narrate('It is well past noon when Eli falls onto the grass beside the guest lodge and lies there, staring at a sky the color of a robin’s egg. Mara sits down next to him without a word and sets something on his chest. A flat, round loaf of bread, still warm.'),mara('Don’t tell anyone.'),narrate('He eats it in four bites.')]},
  {title:'His face',lines:[mara('He didn’t answer you. Did he? I could see from the fence. I couldn’t hear. But I saw his face.'),eli('What did you see?'),mara('I’ve known Drayfus my whole life. I’ve seen him get stabbed. I’ve seen him bury a Rimejaw he raised from a pup. I’ve never seen him look like that. Whatever you asked, don’t ask him again.'),eli('Why?'),mara('Because it’s not that he doesn’t want to tell you. It’s that he’s afraid of what happens when he does.')]},
  {title:'The photograph',lines:[narrate('In Eli’s stomach, where the core settled, something stirs, faint and restless, like it is listening.'),think('Eli','Grandmother. Grandpa never spoke of her. In the photograph there was only one woman, with long dark hair, laughing at something off to the side. I was so sure it was her.'),think('Eli','Long dark hair. Emilia, laughing. A much younger woman looking out of an old face, for just a second, when she told me her name.'),eli('Mara. In the picture I found, there was a woman with Grandpa. A young woman. I think it was your grandmother.')]},
  {title:'Not mine to say',lines:[mara('Grandma? That’s not strange. She and Oscar were close. Everyone knows that. She was the one who found him, when he first came to this world. She taught him how to live here.'),mara('She loved him. A lot. But he didn’t—'),eli('He didn’t what?'),mara('It’s not mine to say. Ask her. Or don’t. But not today.'),narrate('She goes inside, looking suddenly very tired and very young, and not at all like the girl who was laughing at him from a fence.')]},
  {title:'Then who?',lines:[narrate('A thin line of cloud slides across the sky. On the roof of the chief’s house the Flitlynx stretches its wings and goes still, looking east, toward a horizon Eli can’t see.'),think('Eli','Not my grandmother. Then who?'),core('[Still Water] has activated.'),narrate('He breathes in. He lets it sink. But for the first time since he arrived in this world, it doesn’t feel like calm. It feels like holding his breath.')]}
 ])
};
