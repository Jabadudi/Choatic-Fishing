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
