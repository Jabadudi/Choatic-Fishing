// Creature index: what Eli knows about the creatures and people of the Wilds.
// Gameplay numbers and spawn points are read from the entity systems, never duplicated here.
import {ANIMAL_TYPES,BEHAVIOR_LABELS,BEHAVIORS} from './entities.js';
import {LOOT_TABLES,LOOT_ITEMS} from './loot.js';
import {createWildlife} from './wildlife.js';
import {createRabbits} from './rabbits.js';
import {createVillageResidents} from './village-life.js';
import {createNpcs} from './npcs.js';
import {areaFor} from './wilds.js';
export const CODEX_CATEGORIES=Object.freeze([
 {id:'wildlife',label:'Wildlife',blurb:'Animals you can hunt for food and materials.'},
 {id:'monsters',label:'Monsters',blurb:'Things that want you dead.'},
 {id:'bosses',label:'Bosses',blurb:'The powers behind the monsters.'},
 {id:'guardians',label:'Guardians & spirits',blurb:'Allies of the villages. Not for hunting.'},
 {id:'villagers',label:'Villagers & merchants',blurb:'People who help, teach or trade.'}
]);
export const CODEX_MAPS=Object.freeze({
 delta:{asset:'codex/reedwater-delta-map.jpg',name:'Reedwater Delta'},
 world:{asset:'codex/world-map.jpg',name:'The Wilds'}
});
// Where each outdoor area sits on the regional atlas, as [left, top, width, height] fractions of the image.
export const AREA_BOUNDS=Object.freeze({
 landing:[.18,.6,.34,.21],windchime:[.38,.49,.07,.11],crossroads:[.36,.41,.12,.08],village:[.17,.35,.18,.15],marsh:[.48,.27,.25,.31]
});
// Interiors are drawn at their front door.
const DOORS={cabin:['landing',1660,1440],'chief-house':['village',900,410],'guest-lodge':['village',500,380]};
// Landmarks beyond the playable areas, as fractions of each atlas image.
const ATLAS_POINTS={'listening-tree':['delta',.21,.12,'The Listening Tree']};
export function atlasPoint(areaId,x,y){
 const place=areaId,door=DOORS[areaId];if(door)[areaId,x,y]=door;
 const bounds=AREA_BOUNDS[areaId],area=areaFor(areaId);if(!bounds||area.id!==areaId)return null;
 const [left,top,width,height]=bounds;
 return {map:'delta',x:left+Math.min(1,Math.max(0,x/area.width))*width,y:top+Math.min(1,Math.max(0,y/area.height))*height,areaId:place};
}
// Barter offers. Trading opens in a later chapter; these are the planned wares.
const WARES={
 blacksmith:[{item:'Hunting Knife',category:'weapons',price:'2 Deer Hide'},{item:'Iron Fishhooks',category:'upgrade-materials',price:'2 Eel Skin'},{item:'Whetstone',category:'upgrade-materials',price:'1 Deer Antlers'},{item:'Shell Buckler',category:'armor',price:'3 Turtle Shell'}],
 fisher:[{item:'Sardine',category:'consumables',price:'1 Rabbit Pelt',note:'×3'},{item:'Reed Spear',category:'weapons',price:'2 Eel Skin'},{item:'Woven Fish Trap',category:'upgrade-materials',price:'1 Turtle Shell'}],
 gardener:[{item:'Wild Herbs',category:'consumables',price:'1 Rabbit Meat'},{item:'Willow Apples',category:'consumables',price:'1 Sardine',note:'×4'},{item:'Healing Salve',category:'consumables',price:'1 Eel Oil'}]
};
const animal=(species,extra)=>({category:'wildlife',species,loot:ANIMAL_TYPES[species].loot,spawns:species,...extra});
const resident=id=>createVillageResidents().find(n=>n.id===id);
export const CODEX_ENTRIES=Object.freeze([
 animal('rabbit',{id:'rabbit',portrait:'codex/rabbit.png',firstSeen:'Chapter 1',description:'Grey meadow rabbits that graze around Reedwater Landing. They bolt the moment you get close, so a bow beats chasing them. Good meat, soft pelts and, very rarely, a lucky foot.'}),
 animal('deer',{id:'deer',portrait:'codex/deer.png',firstSeen:'Chapter 1',description:'Shy grazers of the landing meadow and Windchime Path. Leave them alone and they leave you alone. Wound one and it turns and fights back with its antlers. Venison is the heart of Grandpa’s supper.'}),
 animal('turtle',{id:'turtle',portrait:'codex/turtle.png',firstSeen:'Chapter 1',description:'A slow, moss-backed turtle that paddles around Reedwater Spring. It never fights back, but its shell soaks up a lot of punishment. Drops wash up on the bank.'}),
 animal('eel',{id:'eel',glyph:'≋',firstSeen:'Chapter 1',description:'Quick, slippery eels that hunt in the shallows over the Drowned Road. Hard to hit and quick to flee. Their skin and oil are prized by anyone who works leather.'}),
 {id:'shadow-walker',category:'monsters',name:'Shadow Walker',title:'Remnant of the dark army',portrait:'codex/shadow-walker.png',firstSeen:'Chapter 1',status:'Story encounter',behavior:BEHAVIORS.AGGRESSIVE,loot:'shadow-walker',lootNote:'Planned drops. Shadow walkers can only be met in the story for now.',
  places:[['cabin',0,0],['village',1000,740]],description:'Faceless, ragged things left over from Croshelda’s dark army. They come in every shape and size, and they take the power of whatever they infect and multiply it. One walked out of the storm with an axe to kill Eli at Grandpa’s cabin.'},
 {id:'croshelda',category:'bosses',name:'Croshelda',title:'The Witch of Darkness',portrait:'codex/croshelda.png',firstSeen:'Chapter 3 (named), Chapter 5 (vision)',status:'Whereabouts unknown',map:'world',
  description:'The shadow walkers once served her as an army. In Eli’s vision she was a crying girl with long white hair and storm-purple eyes, and black light burst out of her and swallowed everything. Nobody knows where she is.',lootNote:'Unknown. Nobody has ever faced her and come back to say.'},
 {id:'moonfang',category:'guardians',name:'Moonfang',title:'Wolf guardians',portrait:'codex/moonfang.png',firstSeen:'Chapter 1',status:'Ally',places:[['cabin',0,0],['village',1500,600]],
  description:'Grey wolves the size of ponies that roam the land and keep the villages safe from the monsters of the night. One knocked the shadow walker off its feet before it could reach Eli.',lootNote:'Never hunted. The Moonfang are allies.'},
 {id:'rimejaw',category:'guardians',name:'Rimejaw',title:'Frost-scaled guardian',portrait:'codex/rimejaw.png',firstSeen:'Chapter 3',status:'Ally',npc:'village-rimejaw',
  description:'A mastiff-sized beast with a heavy mane and blue-grey scales that gather frost. Extremely territorial, and its bite freezes whatever it catches. The village spent generations taming them. One sleeps across the blacksmith’s doorway.',lootNote:'Never hunted. Rimejaws guard the village.'},
 {id:'flitlynx',category:'guardians',name:'Flitlynx',title:'Winged lynx',portrait:'codex/flitlynx.png',firstSeen:'Chapter 3',status:'Ally',npc:'village-flitlynx',
  description:'A bobcat-sized lynx with leathery bat wings folded along its back. It naps on the blacksmith’s roof and takes birds out of the air when they land too close.',lootNote:'Never hunted. Flitlynxes fight for the village.'},
 {id:'elk-spirit',category:'guardians',name:'Elk Spirit',title:'Keeper of the Listening Tree',glyph:'⟡',firstSeen:'Chapter 4 (mentioned)',status:'Not yet met',atlas:['listening-tree'],
  description:'It lives in the great hollow Listening Tree at the edge of the Whispering Forest, north of the village. If it chooses to, it can carry Eli close to the Ember Volcano.',lootNote:'A spirit, not prey.'},
 {id:'ocelot',category:'guardians',name:'The Talking Ocelot',title:'Uninvited guest',glyph:'❂',firstSeen:'Chapter 5',status:'Just met',places:[['guest-lodge',0,0]],
  description:'A sleek, spotted ocelot that appeared in the corner of Eli’s room right after he swallowed the Region Core. It sat there like it owned the place. Then it talked.',lootNote:'It would probably have something to say about that.'},
 {id:'mara',category:'villagers',name:'Mara',title:'Guide and fighter',portrait:'codex/mara.png',firstSeen:'Chapter 1',status:'Companion',npcs:['mara'],places:[['village',1000,740]],
  description:'The village girl who pulled Eli out of the storm. Sarcastic, fearless about monsters and very easy to annoy. Chief Emilia’s granddaughter. She guides you between the landing and Willowback.',lootNote:'Talk to her for directions. She does not trade.'},
 {id:'emilia',category:'villagers',name:'Chief Emilia',title:'Village chief',portrait:'codex/emilia.png',firstSeen:'Chapter 4',status:'Mentor',places:[['chief-house',0,0]],
  description:'Willowback’s chief and Mara’s grandmother. She knew Grandpa Oscar and keeps his secrets. She told Eli about the Ember Volcano stones and arranged his training.',lootNote:'She gives counsel and quests, not goods.'},
 {id:'drayfus',category:'villagers',name:'Drayfus',title:'Trainer',portrait:'codex/drayfus.png',firstSeen:'Chapter 4 (named)',status:'Training at sunrise',places:[['village',1500,900]],
  description:'The fighter Emilia picked to train Eli and Mara. He may be the scarred swordsman who measured Eli by the hearth and did not look impressed.',lootNote:'Teaches combat. Training starts in Chapter 6.'},
 {id:'blacksmith',category:'villagers',name:'Blacksmith',title:'Merchant · Smithy',glyph:'⚒',firstSeen:'Chapter 3',status:'Merchant',npc:'village-smith',wares:'blacksmith',
  description:'Works the forge with a Rimejaw sprawled across the doorway. Turns hides, antlers and shell into blades and gear.'},
 {id:'fisher',category:'villagers',name:'Fisher',title:'Merchant · Jetty',glyph:'♢',firstSeen:'Chapter 3',status:'Merchant',npc:'village-fisher',wares:'fisher',
  description:'Keeps the village boats sound and the fish stall stocked. Happy to swap bait and tackle for pelts and skins.'},
 {id:'gardener',category:'villagers',name:'Gardener',title:'Merchant · Kitchen gardens',glyph:'❦',firstSeen:'Chapter 3',status:'Merchant',npc:'basket-carrier',wares:'gardener',
  description:'Carries baskets between the kitchen gardens and the produce stall. Storm or no storm, the gardens still need tending.'}
].map(entry=>{
 const spec=entry.species&&ANIMAL_TYPES[entry.species];
 return Object.freeze({name:spec?.name,title:spec?`${BEHAVIOR_LABELS[spec.behavior||BEHAVIORS.PASSIVE]} wildlife`:entry.title,map:'delta',...entry});
}));
export const codexEntry=id=>CODEX_ENTRIES.find(entry=>entry.id===id)||null;
export const codexEntries=category=>CODEX_ENTRIES.filter(entry=>entry.category===category);
let spawnCache=null;
const spawnHomes=()=>spawnCache??=[...createRabbits(),...createWildlife()].map(a=>({species:a.species,areaId:a.areaId,...a.home}));
// Red dots on the minimap. Species use every spawn point; NPCs use where they stand or patrol.
export function codexLocations(entry){
 const points=[];
 if(entry.spawns)for(const home of spawnHomes())if(home.species===entry.spawns)points.push(atlasPoint(home.areaId,home.x,home.y));
 for(const id of [entry.npc,...(entry.npcs||[])].filter(Boolean)){const n=resident(id)||createNpcs().find(n=>n.id===id);if(n)points.push(atlasPoint(n.areaId,n.origin?.x??n.x,n.origin?.y??n.y));}
 for(const [areaId,x,y] of entry.places||[])points.push(atlasPoint(areaId,x,y));
 for(const id of entry.atlas||[]){const [map,x,y,label]=ATLAS_POINTS[id];points.push({map,x,y,label});}
 return points.filter(Boolean);
}
// Area names for the dots, in the order they first appear.
export function codexRegions(entry){
 const names=[];
 for(const point of codexLocations(entry)){const name=point.label||areaFor(point.areaId).name;if(!names.includes(name))names.push(name);}
 return names;
}
// Loot rows for hunted entries, ware rows for merchants.
export function codexLoot(entry){
 if(entry.wares)return {kind:'wares',rows:WARES[entry.wares].map(w=>({...w}))};
 const table=LOOT_TABLES[entry.loot];
 if(!table)return {kind:'none',rows:[]};
 return {kind:'drops',rows:table.map(({item,chance})=>({item,category:LOOT_ITEMS[item].category,chance,description:LOOT_ITEMS[item].description}))};
}
export const chanceLabel=chance=>chance>=1?'Always':`${Math.round(chance*100)}%`;
