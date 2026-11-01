// Gameplay classification only. Sprite dimensions never determine these values.
export const ENTITY_TYPES=Object.freeze({PLAYER:'player',NPC:'npc',ANIMAL:'animal'});
export const BEHAVIORS=Object.freeze({PASSIVE:'passive',DEFENSIVE:'defensive',AGGRESSIVE:'aggressive'});
// Which of the four walk directions a step faces. Sideways wins a tie, so diagonals use the side view.
export const facingFor=(dx,dy)=>Math.abs(dx)>=Math.abs(dy)?(dx<0?'left':'right'):dy<0?'up':'down';
export const BEHAVIOR_LABELS=Object.freeze({passive:'Passive',defensive:'Defensive',aggressive:'Aggressive'});
// Friendly companions never join animal damage targets or hunting rewards.
export const NPC_TYPES=Object.freeze({
 villager:{entityType:ENTITY_TYPES.NPC,huntable:false,interactions:['talk'],talkRange:75},
 rimejaw:{entityType:ENTITY_TYPES.NPC,huntable:false,interactions:['examine'],talkRange:90},
 flitlynx:{entityType:ENTITY_TYPES.NPC,huntable:false,interactions:['examine'],talkRange:90},
 mara:{entityType:ENTITY_TYPES.NPC,huntable:false,interactions:['talk'],talkRange:95,
  guide:{speed:88,travelSpeed:148,waitRange:240,arrivalRange:110,radius:14}}
});
export const ANIMAL_TYPES=Object.freeze({
 rabbit:{name:'Rabbit',maxHealth:18,radius:10,habitat:'land',speed:70,fleeSpeed:180,fearRange:55,huntXp:10,loot:'rabbit'},
 deer:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:12,attackRange:52,attackWindup:.4,attackCooldown:.75,chaseSpeed:115,leashRange:320,name:'Deer',maxHealth:60,radius:18,habitat:'land',speed:48,fleeSpeed:175,fearRange:150,huntXp:25,loot:'deer'},
 // Red fox: shyer and much quicker than a rabbit, so it bolts from further off and a bow beats chasing it.
 fox:{name:'Red Fox',maxHealth:26,radius:12,habitat:'land',speed:64,fleeSpeed:215,fearRange:120,huntXp:14,loot:'fox'},
 // Bristleback boar: leaves Eli alone until hurt, then charges. The first animal that can really hurt him.
 boar:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:18,attackRange:54,attackWindup:.5,attackCooldown:.85,chaseSpeed:128,leashRange:300,name:'Bristleback Boar',maxHealth:95,radius:20,habitat:'land',speed:40,fleeSpeed:150,fearRange:150,huntXp:35,loot:'boar'},
 // Grey elk: the Elk Spirit's herd. Calm until hurt, then a long antler sweep with a lot of health behind it.
 elk:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:22,attackRange:68,attackWindup:.55,attackCooldown:.95,chaseSpeed:225,leashRange:340,name:'Grey Elk',maxHealth:150,radius:26,habitat:'land',speed:46,fleeSpeed:170,fearRange:160,huntXp:50,loot:'elk'},
 // Brown bear: the strongest animal in the woods. Calm until hurt, then it rears up and roars (roar: seconds) before
 // coming after Eli, and every claw swipe hits hard. Faster than Eli once angry: think twice before hurting one.
 bear:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:30,attackRange:62,attackWindup:.6,attackCooldown:1.05,chaseSpeed:215,leashRange:320,roar:1.2,name:'Brown Bear',maxHealth:240,radius:26,habitat:'land',speed:36,fleeSpeed:140,fearRange:160,huntXp:75,loot:'bear'},
 // Grey heron: stalks the shallows at the delta's heron landmarks, and takes flight from further off than a deer.
 heron:{name:'Grey Heron',maxHealth:30,radius:12,habitat:'land',speed:28,fleeSpeed:200,fearRange:150,huntXp:18,loot:'heron'},
 // Shore crab: scuttles the tide pools and nips back when hurt. Small and weak, but quick to retaliate.
 crab:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:8,attackRange:40,attackWindup:.4,attackCooldown:.7,chaseSpeed:92,leashRange:220,name:'Shore Crab',maxHealth:40,radius:12,habitat:'land',speed:34,fleeSpeed:120,fearRange:90,huntXp:16,loot:'crab'},
 // Crag goat: stubborn on the heights. Hurt it and it rears and headbutts hard enough to throw Eli back (knockback).
 goat:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:16,attackRange:56,attackWindup:.5,attackCooldown:.9,chaseSpeed:125,leashRange:300,knockback:240,name:'Crag Goat',maxHealth:80,radius:18,habitat:'land',speed:44,fleeSpeed:165,fearRange:140,huntXp:30,loot:'goat'},
 // River otter: quick in the water and gone in a dive.
 otter:{name:'River Otter',maxHealth:30,radius:12,habitat:'water',speed:40,fleeSpeed:190,fearRange:130,huntXp:18,loot:'otter'},
 // Reed duck: paddles the pools and flies off; the easiest thing on the water to hunt.
 duck:{name:'Reed Duck',maxHealth:18,radius:10,habitat:'water',speed:30,fleeSpeed:150,fearRange:110,huntXp:8,loot:'duck'},
 // Silver pike: the first animal that fights back from the water. Hurt it and it lunges at Eli on the bank or a dock;
 // its reach covers the shore line, but it never leaves the water.
 pike:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:14,attackRange:72,attackWindup:.45,attackCooldown:.85,chaseSpeed:120,leashRange:260,name:'Silver Pike',maxHealth:55,radius:14,habitat:'water',speed:36,fleeSpeed:140,fearRange:100,huntXp:26,loot:'pike'},
 // Grey seal: basks off the skerries and slides away into the sea.
 seal:{name:'Grey Seal',maxHealth:90,radius:22,habitat:'water',speed:30,fleeSpeed:150,fearRange:150,huntXp:30,loot:'seal'},
 turtle:{name:'Turtle',maxHealth:45,radius:14,habitat:'water',speed:18,fleeSpeed:42,fearRange:85,huntXp:15,loot:'turtle'},
 eel:{name:'Eel',maxHealth:24,radius:12,habitat:'water',speed:36,fleeSpeed:100,fearRange:110,huntXp:12,loot:'eel'},
 // Monster: hunts Eli on sight (src/monsters.js). Slower than Eli at a run, so he can always break away.
 'shadow-walker':{behavior:BEHAVIORS.AGGRESSIVE,spriteId:'nightwalker',name:'Shadow Walker',maxHealth:80,radius:16,habitat:'land',speed:38,fearRange:0,
  noticeRange:240,noticeDelay:.6,loseRange:460,leashRange:620,chaseSpeed:122,attackDamage:16,attackRange:58,attackWindup:.55,attackRecover:.4,attackCooldown:1.5,huntXp:40,loot:'shadow-walker'},
 // The shadow walker kinds: the same hunt, each with its own strengths. All stay slower than Eli at a run.
 // Hollow Stag: an infected deer or elk. Gallops after Eli (its sheet has a run row), low health, antler swing.
 'hollow-stag':{...monster('Hollow Stag'),maxHealth:60,radius:18,speed:48,noticeRange:260,chaseSpeed:165,attackDamage:14,attackRange:64,attackWindup:.45,attackRecover:.35,attackCooldown:1.3,huntXp:45,loot:'hollow-stag'},
 // Gloam Boar: an infected boar. Less health than a boar, a harder hit that throws Eli back.
 'gloam-boar':{...monster('Gloam Boar'),maxHealth:55,radius:16,speed:42,chaseSpeed:150,attackDamage:20,attackRange:56,attackWindup:.5,attackRecover:.45,attackCooldown:1.6,knockback:240,huntXp:40,loot:'gloam-boar'},
 // Stoneshade: shadow in quarry stone. Very slow, very tough, a long windup into a big slam.
 stoneshade:{...monster('Stoneshade'),maxHealth:220,radius:22,speed:22,noticeRange:200,chaseSpeed:64,attackDamage:32,attackRange:72,attackWindup:1,attackRecover:.8,attackCooldown:2.4,knockback:260,huntXp:90,loot:'stoneshade'},
 // Whisperer: faint and hard to see (fade) until it notices Eli, then it fades in and lunges.
 whisperer:{...monster('Whisperer'),fade:true,maxHealth:70,radius:16,speed:34,noticeRange:170,noticeDelay:.5,chaseSpeed:138,attackDamage:18,attackRange:68,attackWindup:.5,attackRecover:.45,attackCooldown:1.6,huntXp:55,loot:'whisperer'},
 // Mire Walker: lies hidden under the water by the path until Eli comes close, rises, and its grab slows him (seconds).
 'mire-walker':{...monster('Mire Walker'),hidden:true,grab:2,maxHealth:90,radius:18,speed:26,noticeRange:150,noticeDelay:1,chaseSpeed:84,attackDamage:10,attackRange:62,attackWindup:.6,attackRecover:.5,attackCooldown:2,huntXp:50,loot:'mire-walker'},
 // Drowned Soldier: wades into the shallows (wades: how far from the shore, in pixels) where Eli cannot follow.
 'drowned-soldier':{...monster('Drowned Soldier'),wades:150,maxHealth:100,radius:16,speed:32,chaseSpeed:108,attackDamage:18,attackRange:60,attackWindup:.6,attackRecover:.45,attackCooldown:1.6,huntXp:55,loot:'drowned-soldier'},
 // Ash Archer: keeps its distance (keepAway) and shoots arrows from range. Eli can dash through an arrow.
 'ash-archer':{...monster('Ash Archer'),ranged:true,keepAway:170,arrowSpeed:330,maxHealth:60,radius:15,speed:36,noticeRange:300,chaseSpeed:112,attackDamage:14,attackRange:290,attackWindup:.7,attackRecover:.4,attackCooldown:2,huntXp:50,loot:'ash-archer'},
 // Inkeel: the first hostile water creature. It swims up to the bank and strikes at Eli on docks and ledges.
 inkeel:{...monster('Inkeel'),habitat:'water',maxHealth:80,radius:18,speed:40,noticeRange:220,chaseSpeed:132,attackDamage:20,attackRange:96,attackWindup:.55,attackRecover:.5,attackCooldown:1.8,huntXp:60,loot:'inkeel'}
});
// familiar:false — the kinds have no familiar or shard of their own yet.
function monster(name){return {behavior:BEHAVIORS.AGGRESSIVE,familiar:false,name,habitat:'land',fearRange:0,noticeRange:240,noticeDelay:.6,loseRange:460,leashRange:620};}
export function animalTraits(species){
 const spec=ANIMAL_TYPES[species];if(!spec)throw Error(`Unknown animal species: ${species}`);
 return {entityType:ENTITY_TYPES.ANIMAL,species,spriteId:species,behavior:BEHAVIORS.PASSIVE,huntable:true,...spec,health:spec.maxHealth,vx:0,vy:0,hurtRemaining:0,deathRemaining:0};
}
export function reactionFor(entity,{disturbed=false,provoked=false}={}){
 if(entity.entityType!==ENTITY_TYPES.ANIMAL||entity.health<=0)return 'none';
 if(entity.behavior===BEHAVIORS.PASSIVE)return disturbed||provoked?'flee':'idle';
 if(entity.behavior===BEHAVIORS.DEFENSIVE)return provoked?'retaliate':'idle';
 if(entity.behavior===BEHAVIORS.AGGRESSIVE)return 'pursue';
 return 'idle';
}
export const huntableInArea=(world,animal)=>world.adventure&&animal.entityType===ENTITY_TYPES.ANIMAL&&animal.huntable&&animal.health>0&&animal.areaId===world.areaId;
