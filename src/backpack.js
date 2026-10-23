import {ITEM_CATEGORIES,backpackItems} from './inventory.js';
export function mountBackpack({getWorld,onOpen,onClose,onEquip,icons}){
 const button=document.createElement('button');button.id='open-backpack';button.hidden=true;
 button.setAttribute('aria-label','Open backpack');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 32 32" width="25" height="25" aria-hidden="true"><path d="M11 9V6c0-5 10-5 10 0v3M7 10h18l2 18H5zM9 18h14v7H9zM9 10v5m14-5v5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg><span>Backpack</span>';
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='backpack';dialog.setAttribute('aria-labelledby','backpack-title');
 dialog.innerHTML='<div class="backpack-heading"><div><small>YOUR BELONGINGS</small><h2 id="backpack-title">Backpack</h2></div><button class="backpack-close" aria-label="Close backpack">Close</button></div><p class="backpack-capacity"></p><div class="backpack-filters" role="group" aria-label="Inventory categories"></div><div class="backpack-items"></div><p class="backpack-note">Choose an item to equip it on your hotbar.</p>';
 document.body.append(dialog);
 let category='all',lastKey='';
 const filters=dialog.querySelector('.backpack-filters'),items=dialog.querySelector('.backpack-items');
 for(const choice of [{id:'all',label:'All items'},...ITEM_CATEGORIES]){
  const filter=document.createElement('button');filter.textContent=choice.label;filter.dataset.category=choice.id;filter.setAttribute('aria-pressed',choice.id==='all');
  filter.onclick=()=>{category=choice.id;lastKey='';refresh();};filters.append(filter);
 }
 function refresh(){
  const inventory=getWorld().inventory,key=JSON.stringify([inventory.slots,inventory.selected,category]);if(key===lastKey)return;lastKey=key;
  const entries=backpackItems(inventory,category);
  dialog.querySelector('.backpack-capacity').textContent=`${inventory.slots.filter(Boolean).length} / ${inventory.capacity} spaces used`;
  for(const filter of filters.children)filter.setAttribute('aria-pressed',filter.dataset.category===category);
  items.replaceChildren();
  if(!entries.length){const empty=document.createElement('p');empty.className='backpack-empty';empty.textContent=category==='all'?'Your backpack is empty. Fish to find items.':'No items in this category yet.';items.append(empty);return;}
  for(const {item,slot} of entries){
   const card=document.createElement('button');card.className='backpack-item';card.setAttribute('aria-label',`Equip ${item.name}, slot ${slot}`);card.setAttribute('aria-pressed',inventory.selected===slot);
   const icon=document.createElement('span');icon.className='backpack-item-icon';icon.textContent=icons[item.name]||'◆';
   const title=document.createElement('strong');title.textContent=item.name;
   const details=document.createElement('small');details.textContent=`Slot ${slot} · ${item.uses} ${item.uses===1?'use':'uses'}`;
   const description=document.createElement('span');description.className='backpack-description';description.textContent=item.description||'';
   const action=document.createElement('span');action.className='backpack-equip';action.textContent=inventory.selected===slot?'Equipped':'Equip';
   card.append(icon,title,details,description,action);card.onclick=()=>{onEquip(slot);dialog.close();};items.append(card);
  }
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();lastKey='';refresh();dialog.showModal();button.setAttribute('aria-expanded','true');}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
