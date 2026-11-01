import {WORLD_DATA} from './world-data.js';
// Area spawn tables: gameplay data only. Each outdoor area owns spawn slots where creatures of a habitat can appear.
// Empty slots roll when Eli walks in after being away for a while, and again whenever the area's respawn timer runs out.
// Living creatures always stay; a roll only fills empty slots, up to the area's population cap.
// Weights compete within a habitat: a creature whose AI is not built yet is skipped, and its share goes to the rest.
// Slots marked start hold that creature when a journey begins; story slots stay deer until Chapter 1's supper is cooked.
// The numbers and points themselves live in src/world-data.js, which the world editor writes.
const AREA_SLOTS=id=>WORLD_DATA.spawnSlots.filter(slot=>slot.areaId===id).map(slot=>Object.freeze({start:null,story:false,...slot}));
export const SPAWN_AREAS=Object.freeze(Object.fromEntries(Object.entries(WORLD_DATA.spawnAreas).map(([id,area])=>[id,Object.freeze({...area,slots:AREA_SLOTS(id)})])));
// Interiors belong to the area outside their door, so stepping indoors and back out is not a new visit.
export const SPAWN_PARENT=Object.freeze({cabin:'landing','chief-house':'village','guest-lodge':'village'});
// An area only rolls on entry once Eli has been away this long, so walking back and forth cannot farm rolls.
export const AWAY_SECONDS=WORLD_DATA.settings.awaySeconds;
// New creatures never appear within this distance of the player.
export const SPAWN_CLEARANCE=WORLD_DATA.settings.clearance;
// Shiny creatures: rare spawns whose uncertain drops are far more likely, on top of Luck and still capped at certainty.
export const SHINY=Object.freeze({...WORLD_DATA.settings.shiny});
export const SLOTS=Object.freeze(Object.fromEntries(Object.values(SPAWN_AREAS).flatMap(area=>area.slots.map(slot=>[slot.id,slot]))));
// The creatures a journey begins with, land before water, in the order the original hand-placed homes used.
export const startingSlots=test=>Object.values(SLOTS).filter(slot=>slot.start&&test(slot.start)).sort((a,b)=>(a.habitat==='water')-(b.habitat==='water'));
