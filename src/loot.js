import {FAMILIARS} from './familiars.js';
import {ARTIFACTS,artifactItem,rollRarity} from './artifacts.js';
// Loot tables are gameplay data, independent of sprites. Each entry rolls on its own:
// chance 1 is guaranteed, and luck scales only the uncertain entries (capped at certainty).
export const LOOT_ITEMS=Object.freeze({
 'Deer Meat':{name:'Deer Meat',category:'consumables',description:'Fresh venison. Cook it at a stove.'},
 'Deer Hide':{name:'Deer Hide',category:'upgrade-materials',description:'A supple hide. Good leather, once it is worked.'},
 'Deer Antlers':{name:'Deer Antlers',category:'trophies',description:'A clean pair of antlers. A hunter’s trophy.'},
 'Rabbit Meat':{name:'Rabbit Meat',category:'consumables',description:'Lean and tender. Cook it at a stove.'},
 'Rabbit Pelt':{name:'Rabbit Pelt',category:'upgrade-materials',description:'Soft grey fur. It lines gloves and hoods.'},
 'Turtle Meat':{name:'Turtle Meat',category:'consumables',description:'Rich, dark meat. Best slow-cooked.'},
 'Turtle Shell':{name:'Turtle Shell',category:'upgrade-materials',description:'A mossy shell plate, hard enough to rim a shield.'},
 'River Pearl':{name:'River Pearl',category:'trophies',description:'A small pearl, faintly warm, found under the shell.'},
 'Eel Fillet':{name:'Eel Fillet',category:'consumables',description:'Oily and firm. It grills well over a fire.'},
 'Eel Skin':{name:'Eel Skin',category:'upgrade-materials',description:'Slick, strong skin. It wraps a rod grip or a bow handle.'},
 'Eel Oil':{name:'Eel Oil',category:'upgrade-materials',description:'A small flask of oil. It keeps leather and lamps going.'},
 'Shadow Ichor':{name:'Shadow Ichor',category:'upgrade-materials',description:'Black, cold and slow to pour. It drinks the light around it.'},
 'Rusted Axe Head':{name:'Rusted Axe Head',category:'upgrade-materials',description:'Pitted iron from a shadow walker’s axe. A smith could rework it.'},
 'Black Light Shard':{name:'Black Light Shard',category:'trophies',description:'A sliver of darkness that moves when you are not looking at it.'},
 // Artifacts drop at a rolled rarity (see artifacts.js).
 ...Object.fromEntries(Object.entries(ARTIFACTS).map(([id,a])=>[a.name,{name:a.name,category:'artifacts',artifact:id,description:a.description}])),
 // Familiar shards are absorbed on pickup instead of filling the backpack (see familiars.js).
 ...Object.fromEntries(Object.entries(FAMILIARS).map(([id,f])=>[f.shard,{name:f.shard,category:'trophies',familiar:id,description:`A warm fragment of a ${f.name.toLowerCase()}’s spirit. Five of them fuse into a familiar.`}]))
});
// Each kind of creature drops its own familiar shard. Luck raises these chances like any other rare drop.
export const SHARD_CHANCES=Object.freeze({rabbit:.08,deer:.1,turtle:.1,eel:.08,'shadow-walker':.06});
const artifactEntry=id=>({item:ARTIFACTS[id].name,chance:ARTIFACTS[id].chance,artifact:id});
export const LOOT_TABLES=Object.freeze({
 rabbit:[{item:'Rabbit Meat',chance:1},{item:'Rabbit Pelt',chance:.5},artifactEntry('rabbits-foot'),{item:FAMILIARS['rabbit'].shard,chance:SHARD_CHANCES['rabbit']}],
 deer:[{item:'Deer Meat',chance:1},{item:'Deer Hide',chance:.45},{item:'Deer Antlers',chance:.2},artifactEntry('stag-crown'),{item:FAMILIARS['deer'].shard,chance:SHARD_CHANCES['deer']}],
 turtle:[{item:'Turtle Meat',chance:1},{item:'Turtle Shell',chance:.4},{item:'River Pearl',chance:.05},artifactEntry('mossback-scute'),{item:FAMILIARS['turtle'].shard,chance:SHARD_CHANCES['turtle']}],
 eel:[{item:'Eel Fillet',chance:1},{item:'Eel Skin',chance:.35},{item:'Eel Oil',chance:.2},artifactEntry('lodestone'),{item:FAMILIARS['eel'].shard,chance:SHARD_CHANCES['eel']}],
 'shadow-walker':[{item:'Shadow Ichor',chance:1},{item:'Rusted Axe Head',chance:.3},{item:'Black Light Shard',chance:.05},artifactEntry('black-light-heart'),{item:FAMILIARS['shadow-walker'].shard,chance:SHARD_CHANCES['shadow-walker']}]
});
export function rollLoot(table,random,luck=1){
 return (LOOT_TABLES[table]||[]).flatMap(entry=>entry.chance>=1||random()<Math.min(1,entry.chance*luck)?[entry.artifact?artifactItem(entry.artifact,rollRarity(random,luck)):{...LOOT_ITEMS[entry.item]}]:[]);
}
