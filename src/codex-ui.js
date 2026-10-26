import {CODEX_CATEGORIES,CODEX_ENTRIES,CODEX_MAPS,codexEntries,codexLocations,codexRegions,codexLoot,chanceLabel} from './codex.js';
import {ANIMAL_TYPES,BEHAVIOR_LABELS} from './entities.js';
import {ITEM_CATEGORIES} from './inventory.js';
import {setItemIcon} from './item-icons.js';
import {spriteAssetUrl} from './sprites.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const BOOK='<path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5zM6.5 8h2.5M6.5 11h2.5M15 8h2.5M15 11h2.5"/>';
const CATEGORY_ICONS={
 wildlife:'<path d="M7 20c0-4 2-6 5-6s5 2 5 6M9 9.5a1.5 2 0 1 0 0 .1M15 9.5a1.5 2 0 1 0 0 .1M5 13a1.5 2 0 1 0 0 .1M19 13a1.5 2 0 1 0 0 .1"/>',
 monsters:'<path d="M6 21V11a6 6 0 0 1 12 0v10l-2-2-2 2-2-2-2 2-2-2zM9.5 11h1M13.5 11h1"/>',
 bosses:'<path d="M4 18h16M5 18L4 7l5 4 3-6 3 6 5-4-1 11M12 14v.5"/>',
 guardians:'<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6zM9 12l2 2 4-4"/>',
 villagers:'<path d="M9 11a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM3 20c0-3.5 2.7-6 6-6s6 2.5 6 6M16 5.5a3 3 0 0 1 0 5.5M18 14c2 .8 3 3 3 6"/>'
};
const categoryLabel=id=>ITEM_CATEGORIES.find(c=>c.id===id)?.label||'';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
function portrait(entry,className){
 const frame=el('span',className);
 if(entry.portrait){const image=el('img');image.src=spriteAssetUrl(entry.portrait);image.alt='';image.draggable=false;frame.append(image);}
 else frame.append(el('span','codex-glyph',entry.glyph||'?'));
 return frame;
}
// The index only reads game data. Hunt counts come from the journey; everything else is static knowledge.
export function mountCodex({getWorld,onOpen,onClose}){
 const button=document.createElement('button');button.id='open-codex';button.hidden=true;
 button.setAttribute('aria-label','Open creature index');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML=`${svg(BOOK,22)}<span>Index</span>`;
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='codex-sheet';dialog.setAttribute('aria-labelledby','codex-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(BOOK,40)}</span><h2 id="codex-title">Creature Index</h2><p class="backpack-capacity"></p><button class="backpack-close" aria-label="Close creature index">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div><div class="codex-body"><nav class="codex-nav" aria-label="Index entries"></nav><section class="codex-detail" aria-live="polite"></section></div></div>`;
 document.body.append(dialog);
 const nav=dialog.querySelector('.codex-nav'),detail=dialog.querySelector('.codex-detail');
 let selectedId=CODEX_ENTRIES[0].id,lastKey='';
 for(const category of CODEX_CATEGORIES){
  const group=el('div','codex-group'),heading=el('h3','codex-category');heading.innerHTML=svg(CATEGORY_ICONS[category.id],18);heading.append(el('span',null,category.label));group.append(heading);
  for(const entry of codexEntries(category.id)){
   const item=el('button','codex-entry');item.dataset.id=entry.id;item.append(portrait(entry,'codex-thumb'));
   const label=el('span','codex-entry-text');label.append(el('strong',null,entry.name),el('small',null,entry.title));item.append(label);
   item.onclick=()=>{selectedId=entry.id;lastKey='';refresh();};group.append(item);
  }
  nav.append(group);
 }
 const facts=(entry,world)=>{
  const list=el('dl','codex-facts'),add=(term,value)=>list.append(el('dt',null,term),el('dd',null,String(value)));
  const spec=ANIMAL_TYPES[entry.species];
  if(spec){add('Health',spec.maxHealth);add('Behaviour',BEHAVIOR_LABELS[spec.behavior||'passive']);add('Hunting XP',`+${spec.huntXp}`);add('Hunted',world.hunting?.bySpecies?.[entry.species]||0);}
  else{if(entry.behavior)add('Behaviour',BEHAVIOR_LABELS[entry.behavior]);add('Status',entry.status);}
  add('First seen',entry.firstSeen);return list;
 };
 function minimap(entry){
  const map=CODEX_MAPS[entry.map],points=codexLocations(entry).filter(p=>p.map===entry.map),regions=codexRegions(entry);
  const figure=el('figure','codex-map'),caption=el('figcaption','codex-panel-title');caption.innerHTML=svg('<path d="M9 4L3 6v14l6-2 6 2 6-2V4l-6 2zM9 4v14M15 6v14"/>',18);caption.append(el('span',null,`Where to find · ${map.name}`));
  const frame=el('div','codex-map-frame'),image=el('img');image.src=spriteAssetUrl(map.asset);image.alt=`${map.name} atlas`;image.draggable=false;frame.append(image);
  for(const point of points){const dot=el('span','codex-dot');dot.style.left=`${point.x*100}%`;dot.style.top=`${point.y*100}%`;frame.append(dot);}
  if(!points.length)frame.append(el('span','codex-unknown',entry.status||'Whereabouts unknown'));
  frame.setAttribute('role','img');frame.setAttribute('aria-label',points.length?`${points.length} ${points.length===1?'location':'locations'}: ${regions.join(', ')}`:'No known locations');
  figure.append(caption,frame,el('p','codex-regions',regions.length?regions.join(' · '):'No sightings yet'));return figure;
 }
 function lootPanel(entry){
  const loot=codexLoot(entry),panel=el('section','codex-loot'),title=el('h4','codex-panel-title');
  title.innerHTML=svg(loot.kind==='wares'?'<path d="M4 9l2-5h12l2 5M4 9h16v11H4zM4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M10 20v-5h4v5"/>':'<path d="M5 8h14l-1 12H6zM8 8V6a4 4 0 0 1 8 0v2M9 12h6"/>',18);
  title.append(el('span',null,loot.kind==='wares'?'Wares for trade':'Loot table'));panel.append(title);
  if(!loot.rows.length){panel.append(el('p','codex-note',entry.lootNote||'Nothing to take.'));return panel;}
  const table=el('table','codex-table'),head=el('tr');
  for(const text of ['Item',loot.kind==='wares'?'Trade for':'Drop chance'])head.append(el('th',null,text));
  const thead=el('thead');thead.append(head);const body=el('tbody');
  for(const row of loot.rows){
   const tr=el('tr'),cell=el('td','codex-item'),icon=el('span','codex-item-icon');setItemIcon(icon,row.item);
   const text=el('span');text.append(el('strong',null,row.note?`${row.item} ${row.note}`:row.item),el('small',null,categoryLabel(row.category)));cell.append(icon,text);
   const value=el('td','codex-chance',loot.kind==='wares'?row.price:chanceLabel(row.chance));if(row.chance>=1)value.classList.add('always');
   if(loot.kind==='drops'){const bar=el('i','codex-chance-bar');bar.style.width=`${row.chance*100}%`;value.append(bar);}
   tr.append(cell,value);body.append(tr);
  }
  table.append(thead,body);panel.append(table);
  panel.append(el('p','codex-note',loot.kind==='wares'?'Barter opens in a later chapter. These are the trades on offer.':entry.lootNote||'Each item rolls on its own. Luck raises the chance of the rarer ones.'));
  return panel;
 }
 function refresh(){
  const world=getWorld(),entry=CODEX_ENTRIES.find(e=>e.id===selectedId),key=JSON.stringify([selectedId,world.hunting]);if(key===lastKey)return;lastKey=key;
  const hunted=Object.values(world.hunting?.bySpecies||{}).reduce((a,b)=>a+b,0);
  dialog.querySelector('.backpack-capacity').textContent=`${CODEX_ENTRIES.length} entries in ${CODEX_CATEGORIES.length} categories | ${hunted} ${hunted===1?'animal':'animals'} hunted`;
  for(const item of nav.querySelectorAll('.codex-entry'))item.setAttribute('aria-pressed',item.dataset.id===selectedId);
  const category=CODEX_CATEGORIES.find(c=>c.id===entry.category),hero=el('div','codex-hero'),about=el('div','codex-about');
  about.append(el('small','codex-kicker',category.label),el('h3',null,entry.name),el('p','codex-subtitle',entry.title),el('p','codex-description',entry.description));
  hero.append(portrait(entry,'codex-portrait'),about,facts(entry,world));
  const panels=el('div','codex-panels');panels.append(minimap(entry),lootPanel(entry));
  detail.replaceChildren(hero,panels);
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();lastKey='';refresh();dialog.showModal();button.setAttribute('aria-expanded','true');nav.querySelector('[aria-pressed="true"]')?.focus();}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},select(id){if(CODEX_ENTRIES.some(e=>e.id===id)){selectedId=id;lastKey='';if(dialog.open)refresh();}},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
