// The Regions dungeons: Reedwater Wilds (1.1 to 1.3), Thornberry Vale (1.4 to 1.7) and Lanternlight Wilds (1.8 to
// 1.11), each a run of maps that can be repeated. Eli starts in a small
// camp (Wilds Camp) with a glowing portal. Stepping up to it shows the entry card (src/dungeon-ui.js); ENTER starts a
// fresh run on 1.1 with every monster back. Clearing a map opens its east gate as before; beating the last map (1.3,
// Mudshell) ends the run with a run rank and the results screen, which offers Run again or Back to camp. Walking back
// west out of 1.1 returns to camp and ends the run. Gameplay only.
import {fieldMap,rankFor,rankOrder,RANKS} from './field-maps.js';
import {createBunches} from './field-play.js';
import {areaFor} from './wilds.js';
import {DELTA} from './delta-areas.js';
import {ANIMAL_TYPES} from './entities.js';
export const CAMP='wilds-camp';
// The dungeons of Region 1, each a run of field maps that ends on its boss. Each has its own portal in camp.
export const DUNGEONS=Object.freeze([
 Object.freeze({id:'reedwater-wilds',name:'Reedwater Wilds',maps:Object.freeze(['dewdrop-meadow','mossroot-trail','saltspray-shore']),boss:'Mudshell'}),
 Object.freeze({id:'thornberry-vale',name:'Thornberry Vale',maps:Object.freeze(['bramble-hollow','toadstool-glen','thistle-downs','cattail-fen']),boss:'Old Croaker'}),
 Object.freeze({id:'lanternlight-wilds',name:'Lanternlight Wilds',maps:Object.freeze(['lantern-glade','ember-ridge','pebble-strand','mossback-ruins']),boss:'Capstomper'})
]);
// The first dungeon, kept under its old name.
export const DUNGEON=DUNGEONS[0];
export const dungeonById=id=>DUNGEONS.find(d=>d.id===id)||null;
export const dungeonOfMap=areaId=>DUNGEONS.find(d=>d.maps.includes(areaId))||null;
// How close to the portal Eli must stand for the entry card.
export const PORTAL_REACH=130;
const createRecord=()=>({runs:0,clears:0,best:null});
// run and result carry the id of their dungeon; records keep runs, clears and the best run of each dungeon.
export const createDungeon=()=>({run:null,result:null,records:Object.fromEntries(DUNGEONS.map(d=>[d.id,createRecord()]))});
export const recordOf=(world,id)=>{const d=world.dungeon??=createDungeon();return d.records[id]??=createRecord();};
// The camp portal of a dungeon (each portal prop names its dungeon).
export const portalOf=(id=DUNGEON.id)=>DELTA[CAMP]?.props.find(p=>p.kind==='portal'&&(p.dungeon||DUNGEON.id)===id)||null;
// The dungeon whose portal Eli stands by, or null.
export function nearPortal(world){
 if(!world.regions||world.areaId!==CAMP||world.dungeon?.result)return null;
 const p=world.player;
 for(const d of DUNGEONS){const q=portalOf(d.id);if(q&&Math.hypot(p.x-q.x,p.y-q.y)<PORTAL_REACH)return d.id;}
 return null;
}
// Every map of the run starts over: no kills, nobody down, a fresh clock. Best ranks and clear counts stay.
function resetMaps(world,dungeon){
 for(const id of dungeon.maps){const s=world.fieldMaps[id];Object.assign(s,{kills:0,elite:!fieldMap(id).elite,startedAt:null,damage:0,combo:0,defeated:[]});}
 world.wildlife=dungeon.maps.flatMap(id=>createBunches(world,id));
}
export function startRun(world,id=world.dungeon?.result?.id||DUNGEON.id){
 const dungeon=dungeonById(id);if(!dungeon)return false;
 const d=world.dungeon??=createDungeon(),rec=recordOf(world,id);
 resetMaps(world,dungeon);
 rec.runs++;d.run={id,startedAt:world.elapsed};d.result=null;world.fieldClear=null;
 const first=dungeon.maps[0],spawn=areaFor(first).spawn,foe=(ANIMAL_TYPES[fieldMap(first).species]?.name||'monster').toLowerCase();
 world.enterArea({areaId:first,x:spawn.x,y:spawn.y},world.player,`${dungeon.name} · Run ${rec.runs} · ${fieldMap(first).code} ${areaFor(first).name}. Defeat every ${foe} to open the gate east.`);
 world.player.health=world.progression?.maxHealth??world.player.health;
 return true;
}
// The run's totals across its maps, ranked as an average map so the bar is the same as for one map.
export function runTotals(world){
 const dungeon=dungeonById(world.dungeon?.run?.id)||DUNGEON,states=dungeon.maps.map(id=>world.fieldMaps[id]),d=world.dungeon,seconds=Math.max(0,world.elapsed-(d?.run?.startedAt??world.elapsed));
 const damage=states.reduce((n,s)=>n+s.damage,0),combo=Math.max(...states.map(s=>s.combo)),kills=states.reduce((n,s)=>n+s.kills,0);
 const {rank}=rankFor({seconds:seconds/dungeon.maps.length,damage:damage/dungeon.maps.length,combo});
 return {rank,seconds,damage:Math.round(damage),combo,kills};
}
const better=(a,b)=>!b||rankOrder(a.rank)<rankOrder(b.rank)||a.rank===b.rank&&a.seconds<b.seconds;
// Called when a map of the run is cleared; the last one ends the run. Returns text for the kill message, if any.
export function mapDone(world,id){
 const d=world.dungeon,dungeon=dungeonById(d?.run?.id);if(!dungeon||id!==dungeon.maps.at(-1))return '';
 const rec=recordOf(world,dungeon.id),totals=runTotals(world),best=better(totals,rec.best);
 rec.clears++;if(best)rec.best={rank:totals.rank,seconds:totals.seconds,combo:totals.combo,damage:totals.damage};
 d.result={...totals,best,run:rec.runs,id:dungeon.id};d.run=null;
 return `${dungeon.name} cleared · Run rank ${totals.rank}`;
}
export function backToCamp(world,message='Back at Wilds Camp. Step into the portal to run the dungeon again.'){
 const d=world.dungeon??=createDungeon();d.run=null;d.result=null;world.fieldClear=null;
 const spawn=areaFor(CAMP).spawn;world.enterArea({areaId:CAMP,x:spawn.x,y:spawn.y},world.player,message);
}
// Walking out of the run's first map west lands in camp: the run ends there.
export function leftRun(world){const d=world.dungeon;if(d?.run){d.run=null;return 'You leave the dungeon. That run is over; the portal will start a fresh one.';}return '';}
// A saved dungeon record, checked like the rest of the save. Saves from before the second dungeon kept one record
// ({runs, clears, best, run}) for Reedwater Wilds.
export function restoreDungeon(data,world,fail=m=>{throw Error(m);}){
 world.dungeon=createDungeon();if(data===undefined||data===null)return;
 const bad=()=>fail('Invalid dungeon data.'),n=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1e12,rank=r=>RANKS.some(([x])=>x===r);
 if(typeof data!=='object')bad();
 const old=!('records' in data),records=old?{[DUNGEON.id]:data}:data.records,run=data.run;
 if(!records||typeof records!=='object')bad();
 for(const [id,r] of Object.entries(records)){
  if(!dungeonById(id)||!r||typeof r!=='object'||!Number.isSafeInteger(r.runs)||r.runs<0||!Number.isSafeInteger(r.clears)||r.clears<0)bad();
  if(r.best!==null&&r.best!==undefined&&(typeof r.best!=='object'||!rank(r.best.rank)||!n(r.best.seconds)||!n(r.best.combo)||!n(r.best.damage)))bad();
  world.dungeon.records[id]={runs:r.runs,clears:r.clears,best:r.best?{rank:r.best.rank,seconds:r.best.seconds,combo:r.best.combo,damage:r.best.damage}:null};
 }
 if(run!==null&&run!==undefined){
  const id=old?DUNGEON.id:run?.id;
  if(typeof run!=='object'||!n(run.startedAt)||!dungeonById(id))bad();
  world.dungeon.run={id,startedAt:run.startedAt};
 }
}
export const saveDungeon=world=>{const d=world.dungeon;return d?{run:d.run?{...d.run}:null,records:Object.fromEntries(Object.entries(d.records).map(([id,r])=>[id,{runs:r.runs,clears:r.clears,best:r.best?{...r.best}:null}]))}:null;};
