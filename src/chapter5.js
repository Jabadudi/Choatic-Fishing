import {script,say,think,narrate} from './scene-script.js';
// Story dialogue only. Chapter 5 takes place in Eli's room at the guest lodge, then outside it the next morning.
export const CHAPTER_FIVE_STAGES=['ch5-tour','ch5-night','ch5-sleep','ch5-morning'];
export const chapterFive=s=>!!s&&CHAPTER_FIVE_STAGES.includes(s.stage);
const eli=text=>say('Eli',text),mara=text=>say('Mara',text);
export const CHAPTER5_OBJECTIVES={
 'ch5-tour':'Chapter 5 · Let Mara show you the guest lodge.',
 'ch5-night':'Chapter 5 · Rest in the bed when you are ready for the night.',
 'ch5-sleep':'Chapter 5 · Sleep.',
 'ch5-morning':'Chapter 5 · Mara is waiting outside the guest lodge. Go out and talk to her.'
};
// Mara's greeting once Chapter 5 is over. Chapter 6 picks up from this conversation.
export const CHAPTER5_MARA_GREETING='Finally! Come on, sleepyhead. Grandma’s waiting, and Drayfus hates waiting even more.';
export const CHAPTER5_SCENES={
 'ch5-tour':script([
  {title:'The guest lodge',lines:[narrate('The guest lodge is a long, low building beside the chief’s house. Eli’s room is small and plain. A bed with a straw mattress and a heavy wool blanket. A window with real glass, slightly warped. A stool.'),narrate('Mara gives him the tour, which takes about four seconds.')]},
  {title:'Bed. Window. Chamber pot.',lines:[mara('Bed.'),narrate('She points.'),mara('Window. Chamber pot.'),narrate('Eli looks at the chamber pot. The chamber pot looks back.'),think('Eli','Like a lot of things in my life right now, that is a problem for future me.')]},
  {title:'Sunrise',lines:[narrate('She sets a leather waterskin down on the stool.'),mara('This is all you need for tonight.'),narrate('She heads for the door.'),mara('I’ll see you in the morning. Sunrise, Eli.'),eli('Sunrise.'),narrate('She closes the door behind her, and Eli is alone.')]}
 ]),
 'ch5-sleep':script([
  {title:'Still pulsing',lines:[narrate('It is already late. The window has gone from gold to violet to black while Eli sits on the edge of the bed, his hand resting on his pocket over the lure.'),think('Eli','Still warm. Still pulsing, slow and steady. A little faster whenever I think too hard about anything.')]},
  {title:'Shylee',lines:[think('Eli','Tomorrow I start training for something I don’t understand, in a world I don’t understand, so I can find a mountain I’ve never seen and some stones I can’t describe. And get home.'),think('Eli','Shylee is there. Sitting on the couch, probably, checking her phone for a text I promised to send the second I got to the island. I never sent it.'),think('Eli','Love you, dummy. I have to get back to her.')]},
  {title:'Grandpa was here',lines:[think('Eli','But I can’t shake it. The excitement. Grandpa was here. He walked this village, sat at that table, drank that tea. And now I’m here too.'),narrate('He can’t sleep. So he does what every normal human being does when they can’t sleep.')]},
  {title:'Counting sheep',lines:[think('Eli','One sheep. Two sheep. Three sheep.'),think('Eli','Four shee… Fiiive shhh…'),narrate('Snnnrrrk.')]},
  // The vision plays as a full-screen video page. It advances by itself when the video ends.
  {title:'The vision',video:'eli-vision',lines:[narrate('A voice at his ear: “Accept me. You have to save her.” A girl with long white hair and storm-purple eyes, crying. Black light bursting out of her. Something huge tearing Eli up into the sky as he screams a name he never learned. “Croshelda!”')]},
  {title:'Bang. Bang. Bang.',lines:[narrate('Sunlight. Eli is on the floor of his room, on his back, tangled in the wool blanket. The lure is warm in his fist.'),narrate('Somebody is pounding on the door.'),mara('Hey!! Eli! Wake up!!')]},
  {title:'It felt like a memory',lines:[think('Eli','Croshelda. It didn’t feel like a dream. Dreams go blurry the second you wake up. I can still see her hair. Her eyes. The tears on her face.'),mara('Eli! Sunrise! Remember?'),eli('Coming! I’m coming!')]}
 ])
};
