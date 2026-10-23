import {ITEM_CATEGORIES,backpackItems,canUseItem} from './inventory.js';
export function mountBackpack({getWorld,onOpen,onClose,onAction,icons}){
 const button=document.createElement('button');button.id='open-backpack';button.hidden=true;
 button.setAttribute('aria-label','Open backpack');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 32 32" width="25" height="25" aria-hidden="true"><path d="M11 9V6c0-5 10-5 10 0v3M7 10h18l2 18H5zM9 18h14v7H9zM9 10v5m14-5v5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg><span>Backpack</span>';
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='backpack';dialog.setAttribute('aria-labelledby','backpack-title');
 dialog.innerHTML='<div class="backpack-heading"><div><small>YOUR BELONGINGS</small><h2 id="backpack-title">Backpack</h2></div><button class="backpack-close" aria-label="Close backpack">Close</button></div><p class="backpack-capacity"></p><div class="backpack-filters" role="group" aria-label="Inventory categories"></div><section class="backpack-actions" hidden aria-label="Selected item actions"></section><div class="backpack-items"></div><p class="backpack-note">Select an item for actions. Catches stay in your backpack.</p>';
 document.body.append(dialog);
 let category='all',lastKey='',selectedId=null,choosingSlot=false;
 const filters=dialog.querySelector('.backpack-filters'),items=dialog.querySelector('.backpack-items');
 for(const choice of [{id:'all',label:'All items'},...ITEM_CATEGORIES]){
  const filter=document.createElement('button');filter.textContent=choice.label;filter.dataset.category=choice.id;filter.setAttribute('aria-pressed',choice.id==='all');
  filter.onclick=()=>{category=choice.id;lastKey='';refresh();};filters.append(filter);
 }
 function refresh(){
  const inventory=getWorld().inventory,key=JSON.stringify([inventory.allItems,inventory.slots,inventory.selected,category,selectedId,choosingSlot]);if(key===lastKey)return;lastKey=key;
  const entries=backpackItems(inventory,category);
  dialog.querySelector('.backpack-capacity').textContent=`${inventory.allItems.length} items stored | ${inventory.slots.filter(Boolean).length} / 6 hotbar slots assigned`;
  for(const filter of filters.children)filter.setAttribute('aria-pressed',filter.dataset.category===category);
  items.replaceChildren();
  const actions=dialog.querySelector('.backpack-actions'),selected=inventory.allItems.find(item=>item.id===selectedId);actions.replaceChildren();actions.hidden=!selected;
  if(selected){
   const heading=document.createElement('h3');heading.textContent=selected.name;actions.append(heading);
   const description=document.createElement('p');description.textContent=selected.description||'Choose what to do with this item.';actions.append(description);
   const actionRow=document.createElement('div');actionRow.className='backpack-action-row';actions.append(actionRow);
   const addAction=(label,action)=>{const control=document.createElement('button');control.textContent=label;control.onclick=action;actionRow.append(control);return control;};
   const execute=action=>{if(onAction(selected.id,action)){selectedId=null;choosingSlot=false;lastKey='';if(action==='use'||action==='drop')dialog.close();else refresh();}else{dialog.querySelector('.backpack-note').textContent=getWorld().fishing.state!=='idle'?'Finish or abandon fishing before managing items.':getWorld().message||'Action unavailable. Let your attack recover.';}};
   const usable=canUseItem(selected);
   const use=addAction('Use',()=>execute('use'));use.disabled=!usable;use.title=usable?'Use one charge':'This item has no direct use yet';
   addAction('Throw into world',()=>execute('drop'));addAction('Discard',()=>execute('discard'));
   addAction('Add to hotbar',()=>{choosingSlot=!choosingSlot;lastKey='';refresh();});
   if(choosingSlot){
    const title=document.createElement('p');title.textContent='Choose a hotbar slot. Replaced items stay in the backpack.';actions.append(title);
    const slots=document.createElement('div');slots.className='backpack-slot-choices';actions.append(slots);
    for(let slot=2;slot<=7;slot++){
     const control=document.createElement('button');control.textContent=`${slot}: ${inventory.slots[slot-2]?.name||'Empty'}`;
     control.onclick=()=>{if(onAction(selected.id,'hotbar',slot)){choosingSlot=false;lastKey='';refresh();}else dialog.querySelector('.backpack-note').textContent='Finish or abandon fishing first.';};slots.append(control);
    }
   }
  }
  if(!entries.length){const empty=document.createElement('p');empty.className='backpack-empty';empty.textContent=category==='all'?'Your backpack is empty. Fish to find items.':'No items in this category yet.';items.append(empty);return;}
  for(const {item} of entries){
   const card=document.createElement('button');card.className='backpack-item';card.setAttribute('aria-label',`Select ${item.name}`);card.setAttribute('aria-pressed',selectedId===item.id);
   const icon=document.createElement('span');icon.className='backpack-item-icon';icon.textContent=icons[item.name]||'◆';
   const title=document.createElement('strong');title.textContent=item.name;
   const details=document.createElement('small');details.textContent=`${item.uses} ${item.uses===1?'use':'uses'}`;
   const description=document.createElement('span');description.className='backpack-description';description.textContent=item.description||'';
   const action=document.createElement('span');action.className='backpack-equip';const hotbarSlot=inventory.slots.findIndex(entry=>entry?.id===item.id);action.textContent=hotbarSlot>=0?`Hotbar ${hotbarSlot+2}`:'In backpack';
   card.append(icon,title,details,description,action);card.onclick=()=>{selectedId=item.id;choosingSlot=false;lastKey='';refresh();dialog.querySelector('.backpack-actions').scrollIntoView({block:'nearest',behavior:'smooth'});};items.append(card);
  }
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();selectedId=null;choosingSlot=false;lastKey='';dialog.querySelector('.backpack-note').textContent='Select an item for actions. Catches stay in your backpack.';refresh();dialog.showModal();button.setAttribute('aria-expanded','true');}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
