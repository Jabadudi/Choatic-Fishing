// Loot tables are gameplay data, independent of sprites. Each entry rolls on its own:
// chance 1 is guaranteed, and luck scales only the uncertain entries (capped at certainty).
export const LOOT_ITEMS=Object.freeze({
 'Deer Meat':{name:'Deer Meat',category:'consumables',description:'Fresh venison. Cook it at a stove.'},
 'Deer Hide':{name:'Deer Hide',category:'upgrade-materials',description:'A supple hide. Good leather, once it is worked.'},
 'Deer Antlers':{name:'Deer Antlers',category:'trophies',description:'A clean pair of antlers. A hunter’s trophy.'}
});
export const LOOT_TABLES=Object.freeze({
 deer:[{item:'Deer Meat',chance:1},{item:'Deer Hide',chance:.45},{item:'Deer Antlers',chance:.2}]
});
export function rollLoot(table,random,luck=1){
 return (LOOT_TABLES[table]||[]).flatMap(entry=>entry.chance>=1||random()<Math.min(1,entry.chance*luck)?[{...LOOT_ITEMS[entry.item]}]:[]);
}
