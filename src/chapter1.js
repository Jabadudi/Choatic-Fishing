// Chapter 1 and Chapter 2 dialogue. Story progression stays in story.js.
import {script,say,think,narrate,VOICE} from './scene-script.js';
const eli=text=>say('Eli',text),girl=text=>say('The girl',text);
export const CHAPTER1_SCENES={
 arrival:script([
  {title:'The Old Fishing Hut',art:null,lines:[narrate('The captain’s boat shrinks into the distance. Only now does Eli realize he never asked when he was coming back.'),eli('That’s a problem for future me.')]},
  {title:'No service',art:null,lines:[narrate('The number on the back of his hand is no use. Neither is the text he promised Shylee. Eli pockets his phone and looks up the path toward Grandpa’s cabin.')]}
 ]),
 lure:script([
  {title:'Something on the shelf',art:'lure',lines:[narrate('The floor is swept. The windows are clean. Fresh line hangs from the rods. Someone has been looking after this place. Then Eli notices blue light leaking from a little wooden box.')]},
  {title:'Almost a heartbeat',art:'lure',lines:[narrate('The lure is dark and translucent, its markings suspended inside it. For a moment it feels alive. Eli puts it back.'),think('Eli','Grandpa can keep his haunted fishing equipment.')]}
 ]),
 photo:script([
  {title:'A familiar grin',art:'photo',lines:[narrate('Grandpa, younger than Eli is now. A laughing woman with long dark hair. An enormous gray wolf at their feet. On the back: the same strange markings as the lure.')]},
  {title:'Questions left behind',art:'photo',lines:[narrate('Grandpa used to sit on this dock and watch the trees as though he was waiting for someone.'),think('Eli','I never asked enough questions. Maybe this place still has some answers.')]}
 ]),
 // The weapon rack hands Eli his tools for the evening: the rod first, the bow once supper is started.
 'rack-rod':script([
  {title:'Grandpa’s rack',art:null,lines:[narrate('A weapon rack is bolted to the wall beside the window. Two fishing rods. An old recurve bow. A quiver of arrows with fresh fletching.'),think('Eli','Fresh line. Fresh feathers. Who keeps an empty cabin this ready?'),narrate('Eli lifts down the shorter rod. It settles into his hand like it has been waiting for him.'),think('Eli','Two sardines from the dock. Then we’ll see about the rest of dinner.')]}
 ]),
 'rack-bow':script([
  {title:'Bigger game',art:null,lines:[narrate('Two sardines are not a dinner. Eli takes the bow down from its pegs. The string is waxed. The arrows are straight. Grandpa’s handwriting on the quiver strap reads: three, if you mean to eat well.'),think('Eli','I saw deer in the meadow on the walk up from the dock. I’ve never hunted anything in my life.'),narrate('He tests the draw. It comes back to him faster than it should, like a memory of Grandpa’s hands over his.'),eli('Okay. Three deer. How hard can it be?')]}
 ]),
 dinner:script([
  {title:'A place at the table',art:null,lines:[narrate('Eli grills the sardines and slow-cooks the venison with spices from the suspiciously well-stocked kitchen. It is far too much food for one person. He sets the photograph opposite him anyway.'),eli('Who is she? Why did you stop bringing me here?'),narrate('For a little while, he feels less alone.')]}
 ]),
 // Action beats stay one page each: the night attack keys its playback to these pages.
 storm:script([
  {title:'12:30 A.M.',art:'lure',artMoment:'storm-lure',weather:'storm',lines:[narrate('Rain hammers the roof. The walls creak beneath the wind. Eli wakes to blue light pouring from the shelf. Bright. Dim. Exactly in time with his heartbeat.')]},
  {title:'Take it',art:'lure',artMoment:'storm-lure',weather:'storm',lines:[narrate('A woman’s voice, close beside him. The room is empty.'),say(VOICE,'Take it. You have to live.'),narrate('Eli crosses the room and closes his hand around the warm lure.')]},
  {action:'escape',title:'The strike',art:null,weather:'storm',lines:[narrate('Lightning tears open the roof. A beam throws Eli to the floor. Through the broken wall, another flash reveals a tall figure approaching with an axe. Eli pockets the lure and runs.')]},
  {action:'collapse',title:'Three steps',art:null,weather:'storm',lines:[narrate('Heat burns through Eli’s pocket. His muscles lock and he falls into the mud. The figure keeps coming. Ten feet. Eight. Six.')]},
  {action:'rescue',title:'Out of the darkness',art:'rescue',weather:'storm',lines:[narrate('A huge gray wolf slams into the figure. Snarling. A shout. The axe hits the ground. Eli’s last sight is silver fur against the rain.')]},
  {action:'blackout',title:'Everything goes black',art:null,weather:'blackout',lines:[narrate('The rain disappears. The lure is still warm in his closed hand.')]}
 ]),
 awakening:script([
  {title:'Warmth',art:'campfire',lines:[narrate('Woodsmoke. Fish. Morning mist. A girl sits beside a campfire, turning a fish over the flames on Grandpa’s fishing rod. Behind her, the cabin’s broken beams stand black against the sky.')]},
  {title:'You’re finally awake',art:'campfire',lines:[narrate('She notices Eli stirring and smiles.'),girl('You’re finally awake.'),narrate('The lure is still warm in his pocket. He survived the night, but nothing about this shore feels quite the same.')]}
 ])
};
export const CHAPTER2_SCENES={
 'ch2-shadow':script([
  {title:'Shadow Walker',art:'campfire',lines:[narrate('Eli sits up too fast. The storm comes back in pieces: the axe, the burning lure, silver fur against the lightning. Every muscle aches. His rescuer is still turning a fish over the fire on Grandpa’s rod.')]},
  {title:'Easy',art:'campfire',lines:[girl('Good thing I got to you in time last night. You could have been dead if that shadow walker had reached you.'),narrate('She says it as casually as good thing you brought an umbrella. Eli clears his throat.'),eli('Shadow walker?')]},
  {title:'The monsters of the night',art:'campfire',lines:[girl('The thing with the axe. My home village was attacked last night. A whole pack of them came out of the forest after dark. We fought them off together with the Moonfang.'),eli('The what?')]},
  {title:'The Moonfang',art:'campfire',wolf:true,lines:[girl('The wolves. They roam the land and keep its peace from the monsters of the night. They’ve guarded the villages for as long as anyone remembers.'),narrate('Grandpa’s stories come uncomfortably close to mind.')]},
  {title:'Its target',art:'campfire',lines:[girl('Near the end of the fight, I noticed one breaking away. It was heading for the shore, like it was going somewhere specific. So I chased it down. And before I knew it, you were its target.')]},
  {title:'Still warm',art:'campfire',lines:[narrate('It came straight for him. Eli closes his hand around the lure in his pocket. Still there. Still warm.'),think('Eli','I’ll keep it hidden. Somehow, showing it to her doesn’t feel right. Not yet.')]}
 ]),
 'ch2-cabin':script([
  {title:'Wait',art:'campfire',lines:[narrate('Her eyes move from Eli to the ruined cabin, then back again. The worry gives way to suspicion. The fish begins to burn. She doesn’t notice.'),girl('What were you even doing in my grandma’s old home anyway?')]},
  {title:'Two families. One cabin.',art:null,lines:[eli('Your grandma’s home? This is my grandpa’s fishing cabin!'),narrate('Eli reaches for the old map.'),eli('He left it to me. With his handwriting on it. I came out here yesterday, on a boat, which, by the way, was the worst two hours of my entire—')]},
  {title:'Boat',art:null,lines:[narrate('He stops. The captain isn’t coming back. He never arranged a pickup. His phone doesn’t work. The cabin has been struck by lightning. Something with an axe came specifically to kill him.'),think('Eli','And I’m on an island. With no way off it.')]}
 ]),
 'ch2-island':script([
  {title:'A really big log',art:'campfire',lines:[eli('Speaking of boats. I need one.'),narrate('He struggles upright.'),eli('Canoe. Raft. A really big log. I need to get off this island as soon as possible.'),narrate('She doesn’t move.'),girl('Island?')]},
  {title:'This is no island',art:'campfire',lines:[eli('Yes. Island.'),narrate('Eli waves at everything.'),eli('Water all the way around it. Very small. Lots of trees. One cabin, recently exploded.'),narrate('She looks at him carefully.'),girl('This is no island.')]},
  {title:'Two hours',art:null,lines:[narrate('The words hang between them. Somewhere in the mist, a bird calls.'),eli('Okay. Funny. I took a boat here. From the coast. For two hours. I felt every one of those two hours.'),narrate('She doesn’t laugh.')]},
  {title:'Someone who might',art:'campfire',lines:[narrate('She sets Grandpa’s rod across two stones by the fire.'),girl('If you really are his grandson, then I don’t know how to help you get back.'),narrate('Eli’s stomach drops.'),eli('Back where?'),narrate('She offers him a hand.'),girl('But I know someone who might. Come with me.')]}
 ]),
 'ch2-departure':script([
  {title:'Come with me',art:null,lines:[narrate('Eli looks once more at the cabin and the empty water. The lure is warm against his leg. His rescuer waits at the edge of the clearing.'),think('Eli','Someone in her village might have answers. For now, following her is the only plan I have.')]}
 ]),
 'ch2-end':script([
  {title:'Toward the trees',art:null,lines:[narrate('The dock and the broken cabin fall behind them. Ahead, the path climbs inland.'),think('Eli','I still have no idea where I am, or who this girl is. But for the first time since the captain left, I’m not facing it alone.')]}
 ])
};
