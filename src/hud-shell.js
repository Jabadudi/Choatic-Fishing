// The exploring HUD laid out like an action RPG: portrait menu and minimap top-left, quest tracker under them, menu icons top-right,
// the hotbar down the right edge, health bottom-centre and action buttons bottom-right. It moves the existing HUD pieces into place
// and adds the pickup feed, first-find card and area banner. It only reads world state; actions go through the callbacks.
import {notePickups} from './pickups.js';
import {setItemIcon} from './item-icons.js';
import {bindingLabel} from './keybinds.js';
import {regionAt} from './wilds.js';
import {FAMILIARS} from './familiars.js';
import {wishstonesLabel} from './wishing-well.js';
import {coreWheel,RESERVES_MAX,abilityUnlocked,reservesMax} from './core-abilities.js';
import {dashMeter} from './hud.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const ICONS={
 well:'<path d="M12 3l1.8 4.2L18 9l-4.2 1.8L12 15l-1.8-4.2L6 9l4.2-1.8z"/><path d="M5 20h14M7 17h10"/>',
 atlas:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2z"/><path d="M9 4v14M15 6v14"/>',
 radio:'<rect x="3" y="8" width="18" height="12" rx="2"/><circle cx="8" cy="14" r="2.5"/><path d="M14 12h4M14 16h4M7 8l9-5"/>',
 save:'<path d="M5 4h11l3 3v13H5z"/><path d="M8 4v5h7V4M8 20v-6h8v6"/>',
 settings:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>',
 help:'<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 17v.5"/>',
 full:'<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>',
 talk:'<path d="M4 5h16v10H9l-5 4z"/>',
 dash:'<path d="M5 12h9M9 7l5 5-5 5M17 6v12"/>',
 'still-water':'<path d="M12 3c2.5 3.2 4 5.4 4 7.2a4 4 0 0 1-8 0C8 8.4 9.5 6.2 12 3z"/><path d="M3 17c2.5 0 3-1.5 4.5-1.5S10 17 12 17s3-1.5 4.5-1.5S19 17 21 17M6 20.5h12"/>',
 'reeds-call':'<path d="M4 20c4-1 6-5 7-9s3-7 8-7"/><path d="M19 4v4.5a2.5 2.5 0 0 1-5 0"/><path d="M6 13v7M8.5 10v10"/>',
 empty:'<circle cx="12" cy="12" r="7" stroke-dasharray="2.5 2.5"/><path d="M12 9v6M9 12h6"/>',
 sealed:'<rect x="6" y="11" width="12" height="9" rx="1.5"/><path d="M8.5 11V8a3.5 3.5 0 0 1 7 0v3M12 14.5v2"/>'
};
// A story objective reads "Chapter 5 · Mara is waiting…"; the part before the first dot becomes the tracker's heading.
export function splitObjective(text,fallback){
 const at=text.indexOf(' · ');
 return at>0&&at<40?{title:text.slice(0,at),body:text.slice(at+3)}:{title:fallback,body:text};
}
export function mountHudShell({act,openHelp,examine,openAtlas,openQuests,openWell,openRadio,isTouch}){
 const playfield=document.querySelector('.playfield'),$=id=>document.getElementById(id);
 const shell=el('section');shell.id='hud-shell';shell.hidden=true;shell.setAttribute('aria-label','Exploration HUD');
 shell.innerHTML=`<button id="hud-menu" aria-label="Menu" aria-haspopup="dialog"><span class="hud-portrait" aria-hidden="true"></span></button>
<div id="hud-map"><div class="hud-where"></div></div>
<div id="hud-tracker"><button class="hud-quest story" hidden><i aria-hidden="true"></i><b></b><span></span></button><button class="hud-quest side" hidden><i aria-hidden="true"></i><b></b><span></span></button></div>
<div id="hud-feed" aria-live="polite"></div>
<div id="hud-icons"><button id="hud-well" class="hud-icon" hidden aria-label="Open the Wishing Well">${svg(ICONS.well,20)}<span>Well</span></button></div>
<div id="hud-vitals"><div class="hud-level"><b id="hud-name">Eli</b> · <span id="hud-level">Lv. 1</span></div><div id="hud-xp" aria-hidden="true"><i></i></div></div>
<div id="hud-actions">
 <div class="hud-reserves" hidden aria-label="Reserves"><i></i></div>
 <button class="hud-act side talk desk" data-act="talk" aria-label="Talk or examine">${svg(ICONS.talk)}<kbd></kbd><small>Talk</small></button>
 <button class="hud-act ring core" style="--a:180deg" data-act="core-slot-0" data-core-slot="0" data-core="still-water" aria-label="Still Water"><span class="hud-core-icon">${svg(ICONS['still-water'])}</span><i class="hud-cd"></i><kbd></kbd><small>Still Water</small></button>
 <button class="hud-act ring core" style="--a:135deg" data-act="core-slot-1" data-core-slot="1" data-core="reeds-call" aria-label="Reedwater’s Call"><span class="hud-core-icon">${svg(ICONS['reeds-call'])}</span><i class="hud-cd"></i><kbd></kbd><small>Call</small></button>
 <button class="hud-act ring core" style="--a:90deg" data-act="core-slot-2" data-core-slot="2" data-core="" aria-label="Sealed power"><span class="hud-core-icon">${svg(ICONS.sealed)}</span><i class="hud-cd"></i><kbd></kbd><small>???</small></button>
 <button class="hud-act ring core" style="--a:45deg" data-act="core-slot-3" data-core-slot="3" data-core="" aria-label="Sealed power"><span class="hud-core-icon">${svg(ICONS.sealed)}</span><i class="hud-cd"></i><kbd></kbd><small>???</small></button>
 <button class="hud-act ring dash" style="--a:0deg" data-act="dash" aria-label="Dash">${svg(ICONS.dash)}<i class="hud-cd"></i><b class="hud-charges" hidden></b><kbd></kbd><small>Dash</small></button>
 <button class="hud-act use desk" data-act="use" aria-label="Attack with the selected item"><span class="hud-use-icon"></span><kbd></kbd><small></small></button>
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
 const icons=$('hud-icons'),wallet=el('div');wallet.id='hud-wallet';
 const stones=el('p');stones.id='hud-stones';stones.title='Wishstones';stones.innerHTML='<span class="wishstone-icon" style="width:14px;height:11px" aria-hidden="true"></span><span></span>';
 wallet.append($('purse-hud'),stones);icons.prepend(wallet);
 for(const id of ['open-chat','open-players','open-quests','open-codex','open-skills','open-backpack'])if($(id)){$(id).classList.add('hud-icon');icons.append($(id));}
 const vitals=$('hud-vitals');vitals.insertBefore($('player-hp'),$('hud-xp'));vitals.append(document.querySelector('.dash-mini'));
 const hotbar=document.querySelector('.hotbar'),pager=el('button','hotbar-pager','1–4');pager.id='hotbar-pager';pager.setAttribute('aria-label','Show hotbar slots 5 to 7');hotbar.append(pager);
 let page=1,selected=0;
 pager.onclick=()=>{page=page===1?2:1;draw();};
 const draw=()=>{hotbar.classList.toggle('page-2',page===2);pager.textContent=page===1?'1–4 ▾':'5–7 ▴';pager.setAttribute('aria-label',page===1?'Show hotbar slots 5 to 7':'Show hotbar slots 1 to 4');};
 draw();
 // The menu launches every screen. Buttons that live elsewhere are clicked, so their own rules still apply.
 const ENTRIES=[['Backpack','open-backpack'],['Skills','open-skills'],['Index','open-codex'],['Quest log','open-quests'],['Friends','open-players'],['Chat','open-chat'],['World Atlas',openAtlas,ICONS.atlas,'map'],['Radio',openRadio,ICONS.radio,'radio'],['Wishing Well',openWell,ICONS.well],['Save','open-saves',ICONS.save],['Controls',openHelp,ICONS.help,'help'],['Settings','open-settings',ICONS.settings],['Full screen','toggle-fullscreen',ICONS.full]];
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
 // The story card opens the journal drawer beside the game; the side-mission card opens the log at that tab.
 const tracker=$('hud-tracker');tracker.addEventListener('click',e=>{const card=e.target.closest('.hud-quest');if(card)openQuests(card.classList.contains('side')?'side':'drawer');});
 $('hud-well').onclick=()=>openWell();
 const actions=shell.querySelector('#hud-actions'),run=b=>{const a=b.dataset.act;if(a==='talk')examine();else if(a==='use')act(world?.inventory.selected===1?'toggle':'use');else act(a);};
 // Fingers fire on touch-down: phones send no click for a tap while another finger holds the joystick.
 let touched=null;
 actions.addEventListener('pointerdown',e=>{const b=e.target.closest('[data-act]');touched=null;if(!b||b.disabled||e.pointerType==='mouse')return;touched=b;run(b);});
 actions.addEventListener('click',e=>{const b=e.target.closest('[data-act]');if(!b)return;if(b===touched&&e.detail){touched=null;return;}touched=null;run(b);});
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
   for(const [card,text,fallback] of [[story,hud.storyTrack||hud.quest,'Eli’s Journey'],[side,hud.sideQuest,'Side mission']]){
    card.hidden=!text;if(!text)continue;const {title,body}=splitObjective(text,fallback);setText(card.querySelector('b'),title);setText(card.querySelector('span'),body);
   }
   $('hud-well').hidden=!world.well?.awake;
   const stoneCount=String(world.well?.stones||0);setText(stones.lastChild,stoneCount);stones.setAttribute('aria-label',wishstonesLabel(world.well?.stones||0));
   // Hotbar paging follows the selected slot on phones.
   const slot=world.inventory.selected;if(slot!==selected){selected=slot;const want=slot>=5?2:1;if(want!==page){page=want;draw();}}
   // Action buttons: the selected item on Use, charges on the specials, key hints on desktop.
   const actions=shell.querySelector('#hud-actions'),item=world.inventory.item,rod=slot===1;
   setItemIcon(actions.querySelector('.hud-use-icon'),rod?'Fishing Rod':item?.name);
   setText(actions.querySelector('.use small'),world.fishing.state==='reeling'?'Reel':world.fishing.state==='waiting'?'Cancel':rod?'Cast rod':item?.name||'Empty');
   const touchSymbol=document.querySelector('#touch-use .touch-symbol');if(touchSymbol)setItemIcon(touchSymbol,rod?'Fishing Rod':item?.name);
   // The Region Core's powers ring the attack: sealed until the story wakes them, then a cooldown sweep and a reserves bar.
   for(const row of coreWheel(world)){
    const b=actions.querySelector(`[data-core-slot="${row.slot}"]`);if(!b)continue;
    // Each slot shows whatever Core skill is equipped there; the icon only changes when the skill does.
    const shown=row.sealed?'sealed':row.empty?'empty':row.id;
    if(b.dataset.shown!==shown){b.dataset.shown=shown;b.dataset.core=row.id||'';b.querySelector('.hud-core-icon').innerHTML=svg(ICONS[row.sealed?'sealed':row.empty?'empty':row.id]||ICONS.sealed);}
    b.classList.toggle('locked',!row.unlocked);b.classList.toggle('empty',row.empty);b.classList.toggle('active',row.active);b.classList.toggle('waiting',row.unlocked&&!row.ready);
    const name=row.sealed?'???':row.empty?'Empty':row.unlocked?row.name:'???';setText(b.querySelector('small'),row.id==='reeds-call'&&row.unlocked?'Call':name);
    b.setAttribute('aria-label',row.sealed?'Sealed power':row.empty?'Empty Core slot':row.unlocked?row.name:'Sealed power');b.title=row.sealed?'Not yet awakened':row.empty?'Empty slot · equip a Core skill from Skills':row.unlocked?row.name:'Not yet awakened';
    const cd=b.querySelector('.hud-cd'),sweep=`${Math.round(row.cooldownFraction*360)}deg`;if(cd.style.getPropertyValue('--cd')!==sweep)cd.style.setProperty('--cd',sweep);
   }
   // Dash: a sweep drains clockwise as the spent charge comes back, the button dims while no charge is left, and it flashes once when ready.
   const dash=actions.querySelector('.dash'),dm=dashMeter(world),dashSweep=`${Math.round(dm.remaining*360)}deg`,dashCd=dash.querySelector('.hud-cd');
   if(dashCd.style.getPropertyValue('--cd')!==dashSweep)dashCd.style.setProperty('--cd',dashSweep);
   if(dash.classList.contains('waiting')&&dm.ready){dash.classList.remove('flash');void dash.offsetWidth;dash.classList.add('flash');}
   dash.classList.toggle('waiting',!dm.ready);
   const charges=dash.querySelector('.hud-charges');charges.hidden=dm.max<2;if(!charges.hidden)setText(charges,String(dm.charges));
   const dashLabel=dm.ready?(dm.remaining>0?`Dash, ${dm.charges} of ${dm.max} ready`:'Dash'):`Dash recharging, ${dm.seconds.toFixed(1)} seconds`;if(dash.getAttribute('aria-label')!==dashLabel)dash.setAttribute('aria-label',dashLabel);
   const reserves=actions.querySelector('.hud-reserves');reserves.hidden=!abilityUnlocked(world,'reeds-call');
   if(!reserves.hidden){const w=`${Math.round((world.core?.reserves??RESERVES_MAX)/reservesMax(world)*100)}%`;if(reserves.firstElementChild.style.width!==w)reserves.firstElementChild.style.width=w;}
   const keys={'core-slot-0':'tidal','core-slot-1':'whirlpool',talk:'inspect',use:rod?'fish':'use',dash:'dash'};
   for(const b of actions.querySelectorAll('[data-act]')){const k=b.querySelector('kbd');if(k)setText(k,touch?'':b.dataset.act==='use'?'Click':!keys[b.dataset.act]?'':bindingLabel(keys[b.dataset.act]).replace(/^(Left|Right) /,''));}
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
