import {ITEM_CATEGORIES,backpackItems,canUseItem,PERMANENT_ITEMS} from './inventory.js';
import {setItemIcon} from './item-icons.js';
import {markIcon} from './trade-ui.js';
import {marksLabel} from './trade.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const CATEGORY_ICONS={
 all:'<path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" fill="currentColor" stroke="none"/>',
 consumables:'<path d="M9 3h6M10 3v5l-4.5 7.5A3.5 3.5 0 0 0 8.5 21h7a3.5 3.5 0 0 0 3-5.5L14 8V3M7.5 14h9"/>',
 weapons:'<path d="M20 4l-9.5 9.5M20 4h-3.5L8 12.5M20 4v3.5L11.5 16M6.5 13.5l4 4M5 19l3-3M4 20l1.5-1.5"/>',
 armor:'<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6zM12 7v10M9.5 10.5L12 9l2.5 1.5M10 14h4"/>',
 'quest-items':'<path d="M7 4h11v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h3zM7 4a2 2 0 0 0-2 2v1h2M10 8h5M10 11h5M10 14h5"/>',
 trophies:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7M9.5 17h5v3h-5z"/>',
 'upgrade-materials':'<path d="M12 2l5 8-5 12-5-12zM7 10h10M12 2v20"/>'
};
const SCENERY='<svg class="backpack-scenery" viewBox="0 0 160 90" aria-hidden="true"><path d="M0 90L34 52l14 12 26-34 22 26 14-10 50 44z" fill="currentColor" opacity=".35"/><path d="M118 90V58l6-12 6 12v-6l5-10 5 10v48z" fill="currentColor" opacity=".55"/><path d="M14 90c4-10 6-18 5-26 3 8 3 16 1 26M24 90c2-9 7-15 13-18-4 5-7 11-8 18" stroke="currentColor" stroke-width="2" fill="none" opacity=".6"/><path d="M92 18l1.5 4 4 1.5-4 1.5-1.5 4-1.5-4-4-1.5 4-1.5z" fill="#e8c67d" opacity=".75"/></svg>';
export function mountBackpack({getWorld,onOpen,onClose,onAction}){
 const button=document.createElement('button');button.id='open-backpack';button.hidden=true;
 button.setAttribute('aria-label','Open backpack');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 32 32" width="25" height="25" aria-hidden="true"><path d="M11 9V6c0-5 10-5 10 0v3M7 10h18l2 18H5zM9 18h14v7H9zM9 10v5m14-5v5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg><span>Backpack</span>';
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='backpack';dialog.setAttribute('aria-labelledby','backpack-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg('<path d="M9 7V5.5a3 3 0 0 1 6 0V7M6 8.5A2.5 2.5 0 0 1 8.5 6h7A2.5 2.5 0 0 1 18 8.5V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM8.5 13h7v4h-7zM11 15h2"/>',40)}</span><h2 id="backpack-title">Backpack</h2><span class="backpack-sprig">${svg('<path d="M5 20C9 15 13 11 19 4M9 15c-2-1-3-3-2.5-5 2 .5 3 2.5 2.5 5zM12 12c-1.5-1.5-2-3.5-1-5.5 1.5 1 2 3.5 1 5.5zM12 12c2 .5 4 0 5-1.5-2-.8-4 0-5 1.5zM9 15c2 .5 4 0 5-1.5-2-.8-4 0-5 1.5z"/>',22)}</span><p class="backpack-capacity"></p><p class="backpack-marks" title="Reed marks">${markIcon(22)}<span></span></p><button class="backpack-close" aria-label="Close backpack">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div><div class="backpack-body"><nav class="backpack-filters" role="group" aria-label="Inventory categories"></nav><div class="backpack-items" role="group" aria-label="Items"></div><section class="backpack-details" aria-live="polite"><div class="backpack-art"><span class="backpack-art-icon"></span>${SCENERY}</div><div class="backpack-actions" aria-label="Selected item actions"></div><p class="backpack-note"></p></section></div></div>`;
 document.body.append(dialog);
 let category='all',lastKey='',selectedId=null,choosingSlot=false;
 const filters=dialog.querySelector('.backpack-filters'),items=dialog.querySelector('.backpack-items'),actions=dialog.querySelector('.backpack-actions'),note=dialog.querySelector('.backpack-note'),artIcon=dialog.querySelector('.backpack-art-icon');
 const setNote=text=>{note.textContent=text;note.prepend(document.createRange().createContextualFragment(svg('<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 3v6"/>',20)));};
 for(const choice of [{id:'all',label:'All items'},...ITEM_CATEGORIES]){
  const filter=document.createElement('button');filter.innerHTML=`${svg(CATEGORY_ICONS[choice.id])}<span></span>`;filter.querySelector('span').textContent=choice.label;filter.dataset.category=choice.id;filter.setAttribute('aria-pressed',choice.id==='all');
  filter.onclick=()=>{category=choice.id;lastKey='';refresh();};filters.append(filter);
 }
 function refresh(){
  const inventory=getWorld().inventory,entries=backpackItems(inventory,category);
  // Keep a selection visible like the reference design: fall back to the first item in the current category.
  if(!entries.some(({item})=>item.id===selectedId)){selectedId=entries[0]?.item.id??null;choosingSlot=false;}
  const key=JSON.stringify([inventory.marks,inventory.allItems,inventory.slots,inventory.selected,category,selectedId,choosingSlot]);if(key===lastKey)return;lastKey=key;
  dialog.querySelector('.backpack-capacity').textContent=`${inventory.allItems.length} ${inventory.allItems.length===1?'item':'items'} stored | ${inventory.slots.filter(Boolean).length} / 6 hotbar slots assigned`;
  dialog.querySelector('.backpack-marks span').textContent=marksLabel(inventory.marks||0);
  for(const filter of filters.children)filter.setAttribute('aria-pressed',filter.dataset.category===category);
  items.replaceChildren();actions.replaceChildren();
  const selected=inventory.allItems.find(item=>item.id===selectedId);
  dialog.querySelector('.backpack-details').classList.toggle('empty',!selected);setItemIcon(artIcon,selected?.name);
  if(selected){
   const heading=document.createElement('h3');heading.textContent=selected.name;
   const uses=document.createElement('small');uses.className='backpack-uses';uses.textContent=PERMANENT_ITEMS.has(selected.name)?'Unlimited uses':`${selected.uses} ${selected.uses===1?'use':'uses'}`;
   const divider=document.createElement('span');divider.className='backpack-divider';divider.setAttribute('aria-hidden','true');
   const description=document.createElement('p');description.textContent=selected.description||'Choose what to do with this item.';
   const place=document.createElement('strong');place.className='backpack-equip';const hotbarSlot=inventory.slots.findIndex(entry=>entry?.id===selected.id);place.textContent=hotbarSlot>=0?`Hotbar ${hotbarSlot+2}`:'In backpack';
   const actionRow=document.createElement('div');actionRow.className='backpack-action-row';
   actions.append(heading,uses,divider,description,place,actionRow);
   const addAction=(label,action)=>{const control=document.createElement('button');control.textContent=label;control.onclick=action;actionRow.append(control);return control;};
   const execute=action=>{if(onAction(selected.id,action)){selectedId=null;choosingSlot=false;lastKey='';if(action==='use'||action==='drop')dialog.close();else refresh();}else{setNote(getWorld().fishing.state!=='idle'?'Finish or abandon fishing before managing items.':getWorld().message||'Action unavailable. Let your attack recover.');}};
   const usable=canUseItem(selected);
   const use=addAction('Use',()=>execute('use'));use.disabled=!usable;use.title=usable?'Use one charge':'This item has no direct use yet';
   addAction('Throw into world',()=>execute('drop'));addAction('Discard',()=>execute('discard')).className='danger';
   const hotbar=addAction('Add to hotbar',()=>{choosingSlot=!choosingSlot;lastKey='';refresh();});hotbar.setAttribute('aria-expanded',choosingSlot);
   if(choosingSlot){
    const title=document.createElement('p');title.textContent='Choose a hotbar slot. Replaced items stay in the backpack.';actions.append(title);
    const slots=document.createElement('div');slots.className='backpack-slot-choices';actions.append(slots);
    for(let slot=2;slot<=7;slot++){
     const control=document.createElement('button');control.textContent=`${slot}: ${inventory.slots[slot-2]?.name||'Empty'}`;
     control.onclick=()=>{if(onAction(selected.id,'hotbar',slot)){choosingSlot=false;lastKey='';refresh();}else setNote('Finish or abandon fishing first.');};slots.append(control);
    }
   }
  }else{
   const empty=document.createElement('p');empty.className='backpack-empty';empty.textContent=category==='all'?'Your backpack is empty. Fish to find items.':'No items in this category yet.';actions.append(empty);
  }
  // A 5 x 5 grid at minimum, growing a row at a time when the backpack holds more.
  const cells=Math.max(25,Math.ceil(entries.length/5)*5);
  for(let index=0;index<cells;index++){
   const item=entries[index]?.item;
   if(!item){const slot=document.createElement('span');slot.className='backpack-cell';slot.setAttribute('aria-hidden','true');items.append(slot);continue;}
   const card=document.createElement('button');card.className='backpack-cell backpack-item';card.setAttribute('aria-label',`Select ${item.name}, ${item.uses} ${item.uses===1?'use':'uses'}`);card.setAttribute('aria-pressed',selectedId===item.id);card.title=item.name;
   const icon=document.createElement('span');icon.className='backpack-item-icon';setItemIcon(icon,item.name);
   const count=document.createElement('small');count.className='backpack-count';count.textContent=PERMANENT_ITEMS.has(item.name)?'∞':item.uses;
   const hotbarSlot=inventory.slots.findIndex(entry=>entry?.id===item.id);
   card.append(icon,count);if(hotbarSlot>=0){const badge=document.createElement('small');badge.className='backpack-hotbar-badge';badge.textContent=hotbarSlot+2;badge.title=`Hotbar ${hotbarSlot+2}`;card.append(badge);}
   card.onclick=()=>{selectedId=item.id;choosingSlot=false;lastKey='';refresh();if(matchMedia('(max-width: 860px)').matches)actions.scrollIntoView({block:'nearest',behavior:'smooth'});};items.append(card);
  }
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();selectedId=null;choosingSlot=false;lastKey='';setNote('Select an item for actions. Catches stay in your backpack.');refresh();dialog.showModal();button.setAttribute('aria-expanded','true');}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
