// Region field maps (Region 1 plan, signed off by Netanel on 7 Nov 2026). Gameplay data and pure rules only; the
// runtime (elites, map clear, rank) is in src/field-play.js.
//
// A field map runs west to east. Its monsters have a level that rises from the west edge to the east edge inside the
// map's band, come in packs around a leader, and one elite guards the east end. Defeating `clear.kills` monsters and
// the elite clears the map with a rank; the first clear pays the reward.
// Region 1 is Lv 1-15, Region 2 Lv 15-25, Region 3 Lv 25-45, with small steps between maps.
// Regions 1.1 Dewdrop Meadow: the first map of the Regions game. Its slimes stand in fixed bunches, [x, y, count] in
// world units, and do not come back: the kill goal is the number of slimes placed, so clearing the map means every
// slime is down. No elite yet.
const DEWDROP_BUNCHES=Object.freeze([[620,400,3],[1000,250,4],[1380,470,3],[1760,330,4],[2150,490,4],[2540,280,3],[2920,470,4],[3320,320,3],[3660,470,4]]);
export const FIELD_MAPS=Object.freeze({
 'dewdrop-meadow':Object.freeze({code:'1.1',region:1,levels:[1,2],species:'slime',bunches:DEWDROP_BUNCHES,elite:null,
  clear:Object.freeze({kills:DEWDROP_BUNCHES.reduce((n,b)=>n+b[2],0),reward:Object.freeze({wishstones:1,marks:30})})}),
 landing:Object.freeze({code:'1.1',region:1,levels:[1,2],pack:[3,4],
  // A giant shore crab on the Drowned Causeway. Its shell halves every hit until a combo finisher knocks it down.
  elite:Object.freeze({id:'mudshell',species:'crab',name:'Mudshell',level:3,x:3600,y:1350,scale:2.4,health:3,damage:1.6,armor:.5,
   tint:'brightness(.62) saturate(1.5) hue-rotate(-18deg)',respawnSeconds:300}),
  clear:Object.freeze({kills:30,reward:Object.freeze({wishstones:1,marks:40})})}),
 windchime:Object.freeze({code:'1.2',region:1,levels:[2,4],pack:[3,5],
  // A hollow stag, the shadow-taken elk, waiting at the Fork Stones before the road to town.
  elite:Object.freeze({id:'hollowbranch',species:'hollow-stag',name:'Hollowbranch',level:5,x:2780,y:600,scale:1.5,health:3,damage:1.4,
   tint:'brightness(.85) saturate(1.4) hue-rotate(28deg)',respawnSeconds:300}),
  clear:Object.freeze({kills:30,reward:Object.freeze({wishstones:1,marks:60})})})
});
export const fieldMap=id=>Object.hasOwn(FIELD_MAPS,id)?FIELD_MAPS[id]:null;
export const ELITES=Object.freeze(Object.entries(FIELD_MAPS).filter(([,f])=>f.elite).map(([areaId,f])=>Object.freeze({...f.elite,areaId})));
export const MAX_LEVEL=200;
// How strong a level makes a monster, relative to its Lv 1 kind.
export const LEVEL_SCALE=Object.freeze({health:.18,damage:.12,xp:.25});
// The level of a monster standing at x in a field map: the band's low end at the west edge, its high end at the east.
export function levelAt(areaId,x,width){
 const f=fieldMap(areaId);if(!f)return 1;
 const [lo,hi]=f.levels,t=Math.max(0,Math.min(1,x/Math.max(1,width)));
 return Math.min(hi,lo+Math.floor(t*(hi-lo+1)));
}
// Applies a level to a freshly built creature (its stats are still the Lv 1 kind's).
export function applyLevel(animal,level){
 const n=Math.max(1,Math.min(MAX_LEVEL,Math.round(level)||1)),k=n-1;
 animal.level=n;if(k===0)return animal;
 animal.maxHealth=Math.round(animal.maxHealth*(1+LEVEL_SCALE.health*k));animal.health=animal.maxHealth;
 if(animal.attackDamage)animal.attackDamage=Math.round(animal.attackDamage*(1+LEVEL_SCALE.damage*k));
 if(animal.huntXp)animal.huntXp=Math.round(animal.huntXp*(1+LEVEL_SCALE.xp*k));
 return animal;
}
// Which creatures count as monsters for packs and the map clear: anything that fights back.
export const fights=animal=>animal.behavior==='aggressive'||animal.behavior==='defensive';
// "1.1 Reedwater Landing" for a field map, the plain name elsewhere.
export const mapTitle=(areaId,name)=>{const f=fieldMap(areaId);return f?`${f.code} ${name}`:name;};
// Rank from clear time, damage taken and best combo: three points each, S at 8 or more.
export const RANKS=Object.freeze([['S',8],['A',6],['B',3],['C',0]]);
export function rankFor({seconds,damage,combo}){
 const time=seconds<=240?3:seconds<=360?2:seconds<=540?1:0,hurt=damage<=40?3:damage<=120?2:damage<=260?1:0,chain=combo>=30?3:combo>=15?2:combo>=8?1:0;
 const score=time+hurt+chain;return {rank:RANKS.find(([,min])=>score>=min)[0],score,time,hurt,chain};
}
export const rankOrder=r=>RANKS.findIndex(([name])=>name===r);
