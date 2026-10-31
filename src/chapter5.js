import {script,say,think,narrate,VOICE} from './scene-script.js';
// Story dialogue only. Chapter 5 takes place in Eli's room at the guest lodge, through the night he swallows the Region Core.
export const CHAPTER_FIVE_STAGES=['ch5-tour','ch5-night','ch5-sleep','ch5-morning'];
export const chapterFive=s=>!!s&&CHAPTER_FIVE_STAGES.includes(s.stage);
const eli=text=>say('Eli',text),mara=text=>say('Mara',text);
export const CHAPTER5_OBJECTIVES={
 'ch5-tour':'Chapter 5 · Let Mara show you the guest lodge.',
 'ch5-night':'Chapter 5 · Rest in the bed when you are ready for the night.',
 'ch5-sleep':'Chapter 5 · Sleep.',
 'ch5-morning':'Chapter 6 · Blue writing hangs in the air in front of Eli. Read it.'
};
// Mara's greeting while she pounds on Eli's door at the end of Chapter 5. Chapter 6 opens in his room.
export const CHAPTER5_MARA_GREETING='Eli! Sunrise! Remember? Get dressed and get out here!';
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
  // Eli swallows the Region Core between the vision and sunrise. Finishing this scene sets story.coreIngested and takes the core out of the backpack.
  {title:'Still dark',lines:[narrate('Eli is on the floor of his room, on his back, in the dark. He is soaked in sweat and gulping air like he has been drowning.'),think('Eli','What was that? It didn’t feel like a dream. Dreams go blurry the second you wake up. I can still see her hair. Her eyes. The tears on her face.'),think('Eli','It felt like a memory. Or a premonition. Or something worse that I don’t have a word for yet.'),think('Eli','Croshelda. The Witch of Darkness.')]},
  {title:'Accept me',lines:[say(VOICE,'Save her.'),narrate('The lure is still in his hand. It is glowing, steady and patient, in time with his heartbeat.'),think('Eli','A limp-noodle-looking glowing thing that apparently holds the power of an entire region, and wants to live in my stomach.'),eli('Ingest it, huh…?')]},
  {title:'Eli decides',lines:[narrate('He sits up. He looks at the Region Core for a long time.'),think('Eli','Grandpa did this. Emilia said so. Mara said people think about it for months.'),think('Eli','I don’t have months. Shylee doesn’t have months.'),narrate('He raises it over his mouth, says his prayers and drops it in. One slurp. One gulp. Like a shot of tequila.'),narrate('For about one second, nothing happens.')]},
  {title:'Everything at once',lines:[eli('Ugh! My head… my stomach… Ugh!'),narrate('Lights bloom in front of his eyes. Little glowing shapes hang in the air, lines of writing he cannot read because the room will not stop spinning.')]},
  {title:'Uninvited guest',lines:[narrate('Something moves in the corner of the room. An ocelot, spotted and sleek, sitting there like it owns the place.'),narrate('It opens its mouth.'),narrate('And it talks.'),think('Eli','I try my best not to pass out. I really do.'),narrate('He passes out.')]},
  {title:'Bang. Bang. Bang.',lines:[narrate('Sunlight. Eli is on the floor of his room, on his back, tangled in the wool blanket. Something warm sits low in his stomach, right where the lure went. Faint blue writing still hangs in the air, and it is the first thing he sees.'),narrate('Somebody is pounding on the door.'),mara('Hey!! Eli! Wake up!!'),mara('Eli! Sunrise! Remember?'),eli('Coming! I’m coming!')]}
 ])
};
