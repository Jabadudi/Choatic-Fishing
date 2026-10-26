// Loot tables are gameplay data, independent of sprites. Each entry rolls on its own:
// chance 1 is guaranteed, and luck scales only the uncertain entries (capped at certainty).
export const LOOT_ITEMS=Object.freeze({
 'Deer Meat':{name:'Deer Meat',category:'consumables',description:'Fresh venison. Cook it at a stove.'},
 'Deer Hide':{name:'Deer Hide',category:'upgrade-materials',description:'A supple hide. Good leather, once it is worked.'},
 'Deer Antlers':{name:'Deer Antlers',category:'trophies',description:'A clean pair of antlers. A hunter’s trophy.'},
 'Rabbit Meat':{name:'Rabbit Meat',category:'consumables',description:'Lean and tender. Cook it at a stove.'},
 'Rabbit Pelt':{name:'Rabbit Pelt',category:'upgrade-materials',description:'Soft grey fur. It lines gloves and hoods.'},
 'Rabbit’s Foot':{name:'Rabbit’s Foot',category:'trophies',description:'Supposedly lucky. It was not lucky for the rabbit.'},
 'Turtle Meat':{name:'Turtle Meat',category:'consumables',description:'Rich, dark meat. Best slow-cooked.'},
 'Turtle Shell':{name:'Turtle Shell',category:'upgrade-materials',description:'A mossy shell plate, hard enough to rim a shield.'},
 'River Pearl':{name:'River Pearl',category:'trophies',description:'A small pearl, faintly warm, found under the shell.'},
 'Eel Fillet':{name:'Eel Fillet',category:'consumables',description:'Oily and firm. It grills well over a fire.'},
 'Eel Skin':{name:'Eel Skin',category:'upgrade-materials',description:'Slick, strong skin. It wraps a rod grip or a bow handle.'},
 'Eel Oil':{name:'Eel Oil',category:'upgrade-materials',description:'A small flask of oil. It keeps leather and lamps going.'},
 'Shadow Ichor':{name:'Shadow Ichor',category:'upgrade-materials',description:'Black, cold and slow to pour. It drinks the light around it.'},
 'Rusted Axe Head':{name:'Rusted Axe Head',category:'upgrade-materials',description:'Pitted iron from a shadow walker’s axe. A smith could rework it.'},
 'Black Light Shard':{name:'Black Light Shard',category:'trophies',description:'A sliver of darkness that moves when you are not looking at it.'}
});
export const LOOT_TABLES=Object.freeze({
 rabbit:[{item:'Rabbit Meat',chance:1},{item:'Rabbit Pelt',chance:.5},{item:'Rabbit’s Foot',chance:.05}],
 deer:[{item:'Deer Meat',chance:1},{item:'Deer Hide',chance:.45},{item:'Deer Antlers',chance:.2}],
 turtle:[{item:'Turtle Meat',chance:1},{item:'Turtle Shell',chance:.4},{item:'River Pearl',chance:.05}],
 eel:[{item:'Eel Fillet',chance:1},{item:'Eel Skin',chance:.35},{item:'Eel Oil',chance:.2}],
 // Planned: shadow walkers cannot be fought outside the story yet, so nothing rolls this table today.
 'shadow-walker':[{item:'Shadow Ichor',chance:1},{item:'Rusted Axe Head',chance:.3},{item:'Black Light Shard',chance:.05}]
});
export function rollLoot(table,random,luck=1){
 return (LOOT_TABLES[table]||[]).flatMap(entry=>entry.chance>=1||random()<Math.min(1,entry.chance*luck)?[{...LOOT_ITEMS[entry.item]}]:[]);
}
