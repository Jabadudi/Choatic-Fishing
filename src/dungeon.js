// The Regions dungeon: Reedwater Wilds, maps 1.1 to 1.3 played as one run that can be repeated. Eli starts in a small
// camp (Wilds Camp) with a glowing portal. Stepping up to it shows the entry card (src/dungeon-ui.js); ENTER starts a
// fresh run on 1.1 with every monster back. Clearing a map opens its east gate as before; beating the last map (1.3,
// Mudshell) ends the run with a run rank and the results screen, which offers Run again or Back to camp. Walking back
// west out of 1.1 returns to camp and ends the run. Gameplay only.
import {fieldMap,rankFor,rankOrder,RANKS} from './field-maps.js';
import {createBunches} from './field-play.js';
import {areaFor} from './wilds.js';
import {DELTA} from './delta-areas.js';
export const CAMP='wilds-camp';
// The maps of the run, in order (src/region-play.js REGION_MAPS lists the same ones).
export const DUNGEON=Object.freeze({id:'reedwater-wilds',name:'Reedwater Wilds',maps:Object.freeze(['dewdrop-meadow','mossroot-trail','saltspray-shore']),boss:'Mudshell'});
// How close to the portal Eli must stand for the entry card.
export const PORTAL_REACH=130;
export const createDungeon=()=>({runs:0,clears:0,best:null,run:null,result:null});
export const portalOf=()=>DELTA[CAMP]?.props.find(p=>p.kind==='portal')||null;
export function nearPortal(world){
 if(!world.regions||world.areaId!==CAMP||world.dungeon?.result)return false;
 const q=portalOf(),p=world.player;return !!q&&Math.hypot(p.x-q.x,p.y-q.y)<PORTAL_REACH;
}
// Every map of the run starts over: no kills, nobody down, a fresh clock. Best ranks and clear counts stay.
function resetMaps(world){
 for(const id of DUNGEON.maps){const s=world.fieldMaps[id];Object.assign(s,{kills:0,elite:!fieldMap(id).elite,startedAt:null,damage:0,combo:0,defeated:[]});}
 world.wildlife=DUNGEON.maps.flatMap(id=>createBunches(world,id));
}
export function startRun(world){
 const d=world.dungeon??=createDungeon();
 resetMaps(world);
 d.runs++;d.run={startedAt:world.elapsed};d.result=null;world.fieldClear=null;
 const first=DUNGEON.maps[0],spawn=areaFor(first).spawn;
 world.enterArea({areaId:first,x:spawn.x,y:spawn.y},world.player,`${DUNGEON.name} · Run ${d.runs} · ${fieldMap(first).code} ${areaFor(first).name}. Defeat every slime to open the gate east.`);
 world.player.health=world.progression?.maxHealth??world.player.health;
 return true;
}
// The run's totals across its maps, ranked as an average map so the bar is the same as for one map.
export function runTotals(world){
 const states=DUNGEON.maps.map(id=>world.fieldMaps[id]),d=world.dungeon,seconds=Math.max(0,world.elapsed-(d?.run?.startedAt??world.elapsed));
 const damage=states.reduce((n,s)=>n+s.damage,0),combo=Math.max(...states.map(s=>s.combo)),kills=states.reduce((n,s)=>n+s.kills,0);
 const {rank}=rankFor({seconds:seconds/DUNGEON.maps.length,damage:damage/DUNGEON.maps.length,combo});
 return {rank,seconds,damage:Math.round(damage),combo,kills};
}
const better=(a,b)=>!b||rankOrder(a.rank)<rankOrder(b.rank)||a.rank===b.rank&&a.seconds<b.seconds;
// Called when a map of the run is cleared; the last one ends the run. Returns text for the kill message, if any.
export function mapDone(world,id){
 const d=world.dungeon;if(!d?.run||id!==DUNGEON.maps.at(-1))return '';
 const totals=runTotals(world),best=better(totals,d.best);
 d.clears++;if(best)d.best={rank:totals.rank,seconds:totals.seconds,combo:totals.combo,damage:totals.damage};
 d.result={...totals,best,run:d.runs};d.run=null;
 return `${DUNGEON.name} cleared · Run rank ${totals.rank}`;
}
export function backToCamp(world,message='Back at Wilds Camp. Step into the portal to run the dungeon again.'){
 const d=world.dungeon??=createDungeon();d.run=null;d.result=null;world.fieldClear=null;
 const spawn=areaFor(CAMP).spawn;world.enterArea({areaId:CAMP,x:spawn.x,y:spawn.y},world.player,message);
}
// Walking out of the run's first map west lands in camp: the run ends there.
export function leftRun(world){const d=world.dungeon;if(d?.run){d.run=null;return 'You leave the dungeon. That run is over; the portal will start a fresh one.';}return '';}
// A saved dungeon record, checked like the rest of the save.
export function restoreDungeon(data,world,fail=m=>{throw Error(m);}){
 world.dungeon=createDungeon();if(data===undefined||data===null)return;
 const n=v=>typeof v==='number'&&Number.isFinite(v)&&v>=0&&v<1e12,rank=r=>RANKS.some(([x])=>x===r);
 if(typeof data!=='object'||!Number.isSafeInteger(data.runs)||data.runs<0||!Number.isSafeInteger(data.clears)||data.clears<0)fail('Invalid dungeon data.');
 if(data.best!==null&&(typeof data.best!=='object'||!rank(data.best.rank)||!n(data.best.seconds)||!n(data.best.combo)||!n(data.best.damage)))fail('Invalid dungeon data.');
 if(data.run!==null&&(typeof data.run!=='object'||!n(data.run.startedAt)))fail('Invalid dungeon data.');
 Object.assign(world.dungeon,{runs:data.runs,clears:data.clears,best:data.best?{...data.best}:null,run:data.run?{startedAt:data.run.startedAt}:null});
}
export const saveDungeon=world=>{const d=world.dungeon;return d?{runs:d.runs,clears:d.clears,best:d.best?{...d.best}:null,run:d.run?{...d.run}:null}:null;};
