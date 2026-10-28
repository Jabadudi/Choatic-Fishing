// The exploring HUD laid out like an action RPG: portrait menu and minimap top-left, quest tracker under them, menu icons top-right,
// the hotbar down the right edge, health bottom-centre and action buttons bottom-right. It moves the existing HUD pieces into place
// and adds the pickup feed, first-find card and area banner. It only reads world state; actions go through the callbacks.
import {notePickups} from './pickups.js';
import {setItemIcon} from './item-icons.js';
import {bindingLabel} from './keybinds.js';
import {regionAt} from './wilds.js';
import {FAMILIARS} from './familiars.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const ICONS={
 well:'<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M5 20h14M7 17h10"/>',
 atlas:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
 radio:'<rect x="3" y="8" width="18" height="12" rx="2"/><circle cx="8" cy="14" r="2.5"/><path d="M14 12h4M14 16h4M7 8l9-5"/>',
 save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 talk:'<path d="M4 5h16v10H9l-5 4z"/>',
 dash:'<path d="M5 12h9M9 7l5 5-5 5M17 6v12"/>',
 tidal:'<path d="M3 15c3 0 3-3 6-3s3 3 6 3 3-3 6-3M3 19c3 0 3-3 6-3s3 3 6 3 3-3 6-3M14 8l4-4M18 4h-3M18 4v3"/>',
 whirlpool:'<path d="M12 12m-2 0a2 2 0 1 0 4 0a4 4 0 1 0-8 0a6 6 0 1 0 12 0a8 8 0 1 0-16 0"/>'
};
// A story objective reads "Chapter 5 · Mara is waiting…"; the part before the first dot becomes the tracker's heading.
export function splitObjective(text,fallback){
 const at=text.indexOf(' · ');
 return at>0&&at<40?{title:text.slice(0,at),body:text.slice(at+3)}:{title:fallback,body:text};
}
export function mountHudShell({act,examine,openAtlas,openQuests,openWell,openRadio,isTouch}){
 const playfield=document.querySelector('.playfield'),$=id=>document.getElementById(id);
 const shell=el('section');shell.id='hud-shell';shell.hidden=true;shell.setAttribute('aria-label','Exploration HUD');
 shell.innerHTML=`<button id="hud-menu" aria-label="Menu" aria-haspopup="dialog"><span class="hud-portrait" aria-hidden="true"></span></button>
<div id="hud-map"><div class="hud-where"></div></div>
<div id="hud-tracker"><button class="hud-quest story" hidden><i aria-hidden="true"></i><b></b><span></span></button><button class="hud-quest side" hidden><i aria-hidden="true"></i><b></b><span></span></button></div>
<div id="hud-feed" aria-live="polite"></div>
<div id="hud-icons"><button id="hud-well" class="hud-icon" hidden aria-label="Open the Wishing Well">${svg(ICONS.well,20)}<span>Well</span></button></div>
<div id="hud-vitals"><div class="hud-level"><b id="hud-name">Eli</b> · <span id="hud-level">Lv. 1</span></div><div id="hud-xp" aria-hidden="true"><i></i></div></div>
<div id="hud-actions">
 <button class="hud-act whirlpool" data-act="whirlpool" aria-label="Whirlpool">${svg(ICONS.whirlpool)}<kbd></kbd><b class="hud-charges"></b><small>Whirlpool</small></button>
 <button class="hud-act tidal" data-act="tidal" aria-label="Tidal Cannon">${svg(ICONS.tidal)}<kbd></kbd><b class="hud-charges"></b><small>Tidal</small></button>
 <button class="hud-act talk desk" data-act="talk" aria-label="Talk or examine">${svg(ICONS.talk)}<kbd></kbd><small>Talk</small></button>
 <button class="hud-act use desk" data-act="use" aria-label="Use selected item"><span class="hud-use-icon"></span><kbd></kbd><small></small></button>
 <button class="hud-act dash" data-act="dash" aria-label="Dash">${svg(ICONS.dash)}<kbd></kbd><small>Dash</small></button>
</div>
<div id="hud-banner" aria-hidden="true"><small></small><b></b><i></i></div>
<button id="hud-found" hidden><span class="hud-found-card"><small class="hud-found-tag">NEW ITEM</small><span class="hud-found-icon"></span><b></b><small class="hud-found-kind"></small><span class="hud-found-text"></span><small class="hud-found-tap">Tap to continue</small></span></button>`;
 playfield.append(shell);
 const sheet=el('dialog');sheet.id='hud-menu-sheet';sheet.setAttribute('aria-label','Menu');
 sheet.innerHTML=`<div class="hud-sheet-who"><span class="hud-portrait large" aria-hidden="true"></span><h2></h2><p class="hud-sheet-where"></p><dl></dl></div><div class="hud-sheet-grid"></div><button class="hud-sheet-close" aria-label="Close menu">×</button>`;
 document.body.append(sheet);
 // Existing pieces move into the new layout; their own modules keep updating them by id.
 const map=$('hud-map'),where=map.querySelector('.hud-where');
 map.prepend($('open-atlas'));where.append($('region-name'),$('discovery-dots'),$('discovery-count'));
 const icons=$('hud-icons');icons.prepend($('purse-hud'));
 for(const id of ['open-quests','open-codex','open-skills','open-backpack'])if($(id)){$(id).classList.add('hud-icon');icons.append($(id));}
 const vitals=$('hud-vitals');vitals.insertBefore($('player-hp'),$('hud-xp'));vitals.append(document.querySelector('.dash-mini'));
 const hotbar=document.querySelector('.hotbar'),pager=el('button','hotbar-pager','1–4');pager.id='hotbar-pager';pager.setAttribute('aria-label','Show hotbar slots 5 to 7');hotbar.append(pager);
 let page=1,selected=0;
 pager.onclick=()=>{page=page===1?2:1;draw();};
 const draw=()=>{hotbar.classList.toggle('page-2',page===2);pager.textContent=page===1?'1–4 ▾':'5–7 ▴';pager.setAttribute('aria-label',page===1?'Show hotbar slots 5 to 7':'Show hotbar slots 1 to 4');};
 draw();
 // The menu launches every screen. Buttons that live elsewhere are clicked, so their own rules still apply.
 const ENTRIES=[['Backpack','open-backpack'],['Skills','open-skills'],['Index','open-codex'],['Quest log','open-quests'],['World Atlas',openAtlas,ICONS.atlas,'map'],['Radio',openRadio,ICONS.radio,'radio'],['Wishing Well',openWell,ICONS.well],['Save','open-saves',ICONS.save],['Settings','open-settings',ICONS.settings],['Full screen','toggle-fullscreen',ICONS.full]];
 const grid=sheet.querySelector('.hud-sheet-grid');
 const entries=ENTRIES.map(([label,target,icon,key])=>{
  const button=el('button','hud-sheet-item');const source=typeof target==='string'?$(target):null;
  button.innerHTML=`${icon?svg(icon,24):source?.querySelector('svg')?.outerHTML||''}<span>${label}</span><kbd></kbd>`;
  button.onclick=()=>{sheet.close();if(source)source.click();else target();};
  grid.append(button);return {button,source,label,key};
 });
 $('hud-menu').onclick=()=>{refreshSheet();sheet.showModal();};
 sheet.querySelector('.hud-sheet-close').onclick=()=>sheet.close();
 sheet.addEventListener('click',e=>{if(e.target===sheet)sheet.close();});
 const tracker=$('hud-tracker');tracker.addEventListener('click',e=>{if(e.target.closest('.hud-quest'))openQuests();});
 $('hud-well').onclick=()=>openWell();
 shell.querySelector('#hud-actions').addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;const a=b.dataset.act;if(a==='talk')examine();else if(a==='use')act(world?.inventory.selected===1?'toggle':'use');else act(a);});
 const found=$('hud-found'),banner=$('hud-banner'),feed=$('hud-feed');
 let world=null,carried=null,region='',queue=[],foundUntil=0,sheetWorld=null,showing=null;
 found.onclick=()=>{found.hidden=true;showing=null;};
 function setText(node,text){if(node.textContent!==text)node.textContent=text;}
 function refreshSheet(){
  if(!sheetWorld)return;const w=sheetWorld,p=w.progression;
  setText(sheet.querySelector('h2'),w.player.name||'Eli');setText(sheet.querySelector('.hud-sheet-where'),`Level ${p.level} · ${$('region-name').textContent}`);
  const rows=[['Health',`${Math.ceil(w.player.health)} / ${p.maxHealth}`],['Marks',String(w.inventory.marks||0)],['Places found',$('discovery-count').textContent.replace(' places found here','')],['Familiar',FAMILIARS[w.familiars?.active]?.name||'None']];
  sheet.querySelector('dl').replaceChildren(...rows.flatMap(([k,v])=>[el('dt',null,k),el('dd',null,v)]));
  for(const e of entries){e.button.hidden=e.source?!!e.source.hidden&&e.source.id!=='open-saves'&&e.source.id!=='open-settings':e.label==='Wishing Well'&&!w.well?.awake;e.button.querySelector('kbd').textContent=e.key?bindingLabel(e.key):({'open-backpack':bindingLabel('backpack'),'open-skills':bindingLabel('skills'),'open-codex':bindingLabel('codex'),'open-quests':bindingLabel('quests')}[e.source?.id]||'');}
 }
 function showBanner(kicker,name){setText(banner.querySelector('small'),kicker);setText(banner.querySelector('b'),name);banner.classList.remove('show');void banner.offsetWidth;banner.classList.add('show');}
 function pushFeed({name,count,rare}){
  const row=el('div','hud-got'+(rare?' rare':''));const icon=el('span','hud-got-icon');setItemIcon(icon,name);row.append(icon,el('b',null,name),el('em',null,`×${count}`));
  feed.append(row);while(feed.children.length>4)feed.firstElementChild.remove();setTimeout(()=>row.remove(),4200);
 }
 function showFound({name,item,category}){
  setItemIcon(found.querySelector('.hud-found-icon'),name);setText(found.querySelector('b'),name);
  setText(found.querySelector('.hud-found-kind'),`${category} · added to your backpack`);setText(found.querySelector('.hud-found-text'),item.description||'');
  found.hidden=false;showing=arguments[0];foundUntil=performance.now()+6000;
 }
 return {
  get open(){return sheet.open;},
  close(){if(sheet.open)sheet.close();},
  // hud is explorationHud(world); blocked is true while a story scene or a sheet covers the screen.
  update(next,hud,{visible,blocked}){
   shell.hidden=!visible;if(!visible){if(sheet.open)sheet.close();return;}
   if(next!==world){world=next;carried=null;region='';queue=[];found.hidden=true;feed.replaceChildren();}
   sheetWorld=world;const p=world.progression,touch=isTouch();
   setText($('hud-level'),`Lv. ${p.level}`);setText($('hud-name'),world.player.name||'Eli');
   const xp=$('hud-xp').firstElementChild,xpWidth=`${Math.min(100,p.xp/p.xpToNextLevel*100)}%`;if(xp.style.width!==xpWidth)xp.style.width=xpWidth;
   // Tracker: the story first in gold, then the active side mission in blue.
   const [story,side]=tracker.children;
   for(const [card,text,fallback] of [[story,hud.quest,'Eli’s Journey'],[side,hud.sideQuest,'Side mission']]){
    card.hidden=!text;if(!text)continue;const {title,body}=splitObjective(text,fallback);setText(card.querySelector('b'),title);setText(card.querySelector('span'),body);
   }
   $('hud-well').hidden=!world.well?.awake;
   // Hotbar paging follows the selected slot on phones.
   const slot=world.inventory.selected;if(slot!==selected){selected=slot;const want=slot>=5?2:1;if(want!==page){page=want;draw();}}
   // Action buttons: the selected item on Use, charges on the specials, key hints on desktop.
   const actions=shell.querySelector('#hud-actions'),item=world.inventory.item,rod=slot===1;
   setItemIcon(actions.querySelector('.hud-use-icon'),rod?'Fishing Rod':item?.name);
   setText(actions.querySelector('.use small'),world.fishing.state==='reeling'?'Reel':world.fishing.state==='waiting'?'Cancel':rod?'Cast rod':item?.name||'Empty');
   const touchSymbol=document.querySelector('#touch-use .touch-symbol');if(touchSymbol)setItemIcon(touchSymbol,rod?'Fishing Rod':item?.name);
   for(const kind of ['tidal','whirlpool']){const b=actions.querySelector('.'+kind),n=p.specials[kind];setText(b.querySelector('.hud-charges'),String(n));b.disabled=n===0||world.fishing.state!=='idle';}
   const keys={whirlpool:'whirlpool',tidal:'tidal',talk:'inspect',use:rod?'fish':'use',dash:'dash'};
   for(const b of actions.querySelectorAll('[data-act]'))setText(b.querySelector('kbd'),touch?'':bindingLabel(keys[b.dataset.act]).replace(/^(Left|Right) /,''));
   // Pickups and first finds.
   const seen=notePickups(world,carried);carried=seen.carried;
   for(const g of seen.gained)pushFeed(g);queue.push(...seen.firsts);
   if(!blocked&&queue.length&&found.hidden)showFound(queue.shift());
   // A card covered by a scene comes back once the scene ends.
   if(!found.hidden&&blocked){found.hidden=true;queue.unshift(showing);showing=null;}
   else if(!found.hidden&&performance.now()>foundUntil){found.hidden=true;showing=null;}
   // Region banner when Eli walks into a new part of the map.
   const name=regionAt(world.player.x,world.player.y,world.areaId);
   if(name!==region){if(region&&!blocked)showBanner('ENTERING',name);region=name;}
  }
 };
}
