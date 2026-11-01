// The world editor's bridge between the Reedwater Delta Atlas page and the game.
// The editor lives in the atlas artifact ("Edit world"), which keeps its data in a shared database. This script
// turns a download of that database into src/world-data.js, so shipping editor changes is a one-file PR.
//
//   node scripts/world-editor.mjs export <db-dir>   writes src/world-data.js from the downloaded collections
//   node scripts/world-editor.mjs seed <out-dir>    writes the game's current world data as editor documents
//
// <db-dir> holds spawnAreas/, spawnSlots/, npcs/ and bosses/, one JSON file per document.
import {readdir,readFile,writeFile,mkdir} from 'node:fs/promises';
import {join} from 'node:path';

const HABITATS=['land','water'];
const num=(v,min,max,fallback)=>typeof v==='number'&&Number.isFinite(v)?Math.min(max,Math.max(min,v)):fallback;
const text=(v,max=240)=>typeof v==='string'?v.slice(0,max):'';
const round=v=>Math.round(v);
const id=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(v)?v:null;

// Editor documents to the game's data shape. Anything malformed is dropped with a note rather than shipped.
export function fromEditor({spawnAreas=[],spawnSlots=[],npcs=[],bosses=[]},areas,notes=[]){
 const known=a=>Object.hasOwn(areas,a);
 const settingsDoc=spawnAreas.find(d=>d.id==='_shared')||{};
 const shiny=settingsDoc.shiny||{};
 const settings={awaySeconds:num(settingsDoc.awaySeconds,0,3600,30),clearance:num(settingsDoc.clearance,0,2000,350),
  shiny:{chance:num(shiny.chance,0,1,.01),loot:num(shiny.loot,1,20,4),health:num(shiny.health,1,10,1.5),huntXp:num(shiny.huntXp,1,20,2),seenRange:num(shiny.seenRange,50,2000,520)}};
 const out={settings,spawnAreas:{},spawnSlots:[],npcs:[],bosses:[]};
 // Areas keep the order they were first listed in (new ones go last, in map order), and so do their spawn points:
 // the order decides which creatures a journey starts with, so reordering would quietly change a new game.
 const mapOrder=new Map(Object.keys(areas).map((a,i)=>[a,i])),rank=d=>(d.order??1e3)*1e3+(mapOrder.get(d.id)??999);
 for(const d of spawnAreas.filter(d=>d.id!=='_shared').sort((a,b)=>rank(a)-rank(b))){
  if(!known(d.id)){notes.push(`Skipped spawn settings for unknown area ${d.id}.`);continue;}
  const tables={};
  for(const h of HABITATS){const t=d.tables?.[h];if(!t)continue;const row=Object.fromEntries(Object.entries(t).filter(([s,w])=>id(s)&&num(w,0,1000,0)>0).map(([s,w])=>[s,round(w)]));if(Object.keys(row).length)tables[h]=row;}
  out.spawnAreas[d.id]={cap:round(num(d.cap,0,60,4)),chance:num(d.chance,0,1,.5),respawnSeconds:round(num(d.respawnSeconds,5,3600,75)),tables};
 }
 const order=new Map([...Object.keys(out.spawnAreas),...Object.keys(areas)].map((a,i,all)=>[a,all.indexOf(a)]));
 const byArea=(a,b)=>((order.get(a.areaId)??1e6)-(order.get(b.areaId)??1e6))||((a.order??1e6)-(b.order??1e6))||a.id.localeCompare(b.id);
 for(const d of [...spawnSlots].sort(byArea)){
  const area=areas[d.areaId];
  if(!id(d.id)||!area||!out.spawnAreas[d.areaId]){notes.push(`Skipped spawn point ${d.id}: its area has no spawn settings.`);continue;}
  if(!HABITATS.includes(d.habitat)){notes.push(`Skipped spawn point ${d.id}: unknown habitat.`);continue;}
  const slot={id:d.id,areaId:d.areaId,habitat:d.habitat,x:round(num(d.x,0,area.width,0)),y:round(num(d.y,0,area.height,0))};
  if(id(d.start))slot.start=d.start;if(d.story===true)slot.story=true;
  out.spawnSlots.push(slot);
 }
 // Villagers keep one running order across all areas: it staggers when each strolling villager turns around.
 for(const d of [...npcs].sort((a,b)=>((a.order??1e6)-(b.order??1e6))||byArea(a,b))){
  const area=areas[d.areaId];if(!id(d.id)||!area){notes.push(`Skipped NPC ${d.id}: unknown area.`);continue;}
  const n={id:d.id,name:text(d.name,40)||'Villager',areaId:d.areaId,x:round(num(d.x,0,area.width,0)),y:round(num(d.y,0,area.height,0)),greeting:text(d.greeting),spriteId:id(d.spriteId)||'villager-net'};
  if(d.end&&typeof d.end.x==='number'&&typeof d.end.y==='number')n.end={x:round(num(d.end.x,0,area.width,0)),y:round(num(d.end.y,0,area.height,0))};
  if(d.child===true)n.child=true;
  if(['left','right'].includes(d.facing))n.facing=d.facing;
  if(typeof d.talkRange==='number')n.talkRange=round(num(d.talkRange,30,300,75));
  out.npcs.push(n);
 }
 for(const d of [...bosses].sort(byArea)){
  const area=areas[d.areaId];if(!id(d.id)||!area){notes.push(`Skipped boss ${d.id}: unknown area.`);continue;}
  out.bosses.push({id:d.id,name:text(d.name,40)||'Boss',areaId:d.areaId,x:round(num(d.x,0,area.width,0)),y:round(num(d.y,0,area.height,0)),species:id(d.species)||'shadow-walker',
   health:num(d.health,.5,50,3),damage:num(d.damage,.5,20,1.5),arena:round(num(d.arena,100,2000,420)),trigger:text(d.trigger,40)||'always',respawnMinutes:round(num(d.respawnMinutes,0,1440,30)),notes:text(d.notes,400)});
 }
 return out;
}

// The game's data back to editor documents, for the first load and for resetting the editor to what is shipped.
export function toEditor(data){
 const {settings}=data;
 const order=new Map();const next=a=>{const n=(order.get(a)||0)+1;order.set(a,n);return n;};
 return {
  spawnAreas:[{id:'_shared',...settings},...Object.entries(data.spawnAreas).map(([areaId,a],i)=>({id:areaId,...a,order:i+1}))],
  spawnSlots:data.spawnSlots.map(s=>({...s,start:s.start||null,story:!!s.story,order:next(s.areaId)})),
  npcs:data.npcs.map((n,i)=>({...n,order:i+1})),
  bosses:data.bosses.map(b=>({...b}))
 };
}

// One entry per line, so a moved spawn point or a changed weight is a one-line diff.
export function formatWorldData(data){
 const j=v=>JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g,'$1:');
 const list=rows=>rows.length?`[\n${rows.map(r=>'  '+j(r)).join(',\n')}\n ]`:'[]';
 return `// World data: where creatures spawn and how often, where villagers stand, and planned boss spots.
// Generated by the world editor (Reedwater Delta Atlas → Edit world) with scripts/world-editor.mjs. Edit it there and
// ship from there; hand edits work too, but the next export from the editor replaces this file.
export const WORLD_DATA=Object.freeze({
 settings:${j(data.settings)},
 spawnAreas:{
${Object.entries(data.spawnAreas).map(([k,v])=>`  ${j(k)}:${j(v)}`).join(',\n')}
 },
 spawnSlots:${list(data.spawnSlots)},
 npcs:${list(data.npcs)},
 bosses:${list(data.bosses)}
});
`.replace(/^  "([a-z][a-z0-9]*)":/gm,'  $1:');
}

async function readCollection(dir,name){
 const path=join(dir,name);let files=[];try{files=(await readdir(path)).filter(f=>f.endsWith('.json'));}catch{return [];}
 const docs=[];for(const f of files){const raw=JSON.parse(await readFile(join(path,f),'utf8'));const d=raw.data&&typeof raw.data==='object'?raw.data:raw;docs.push({...d,id:d.id||f.replace(/\.json$/,'')});}
 return docs;
}

if(import.meta.url===`file://${process.argv[1]}`){
 const [cmd,dir]=process.argv.slice(2);
 const {AREAS,INTERIOR_AREAS}=await import('../src/wilds.js');
 const areas=Object.fromEntries(Object.entries(AREAS).filter(([k])=>!INTERIOR_AREAS.includes(k)));
 if(cmd==='export'&&dir){
  const notes=[];const docs={};for(const c of ['spawnAreas','spawnSlots','npcs','bosses'])docs[c]=await readCollection(dir,c);
  const data=fromEditor(docs,areas,notes);
  await writeFile('src/world-data.js',formatWorldData(data));
  console.log(`src/world-data.js: ${Object.keys(data.spawnAreas).length} spawn areas, ${data.spawnSlots.length} spawn points, ${data.npcs.length} NPCs, ${data.bosses.length} bosses.`);
  for(const n of notes)console.log('  note:',n);
 }else if(cmd==='seed'&&dir){
  const {WORLD_DATA}=await import('../src/world-data.js');const docs=toEditor(WORLD_DATA);
  for(const [c,rows] of Object.entries(docs)){await mkdir(join(dir,c),{recursive:true});for(const r of rows)await writeFile(join(dir,c,`${r.id}.json`),JSON.stringify(r,null,1));}
  console.log(`Seed written to ${dir}.`);
 }else{console.log('Usage: node scripts/world-editor.mjs export <db-dir> | seed <out-dir>');process.exitCode=1;}
}
