// Area spawn tables: gameplay data only. Each outdoor area owns spawn slots where creatures of a habitat can appear.
// Empty slots roll when Eli walks in after being away for a while, and again whenever the area's respawn timer runs out.
// Living creatures always stay; a roll only fills empty slots, up to the area's population cap.
// Weights compete within a habitat: a creature whose AI is not built yet is skipped, and its share goes to the rest.
// Slots marked start hold that creature when a journey begins; story slots stay deer until Chapter 1's supper is cooked.
export const SPAWN_AREAS=Object.freeze({
 landing:{cap:12,chance:.65,respawnSeconds:60,
  tables:{land:{rabbit:55,deer:40,'shadow-walker':5},water:{eel:55,turtle:45}},
  slots:[
   ['rabbit-0','land',1460,1540,'rabbit'],['rabbit-1','land',1000,1450,'rabbit'],['rabbit-2','land',1680,1300,'rabbit'],['rabbit-3','land',1070,850,'rabbit'],['rabbit-4','land',1670,770,'rabbit'],
   ['deer-landing','land',1080,660,'deer'],['deer-meadow-west','land',900,1250,'deer',true],['deer-meadow','land',1120,1060,'deer',true],['deer-meadow-east','land',1620,1120,'deer',true],
   ['landing-east','land',2200,1200],
   ['turtle-landing','water',1980,1060,'turtle'],['eel-landing','water',675,1910,'eel'],['landing-shallows','water',1500,2050]
  ]},
 windchime:{cap:5,chance:.55,respawnSeconds:75,
  tables:{land:{deer:45,rabbit:40,'shadow-walker':15}},
  slots:[['deer-windchime','land',1060,640,'deer'],['windchime-north','land',1000,260],['windchime-west','land',300,300],['windchime-glade','land',1180,760],['windchime-south','land',560,820]]},
 crossroads:{cap:4,chance:.5,respawnSeconds:90,
  tables:{land:{rabbit:45,deer:30,'shadow-walker':25},water:{eel:100}},
  slots:[['crossroads-north','land',1200,300],['crossroads-west','land',300,800],['crossroads-middle','land',1000,600],['crossroads-south','land',300,1100],['crossroads-pond','water',1500,1000]]},
 marsh:{cap:8,chance:.55,respawnSeconds:75,
  tables:{land:{'shadow-walker':50,rabbit:25,deer:25},water:{turtle:60,eel:40}},
  slots:[['marsh-island','land',1580,1150],['marsh-east','land',1800,600],['marsh-south','land',1650,2000],
   ['marsh-pool-north','water',700,300],['marsh-reeds','water',500,950],['marsh-channel','water',1000,1100],['marsh-pool-east','water',1900,950],['marsh-lagoon','water',1150,2000],['marsh-shallows','water',900,2200]]}
});
// Interiors belong to the area outside their door, so stepping indoors and back out is not a new visit.
export const SPAWN_PARENT=Object.freeze({cabin:'landing','chief-house':'village','guest-lodge':'village'});
// An area only rolls on entry once Eli has been away this long, so walking back and forth cannot farm rolls.
export const AWAY_SECONDS=30;
// New creatures never appear within this distance of the player.
export const SPAWN_CLEARANCE=350;
// Shiny creatures: rare spawns whose uncertain drops are far more likely, on top of Luck and still capped at certainty.
export const SHINY=Object.freeze({chance:.01,loot:4,health:1.5,huntXp:2,seenRange:520});
export const SLOTS=Object.freeze(Object.fromEntries(Object.entries(SPAWN_AREAS).flatMap(([areaId,area])=>area.slots.map(([id,habitat,x,y,start,story])=>[id,Object.freeze({id,areaId,habitat,x,y,start:start||null,story:!!story})]))));
// The creatures a journey begins with, land before water, in the order the original hand-placed homes used.
export const startingSlots=test=>Object.values(SLOTS).filter(slot=>slot.start&&test(slot.start)).sort((a,b)=>(a.habitat==='water')-(b.habitat==='water'));
