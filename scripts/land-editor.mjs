// The land editor's bridge between the Reedwater Delta Atlas page and the game.
// The editor lives in the atlas artifact (Edit world → Land). It keeps one document per area in the atlas database's
// `land` collection, holding that area's terrain as a JSON string in `def`, in atlas pixels like delta-areas.js.
// `land/_shared` holds the `lastEditAt`/`shippedAt` marker.
//
//   node scripts/land-editor.mjs export <db-dir>   writes src/land-data.js from a download of the land collection
//   node scripts/land-editor.mjs seed <out-file>   writes the game's current terrain for the editor (world/land.json)
//
// <db-dir> holds land/, one JSON file per document.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {join} from 'node:path';
import {BUILT_DEFS,DELTA_DEFS,LAND_FIELDS} from '../src/delta-areas.js';
import {PROP_SOLID,PROP_ART} from '../src/atlas-area.js';

export const ZONES=['meadow','clear','forest','sand','rock','marsh','dirt'];
const EDGES=['north','south','west','east'];
const isNum=v=>typeof v==='number'&&Number.isFinite(v);
const clamp=(v,min,max)=>Math.min(max,Math.max(min,v));
const r1=v=>Math.round(v*10)/10;
const id=v=>typeof v==='string'&&/^[a-z0-9][a-z0-9-]{0,63}$/.test(v)?v:null;
const text=(v,max)=>typeof v==='string'?v.slice(0,max):'';
const color=v=>typeof v==='string'&&/^#[0-9a-fA-F]{3,8}$/.test(v)?v:null;
// Key order does not matter: the database does not keep it.
const canon=v=>Array.isArray(v)?v.map(canon):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canon(v[k])])):v;
const same=(a,b)=>JSON.stringify(canon(a))===JSON.stringify(canon(b));

// One area's editor document to the fields the game takes. Anything malformed is dropped with a note.
export function cleanLand(def,built,notes=[]){
 const [X0,X1,Y0,Y1]=built.frame,pad=40,where=`${built.id}`;
 const pt=p=>Array.isArray(p)&&p.length===2&&isNum(p[0])&&isNum(p[1])?[r1(clamp(p[0],X0-pad,X1+pad)),r1(clamp(p[1],Y0-pad,Y1+pad))]:null;
 // Arrival spots are in the target area's part of the atlas, so they only need to be on the atlas.
 const atlasPt=p=>Array.isArray(p)&&p.length===2&&isNum(p[0])&&isNum(p[1])?[r1(clamp(p[0],0,720)),r1(clamp(p[1],0,480))]:null;
 const pts=(list,min)=>{if(!Array.isArray(list))return null;const out=list.map(pt);return out.length>=min&&out.every(Boolean)?out:null;};
 const out={},drop=what=>notes.push(`${where}: dropped ${what}.`);
 if(Object.hasOwn(def,'base'))def.base==='land'||def.base==='water'?out.base=def.base:drop('an unknown base');
 if(Object.hasOwn(def,'sea'))out.sea=def.sea===true;
 if(Object.hasOwn(def,'ground'))ZONES.includes(def.ground)?out.ground=def.ground:drop(`ground ${def.ground}`);
 if(Object.hasOwn(def,'size')){const s=def.size;Array.isArray(s)&&isNum(s[0])&&isNum(s[1])?out.size=[Math.round(clamp(s[0],400,6000)),Math.round(clamp(s[1],400,6000))]:drop('a bad size');}
 if(Object.hasOwn(def,'spawn')){if(def.spawn==null)out.spawn=undefined;else{const p=pt(def.spawn);p?out.spawn=p:drop('a bad arrival spot');}}
 if(Array.isArray(def.shapes))out.shapes=def.shapes.flatMap((s,i)=>{
  if(!Array.isArray(s)||!['land','water'].includes(s[0])){drop(`shape ${i+1}`);return [];}
  const [op,form,...rest]=s;
  if(form==='ellipse'){const c=pt(rest[0]);if(!c||!isNum(rest[1])||!isNum(rest[2])){drop(`shape ${i+1}`);return [];}return [[op,'ellipse',c,r1(clamp(rest[1],.2,200)),r1(clamp(rest[2],.2,200))]];}
  if(form==='line'){const p=pts(rest[0],2);if(!p||!isNum(rest[1])){drop(`shape ${i+1}`);return [];}return [[op,'line',p,r1(clamp(rest[1],.2,40))]];}
  const p=pts(form,3);if(!p){drop(`shape ${i+1}`);return [];}
  const zone=rest[0]?.zone;if(zone!==undefined&&!ZONES.includes(zone))drop(`ground ${zone} on shape ${i+1}`);
  return [op==='land'&&ZONES.includes(zone)?[op,p,{zone}]:[op,p]];
 });
 if(Array.isArray(def.zones))out.zones=def.zones.flatMap((z,i)=>{const p=Array.isArray(z)&&ZONES.includes(z[0])&&pts(z[1],3);if(!p){drop(`ground patch ${i+1}`);return [];}return [[z[0],p]];});
 if(Array.isArray(def.cliffs))out.cliffs=def.cliffs.flatMap((c,i)=>{const p=pts(c,3);if(!p){drop(`cliff ${i+1}`);return [];}return [p];});
 if(Array.isArray(def.roads))out.roads=def.roads.flatMap((r,i)=>{const p=pts(r,2);if(!p){drop(`trail ${i+1}`);return [];}return [p];});
 for(const k of ['walks','fords','bridges'])if(Array.isArray(def[k]))out[k]=def[k].flatMap((w,i)=>{
  if(w&&!Array.isArray(w)&&typeof w==='object'){const p=pts(w.pts,2);if(!p||!isNum(w.width)){drop(`${k} ${i+1}`);return [];}return [{pts:p,width:r1(clamp(w.width,.5,20))}];}
  const p=pts(w,2);if(!p){drop(`${k} ${i+1}`);return [];}return [p];
 });
 if(Array.isArray(def.props))out.props=def.props.flatMap((p,i)=>{
  if(!p||!Object.hasOwn(PROP_SOLID,p.kind)){drop(`prop ${i+1} (${p?.kind})`);return [];}
  const at=pt(p.at);if(!at){drop(`prop ${i+1}`);return [];}
  const o={kind:p.kind,at};
  if(PROP_ART[p.kind]&&PROP_ART[p.kind].includes(p.art))o.art=p.art;
  if(isNum(p.angle))o.angle=Math.round(clamp(p.angle,-7,7)*100)/100;
  if(isNum(p.scale)&&p.scale!==1)o.scale=r1(clamp(p.scale,.2,6));
  if(isNum(p.solid))o.solid=Math.round(clamp(p.solid,0,300));
  if(isNum(p.size))o.size=r1(clamp(p.size,.2,6));
  if(isNum(p.clear))o.clear=Math.round(clamp(p.clear,0,600));
  if(p.still===true)o.still=true;
  if(color(p.glow))o.glow=color(p.glow);
  if(color(p.roof))o.roof=color(p.roof);
  return [o];
 });
 const link=(t,label)=>{const target=id(t?.target);if(!target)return null;const o={target};if(Array.isArray(t.entry)){const e=atlasPt(t.entry);if(e)o.entry=e;}else if(t.entry&&isNum(t.entry.x)&&isNum(t.entry.y))o.entry={x:Math.round(t.entry.x),y:Math.round(t.entry.y)};return o;};
 if(Array.isArray(def.places)){const seen=new Set();out.places=def.places.flatMap((p,i)=>{
  const pid=id(p?.id),at=pt(p?.at);if(!pid||!at||seen.has(pid)){drop(`landmark ${i+1}`);return [];}seen.add(pid);
  const o={id:pid,name:text(p.name,60)||'Landmark',at,text:text(p.text,600)};
  if(typeof p.kind==='string'&&/^[a-z-]{1,20}$/.test(p.kind))o.kind=p.kind;
  if(p.travel){const t=link(p.travel);t?o.travel=t:drop(`the boat ride at ${o.name}`);}
  return [o];
 });}
 if(Array.isArray(def.exits))out.exits=def.exits.flatMap((e,i)=>{
  const target=id(e?.target);if(!target||!EDGES.includes(e.edge)||!isNum(e.from)||!isNum(e.to)){drop(`exit ${i+1}`);return [];}
  const [lo,hi]=e.edge==='north'||e.edge==='south'?[X0,X1]:[Y0,Y1],a=r1(clamp(Math.min(e.from,e.to),lo,hi)),b=r1(clamp(Math.max(e.from,e.to),lo,hi));
  if(b-a<1){drop(`exit ${i+1} (too narrow)`);return [];}
  const o={edge:e.edge,from:a,to:b,target,label:text(e.label,60)||target};
  if(typeof e.back==='string'&&e.back)o.back=text(e.back,60);
  const l=link(e);if(l?.entry)o.entry=l.entry;
  return [o];
 });
 if(Array.isArray(def.portals))out.portals=def.portals.flatMap((q,i)=>{const at=pt(q?.at),l=link(q);if(!at||!l){drop(`portal ${i+1}`);return [];}const o={at,r:Math.round(clamp(isNum(q.r)?q.r:60,10,300)),target:l.target,label:text(q.label,60)||l.target};if(l.entry)o.entry=l.entry;return [o];});
 return out;
}

// The downloaded land collection to land-data.js's shape: only the fields that differ from delta-areas.js.
export function fromEditor(docs,notes=[]){
 const built=Object.fromEntries(BUILT_DEFS.map(d=>[d.id,d])),out={};
 for(const doc of [...docs].sort((a,b)=>String(a.id).localeCompare(String(b.id)))){
  if(doc.id==='_shared')continue;
  const b=built[doc.id];if(!b){notes.push(`Skipped land for unknown area ${doc.id}.`);continue;}
  let def;try{def=typeof doc.def==='string'?JSON.parse(doc.def):doc.def;}catch{notes.push(`Skipped ${doc.id}: its land could not be read.`);continue;}
  if(!def||typeof def!=='object'){notes.push(`Skipped ${doc.id}: no land in it.`);continue;}
  const clean=cleanLand(def,b,notes),diff={};
  for(const k of LAND_FIELDS)if(Object.hasOwn(clean,k)&&!same(clean[k]??null,b[k]??null))diff[k]=clean[k]??null;
  if(Object.keys(diff).length)out[doc.id]=diff;
 }
 return out;
}

// One field per line, so a reshaped coast is a diff of a few lines, not a whole file.
export function formatLandData(data){
 const j=v=>JSON.stringify(v).replace(/"([a-zA-Z_][a-zA-Z0-9_]*)":/g,'$1:');
 const areas=Object.entries(data).map(([a,fields])=>` ${/^[a-z]+$/.test(a)?a:JSON.stringify(a)}:{\n${Object.entries(fields).map(([k,v])=>`  ${k}:${v===null?'undefined':j(v)}`).join(',\n')}\n }`);
 return `// Land edits: per-area terrain from the land editor (Reedwater Delta Atlas → Edit world → Land).
// Generated by scripts/land-editor.mjs. Each area listed here replaces those fields of its entry in delta-areas.js.
// Edit it in the atlas and ship from there; hand edits work too, but the next export replaces this file.
export const LAND_DATA=Object.freeze({${areas.length?'\n'+areas.join(',\n')+'\n':''}});
`;
}

// What the editor starts from: every atlas area's terrain as the game has it now, plus the choices it offers.
export function shippedLand(){
 const pick=d=>{const o={id:d.id,name:d.name,num:d.num,frame:d.frame};for(const k of LAND_FIELDS)if(d[k]!==undefined)o[k]=d[k];return o;};
 return {zones:ZONES,props:Object.keys(PROP_SOLID),propArt:PROP_ART,propSolid:PROP_SOLID,areas:Object.fromEntries(DELTA_DEFS.map(d=>[d.id,pick(d)]))};
}

async function readDocs(dir){
 const docs=[];let files=[];try{files=await readdir(dir);}catch{return docs;}
 for(const f of files.filter(f=>f.endsWith('.json')).sort()){const raw=JSON.parse(await readFile(join(dir,f),'utf8'));const d=raw.data&&typeof raw.data==='object'?raw.data:raw;docs.push({...d,id:d.id||raw.id||f.slice(0,-5)});}
 return docs;
}

if(import.meta.url===`file://${process.argv[1]}`){
 const [cmd,dir]=process.argv.slice(2);
 if(cmd==='export'&&dir){
  const notes=[],data=fromEditor(await readDocs(join(dir,'land')),notes);
  await writeFile(new URL('../src/land-data.js',import.meta.url),formatLandData(data));
  console.log(`Wrote src/land-data.js: ${Object.keys(data).length} areas changed (${Object.keys(data).join(', ')||'none'}).`);
  for(const n of notes)console.log('  note:',n);
 }else if(cmd==='seed'&&dir){
  await writeFile(dir,JSON.stringify(shippedLand()));console.log(`Wrote ${dir}.`);
 }else{console.log('Usage: node scripts/land-editor.mjs export <db-dir> | seed <out-file>');process.exit(1);}
}
