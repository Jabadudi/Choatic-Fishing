// Creature index: what Eli knows about the creatures and people of the Wilds.
// Gameplay numbers and spawn points are read from the entity systems, never duplicated here.
import {ANIMAL_TYPES,BEHAVIOR_LABELS,BEHAVIORS} from './entities.js';
import {LOOT_TABLES,LOOT_ITEMS,SHARD_CHANCES} from './loot.js';
import {FAMILIARS} from './familiars.js';
import {SLOTS,SPAWN_AREAS,SHINY} from './spawn-tables.js';
import {spawnWeights} from './spawns.js';
import {createVillageResidents} from './village-life.js';
import {WARES} from './trade.js';
import {createNpcs} from './npcs.js';
import {areaFor} from './wilds.js';
import {ATLAS_SIZE} from './atlas-area.js';
import {WORLD_DATA} from './world-data.js';
// A world boss's dot is its boss spot from the world editor.
const bossPlaces=species=>WORLD_DATA.bosses.filter(b=>b.species===species).map(b=>[b.areaId,b.x,b.y]);
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
 landing:[.18,.6,.34,.21],windchime:[.38,.49,.07,.11],crossroads:[.36,.41,.12,.08],village:[.17,.37,.1,.1],'village-port':[.15,.47,.1,.09],'village-market':[.25,.38,.08,.1],'village-farm':[.33,.37,.08,.12],marsh:[.48,.27,.25,.31]
});
// Interiors are drawn at their front door.
const DOORS={cabin:['landing',1660,1440],'chief-house':['village',1250,350],'guest-lodge':['village',400,560]};
// Landmarks beyond the playable areas, as fractions of each atlas image.
const ATLAS_POINTS={'listening-tree':['delta',.21,.12,'The Listening Tree']};
// Areas built from the atlas carry their own frame on it, in atlas pixels.
const atlasBounds=area=>{if(!area.frame)return null;const [x0,x1,y0,y1]=area.frame;return [x0/ATLAS_SIZE.width,y0/ATLAS_SIZE.height,(x1-x0)/ATLAS_SIZE.width,(y1-y0)/ATLAS_SIZE.height];};
export function atlasPoint(areaId,x,y){
 const place=areaId,door=DOORS[areaId];if(door)[areaId,x,y]=door;
 const area=areaFor(areaId),bounds=AREA_BOUNDS[areaId]||atlasBounds(area);if(!bounds||area.id!==areaId)return null;
 const [left,top,width,height]=bounds;
 return {map:'delta',x:left+Math.min(1,Math.max(0,x/area.width))*width,y:top+Math.min(1,Math.max(0,y/area.height))*height,areaId:place};
}
const animal=(species,extra)=>({category:'wildlife',species,loot:ANIMAL_TYPES[species].loot,spawns:species,...extra});
const resident=id=>createVillageResidents().find(n=>n.id===id);
export const CODEX_ENTRIES=Object.freeze([
 animal('rabbit',{id:'rabbit',portrait:'codex/rabbit.png',firstSeen:'Chapter 1',description:'Grey meadow rabbits that graze around Reedwater Landing. They bolt the moment you get close, so a bow beats chasing them. Good meat, soft pelts and, very rarely, a lucky foot.'}),
 animal('deer',{id:'deer',portrait:'codex/deer.png',firstSeen:'Chapter 1',description:'Shy grazers of the landing meadow and Windchime Path. Leave them alone and they leave you alone. Wound one and it turns and fights back with its antlers. Venison is the heart of Grandpa’s supper.'}),
 animal('fox',{id:'fox',portrait:'codex/fox.png',firstSeen:'Windchime Path',description:'A slim russet fox with black socks and a white-tipped brush. It hunts mice along the chime trails and bolts long before you get close, faster than any rabbit. Its pelt is prized for winter hoods.'}),
 animal('boar',{id:'boar',portrait:'codex/boar.png',firstSeen:'Forest Edge',description:'A stocky wild boar with a ridge of black bristles and curved tusks, rooting through the northern forest. It ignores you until you hurt it, then lowers its head and charges. Get out of the way when it paws the ground.'}),
 animal('elk',{id:'elk',portrait:'codex/elk.png',firstSeen:'Elk Run',description:'Tall grey elk with shaggy manes and wide pale racks. They are the Elk Spirit’s own herd, and Elk Run is named for them. Leave them be and they graze on. Hurt one and it lowers that rack and sweeps it at you, and it takes a lot of arrows to bring down.'}),
 animal('bear',{id:'bear',portrait:'codex/bear.png',firstSeen:'Trailhead',description:'A huge shaggy brown bear with a heavy shoulder hump and long pale claws, roaming the deep trails past Elk Run. It wants nothing to do with you until you hurt it. Then it rears up on its hind legs, roars, and comes after you with claws that hit harder than anything else in the woods. It is slow, so walking away always works.'}),
 animal('heron',{id:'heron',portrait:'codex/heron.png',firstSeen:'Heron Point',description:'A tall grey heron with a white neck, a black plume and a dagger of a beak. It stalks the shallows at Upper Falls, Glasswater, the Heron Islands and Heron Point, and stands so still between stabs that it looks carved. Get close and it is gone in two wingbeats, so bring a bow.'}),
 animal('crab',{id:'crab',portrait:'codex/crab.png',firstSeen:'Arrival Bay',description:'A chunky orange-red shore crab with a speckled shell and one claw bigger than the other. It scuttles sideways along the tide pools and leaves you alone, but hit it and it raises both claws and nips back.'}),
 animal('goat',{id:'goat',portrait:'codex/goat.png',firstSeen:'Lookout Heights',description:'A shaggy off-white goat with thick ridged horns, at home on the heights and the old quarry ledges. It ignores you until you hurt it. Then it rears up and headbutts hard enough to throw you off your feet.'}),
 animal('otter',{id:'otter',portrait:'codex/otter.png',firstSeen:'Falls Channels',description:'A sleek dark-brown otter with a cream throat, playing in the channels and braids below the falls. It is fast in the water, and one dive is all it takes to lose you.'}),
 animal('duck',{id:'duck',portrait:'codex/duck.png',firstSeen:'Glasswater Basin',description:'A mallard with a glossy green head, paddling the pools and marshes. It takes off at the first sign of trouble, but it is the easiest thing on the water to hunt.'}),
 animal('pike',{id:'pike',portrait:'codex/pike.png',firstSeen:'Glasswater Basin',description:'A long silver-green pike with pale spots and a jaw full of needle teeth, hanging still in the deep pools. Hurt one and it lunges at you on the bank or the dock, so keep your distance.'}),
 animal('seal',{id:'seal',portrait:'codex/seal.png',firstSeen:'Seal Skerries',description:'A spotted grey seal that basks off the skerries and the sandbars. It is big and slow on the rocks, but it slides into the sea the moment you come close.'}),
 animal('turtle',{id:'turtle',portrait:'codex/turtle.png',firstSeen:'Chapter 1',description:'A slow, moss-backed turtle that paddles around Reedwater Spring. It never fights back, but its shell soaks up a lot of punishment. Drops wash up on the bank.'}),
 animal('eel',{id:'eel',glyph:'≋',firstSeen:'Chapter 1',description:'Quick, slippery eels that hunt in the shallows over the Drowned Road. Hard to hit and quick to flee. Their skin and oil are prized by anyone who works leather.'}),
 {id:'shadow-walker',category:'monsters',species:'shadow-walker',spawns:'shadow-walker',title:'Remnant of the dark army',portrait:'codex/shadow-walker.png',firstSeen:'Chapter 1',loot:'shadow-walker',
  description:'Faceless, ragged things left over from Croshelda’s dark army. They come in every shape and size, and they take the power of whatever they infect and multiply it. One walked out of the storm with an axe to kill Eli at Grandpa’s cabin. They roam the wilder trails now and charge anyone they see. Watch for the raised axe and get out of reach.'},
 {id:'hollow-stag',category:'monsters',species:'hollow-stag',spawns:'hollow-stag',title:'Infected deer and elk',portrait:'codex/hollow-stag.png',firstSeen:'Windchime Path',loot:'hollow-stag',
  description:'A deer or elk the shadow got into. Its antlers have grown wild and black and its ribs show through the hide. It is faster than any shadow walker and gallops after you, but it does not take many hits to bring down. Watch for the lowered head before the antler swing.'},
 {id:'gloam-boar',category:'monsters',species:'gloam-boar',spawns:'gloam-boar',title:'Infected boar',portrait:'codex/gloam-boar.png',firstSeen:'The northern forest',loot:'gloam-boar',
  description:'A boar swallowed by shadow, bristling with black smoke. It has less in it than a living boar, but its gore hits much harder and throws you off your feet. They often hunt in twos.'},
 {id:'stoneshade',category:'monsters',species:'stoneshade',spawns:'stoneshade',title:'Shadow in the quarry stone',portrait:'codex/stoneshade.png',firstSeen:'The Abandoned Quarry',loot:'stoneshade',
  description:'Shadow that seeped into the old quarry stone and stood up. It is very slow and very hard to hurt. When it raises both fists, get out of reach before the slam comes down.'},
 {id:'whisperer',category:'monsters',species:'whisperer',spawns:'whisperer',title:'The voices of the woods',portrait:'codex/whisperer.png',firstSeen:'Whispering Woods',loot:'whisperer',
  description:'A tall hooded thing you can barely see until it is close. The wind carries voices where it walks. Once it notices you it fades in and lunges with long clawed hands.'},
 {id:'mire-walker',category:'monsters',species:'mire-walker',spawns:'mire-walker',title:'Drowned in the reeds',portrait:'codex/mire-walker.png',firstSeen:'The marshes',loot:'mire-walker',
  description:'A drowned body in reed and weed that lies under the water beside the paths. It rises when you pass, and its grab holds you back so you can barely run. A ripple where there should be none is the only warning.'},
 {id:'drowned-soldier',category:'monsters',species:'drowned-soldier',spawns:'drowned-soldier',title:'Sunk with the old road',portrait:'codex/drowned-soldier.png',firstSeen:'The Drowned Road',loot:'drowned-soldier',
  description:'A soldier of Croshelda’s army who went down with the old road. Still in rusted armour, it wades out into shallows you cannot cross and comes back with its sword.'},
 {id:'ash-archer',category:'monsters',species:'ash-archer',spawns:'ash-archer',title:'Remnant that kept its bow',portrait:'codex/ash-archer.png',firstSeen:'The Old Roads',loot:'ash-archer',
  description:'A shadow army remnant that still carries its bow. It keeps its distance and backs away when you close in. Dash straight through the arrows to reach it.'},
 {id:'inkeel',category:'monsters',species:'inkeel',spawns:'inkeel',title:'Infected eel',portrait:'codex/inkeel.png',firstSeen:'The southern delta',loot:'inkeel',
  description:'An eel the shadow turned into a hunter, long and black with a mouth full of teeth. The first creature in the water that comes for you: it strikes at you on docks and ledges while you fish.'},
 {id:'croshelda',category:'bosses',name:'Croshelda',title:'The Witch of Darkness',portrait:'codex/croshelda.png',firstSeen:'Chapter 3 (named), Chapter 5 (vision)',status:'Whereabouts unknown',map:'world',
  description:'The shadow walkers once served her as an army. In Eli’s vision she was a crying girl with long white hair and storm-purple eyes, and black light burst out of her and swallowed everything. Nobody knows where she is.',lootNote:'Unknown. Nobody has ever faced her and come back to say.'},
 {id:'drowned-captain',category:'bosses',species:'drowned-captain',name:'The Drowned Captain',title:'He never left his post',portrait:'codex/drowned-captain.png',firstSeen:'The Drowned Road',status:'World boss',loot:'drowned-captain',places:bossPlaces('drowned-captain'),
  description:'The officer of the drowned company, still in his rusted helm and weed plume, rising out of the water by the Colonnade. He wades where you cannot follow, sweeps his sabre in a wide arc, and lunges a long way down the road after you. When he is hurt he calls his Drowned Soldiers up out of the shallows. Step aside from the lunge and keep out of the water’s edge.',
  lootNote:'Also 40 to 80 reed marks. The Captain’s Sabre is certain the first time he falls. He rises again 30 minutes after each defeat.'},
 {id:'greyhorn',category:'bosses',species:'greyhorn',name:'Greyhorn',title:'The Hollow Elk',portrait:'codex/greyhorn.png',firstSeen:'Elk Run',status:'World boss',loot:'greyhorn',places:bossPlaces('greyhorn'),
  description:'The old lead bull of the Elk Spirit’s herd, taken by the shadow. He guards the Grey Spire. Up close he rears and stomps a ring of smoke along the ground; from further off he lowers his black antlers and charges. His bellow brings Hollow Stags out of the trees, and at half strength his antlers grow wider still. Beating him drives the shadow out of him, but it finds him again.',
  lootNote:'Also 40 to 80 reed marks. The Greyhorn Spear is certain the first time he is freed. The shadow takes him again 45 minutes after each defeat.'},
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
 {id:'drayfus',category:'villagers',name:'Drayfus',title:'Trainer',portrait:'codex/drayfus.png',firstSeen:'Chapter 4 (named)',status:'Training at sunrise',places:[['village-farm',1420,1780]],
  description:'The fighter Emilia picked to train Eli and Mara. He may be the scarred swordsman who measured Eli by the hearth and did not look impressed.',lootNote:'Teaches combat. Training starts in Chapter 6.'},
 {id:'blacksmith',category:'villagers',name:'Blacksmith',title:'Merchant · Smithy',glyph:'⚒',firstSeen:'Chapter 3',status:'Merchant',npc:'village-smith',wares:'blacksmith',
  description:'Works the forge with a Rimejaw sprawled across the doorway. Turns hides, antlers and shell into blades and gear.'},
 {id:'fisher',category:'villagers',name:'Fisher',title:'Merchant · Jetty',glyph:'♢',firstSeen:'Chapter 3',status:'Merchant',npc:'village-fisher',wares:'fisher',
  description:'Keeps the village boats sound and the fish stall stocked. Sells bait and tackle, and pays fair marks for pelts and skins.'},
 {id:'gardener',category:'villagers',name:'Gardener',title:'Merchant · Farm fields',glyph:'❦',firstSeen:'Chapter 3',status:'Merchant',npc:'basket-carrier',wares:'gardener',
  description:'Carries baskets between the vegetable fields past the gate and the stalls on Lantern Square. Storm or no storm, the gardens still need tending.'}
].map(entry=>{
 const spec=entry.species&&ANIMAL_TYPES[entry.species];
 return Object.freeze({name:spec?.name,title:spec?`${BEHAVIOR_LABELS[spec.behavior||BEHAVIORS.PASSIVE]} wildlife`:entry.title,map:'delta',...entry});
}));
export const codexEntry=id=>CODEX_ENTRIES.find(entry=>entry.id===id)||null;
export const codexEntries=category=>CODEX_ENTRIES.filter(entry=>entry.category===category);
// How likely a slot is to hold this species when it fills, by area: the species' share of its habitat's weights.
export function codexSpawnRates(entry){
 if(!entry.spawns)return [];
 return Object.keys(SPAWN_AREAS).flatMap(areaId=>{
  const share=Math.max(0,...['land','water'].map(habitat=>{const weights=spawnWeights(areaId,habitat),total=weights.reduce((sum,[,w])=>sum+w,0),own=weights.find(([s])=>s===entry.spawns)?.[1]||0;return total?own/total:0;}));
  return share>0?[{areaId,name:areaFor(areaId).name,share,label:share>=.4?'common':share>=.2?'uncommon':'rare'}]:[];
 });
}
const canSpawn=(slot,species)=>spawnWeights(slot.areaId,slot.habitat).some(([s])=>s===species);
// Red dots on the minimap. Species use every spawn slot they can appear in; NPCs use where they stand or patrol.
export function codexLocations(entry){
 const points=[];
 if(entry.spawns)for(const slot of Object.values(SLOTS))if(canSpawn(slot,entry.spawns))points.push(atlasPoint(slot.areaId,slot.x,slot.y));
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
 return {kind:'drops',rows:table.map(({item,chance})=>({item,category:LOOT_ITEMS[item].category,familiar:LOOT_ITEMS[item].familiar,chance,shiny:shinyChance(chance),description:LOOT_ITEMS[item].description}))};
}
// A shiny multiplies every uncertain drop, still capped at certainty.
export const shinyChance=chance=>chance>=1?1:Math.min(1,chance*SHINY.loot);
export const chanceLabel=chance=>chance>=1?'Always':`${Math.round(chance*100)}%`;
// Hunted creatures share their familiar's id with their loot table; guardians, never hunted, with their own entry and have no drop chance.
export function codexFamiliar(entry){
 const id=entry.loot&&FAMILIARS[entry.loot]?entry.loot:FAMILIARS[entry.id]?.wellOnly?entry.id:null;if(!id)return null;
 const chance=SHARD_CHANCES[id]??null;
 return {id,chance,shinyChance:chance===null?null:shinyChance(chance),...FAMILIARS[id]};
}
