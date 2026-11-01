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
 deer:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:12,attackRange:52,attackWindup:.45,attackCooldown:1.4,chaseSpeed:115,leashRange:320,name:'Deer',maxHealth:60,radius:18,habitat:'land',speed:48,fleeSpeed:175,fearRange:150,huntXp:25,loot:'deer'},
 // Red fox: shyer and much quicker than a rabbit, so it bolts from further off and a bow beats chasing it.
 fox:{name:'Red Fox',maxHealth:26,radius:12,habitat:'land',speed:64,fleeSpeed:215,fearRange:120,huntXp:14,loot:'fox'},
 // Bristleback boar: leaves Eli alone until hurt, then charges. The first animal that can really hurt him.
 boar:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:18,attackRange:54,attackWindup:.55,attackCooldown:1.7,chaseSpeed:128,leashRange:300,name:'Bristleback Boar',maxHealth:95,radius:20,habitat:'land',speed:40,fleeSpeed:150,fearRange:150,huntXp:35,loot:'boar'},
 // Grey elk: the Elk Spirit's herd. Calm until hurt, then a long antler sweep with a lot of health behind it.
 elk:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:22,attackRange:68,attackWindup:.65,attackCooldown:1.9,chaseSpeed:118,leashRange:340,name:'Grey Elk',maxHealth:150,radius:26,habitat:'land',speed:46,fleeSpeed:170,fearRange:160,huntXp:50,loot:'elk'},
 // Brown bear: the strongest animal in the woods. Calm until hurt, then it rears up and roars (roar: seconds) before
 // coming after Eli, and every claw swipe hits hard. Slow, so Eli can still walk away from it.
 bear:{behavior:BEHAVIORS.DEFENSIVE,attackDamage:30,attackRange:62,attackWindup:.75,attackCooldown:2.2,chaseSpeed:108,leashRange:320,roar:1.2,name:'Brown Bear',maxHealth:240,radius:26,habitat:'land',speed:36,fleeSpeed:140,fearRange:160,huntXp:75,loot:'bear'},
 // Grey heron: stalks the shallows at the delta's heron landmarks, and takes flight from further off than a deer.
 heron:{name:'Grey Heron',maxHealth:30,radius:12,habitat:'land',speed:28,fleeSpeed:200,fearRange:150,huntXp:18,loot:'heron'},
 turtle:{name:'Turtle',maxHealth:45,radius:14,habitat:'water',speed:18,fleeSpeed:42,fearRange:85,huntXp:15,loot:'turtle'},
 eel:{name:'Eel',maxHealth:24,radius:12,habitat:'water',speed:36,fleeSpeed:100,fearRange:110,huntXp:12,loot:'eel'},
 // Monster: hunts Eli on sight (src/monsters.js). Slower than Eli at a run, so he can always break away.
 'shadow-walker':{behavior:BEHAVIORS.AGGRESSIVE,spriteId:'nightwalker',name:'Shadow Walker',maxHealth:80,radius:16,habitat:'land',speed:38,fearRange:0,
  noticeRange:240,noticeDelay:.6,loseRange:460,leashRange:620,chaseSpeed:122,attackDamage:16,attackRange:58,attackWindup:.55,attackRecover:.4,attackCooldown:1.5,huntXp:40,loot:'shadow-walker'}
});
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
