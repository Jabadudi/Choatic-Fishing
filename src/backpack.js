import {ITEM_CATEGORIES,BACKPACK_SORTS,backpackItems,sortBackpackItems,itemCategory,PERMANENT_ITEMS,stackable,itemCount,amountLabel} from './inventory.js';
import {setItemIcon} from './item-icons.js';
import {markIcon} from './trade-ui.js';
import {marksLabel} from './trade.js';
import {ARTIFACT_SLOT_COUNT,COMBINE_COUNT,RARITIES,RARITY_NAMES,artifactEffect,artifactKey,artifactSlots,copiesOf,inArtifactSlot,isArtifact,nextRarity,slottedArtifacts} from './artifacts.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const CATEGORY_ICONS={
 all:'<path d="M4 4h4v4H4zM10 4h4v4h-4zM16 4h4v4h-4zM4 10h4v4H4zM10 10h4v4h-4zM16 10h4v4h-4zM4 16h4v4H4zM10 16h4v4h-4zM16 16h4v4h-4z" fill="currentColor" stroke="none"/>',
 consumables:'<path d="M9 3h6M10 3v5l-4.5 7.5A3.5 3.5 0 0 0 8.5 21h7a3.5 3.5 0 0 0 3-5.5L14 8V3M7.5 14h9"/>',
 weapons:'<path d="M20 4l-9.5 9.5M20 4h-3.5L8 12.5M20 4v3.5L11.5 16M6.5 13.5l4 4M5 19l3-3M4 20l1.5-1.5"/>',
 artifacts:'<path d="M12 3l3.5 4.5L12 21 8.5 7.5zM8.5 7.5h7M5 7.5L12 21l7-13.5L15.5 3h-7z"/>',
 armor:'<path d="M12 3l7 3v5c0 5-3 8.5-7 10-4-1.5-7-5-7-10V6zM12 7v10M9.5 10.5L12 9l2.5 1.5M10 14h4"/>',
 'quest-items':'<path d="M7 4h11v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2v-1h3zM7 4a2 2 0 0 0-2 2v1h2M10 8h5M10 11h5M10 14h5"/>',
 trophies:'<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3M12 13v4M8.5 20h7M9.5 17h5v3h-5z"/>',
 'upgrade-materials':'<path d="M12 2l5 8-5 12-5-12zM7 10h10M12 2v20"/>'
};
const SORT_ICON='<path d="M7 4v16M7 20l-3-3M7 20l3-3M17 20V4M17 4l-3 3M17 4l3 3"/>';
export function mountBackpack({getWorld,onOpen,onClose,onAction}){
 const button=document.createElement('button');button.id='open-backpack';button.hidden=true;
 button.setAttribute('aria-label','Open backpack');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML='<svg viewBox="0 0 32 32" width="25" height="25" aria-hidden="true"><path d="M11 9V6c0-5 10-5 10 0v3M7 10h18l2 18H5zM9 18h14v7H9zM9 10v5m14-5v5" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linejoin="round"/></svg><span>Backpack</span>';
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='backpack';dialog.setAttribute('aria-labelledby','backpack-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg('<path d="M9 7V5.5a3 3 0 0 1 6 0V7M6 8.5A2.5 2.5 0 0 1 8.5 6h7A2.5 2.5 0 0 1 18 8.5V19a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2zM8.5 13h7v4h-7zM11 15h2"/>',30)}</span><h2 id="backpack-title">Backpack</h2><span class="backpack-crumb"></span><p class="backpack-capacity"></p><p class="backpack-marks" title="Reed marks">${markIcon(20)}<span></span></p><button class="backpack-close" aria-label="Close backpack">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',22)}</button></div><div class="backpack-body"><nav class="backpack-filters" role="group" aria-label="Inventory categories"></nav><div class="backpack-shelf"><div class="backpack-items" role="group" aria-label="Items"></div><div class="backpack-sortbar"><label class="backpack-sort"><span>Sort</span><select aria-label="Sort items"></select></label><button class="backpack-order" aria-pressed="false" aria-label="Reverse order" title="Reverse order">${svg(SORT_ICON,18)}</button><span class="backpack-hotbar-count"></span></div></div><section class="backpack-details" aria-live="polite"><div class="backpack-art"><div class="backpack-title-block"><h3 class="backpack-name"></h3><small class="backpack-kind"></small><span class="backpack-stars" aria-hidden="true"></span></div><span class="backpack-art-icon"></span></div><div class="backpack-actions" aria-label="Selected item actions"></div><div class="backpack-action-row"></div><p class="backpack-note"></p></section></div></div>`;
 document.body.append(dialog);
 let category='all',sort='newest',reverse=false,lastKey='',selectedId=null,choosingSlot=false,seen=null,seenWorld=null;
 const filters=dialog.querySelector('.backpack-filters'),items=dialog.querySelector('.backpack-items'),actions=dialog.querySelector('.backpack-actions'),actionRow=dialog.querySelector('.backpack-action-row'),note=dialog.querySelector('.backpack-note'),artIcon=dialog.querySelector('.backpack-art-icon');
 const sorter=dialog.querySelector('.backpack-sort select'),order=dialog.querySelector('.backpack-order');
 for(const choice of BACKPACK_SORTS)sorter.add(new Option(choice.label,choice.id));
 sorter.onchange=()=>{sort=sorter.value;lastKey='';refresh();};
 order.onclick=()=>{reverse=!reverse;order.setAttribute('aria-pressed',reverse);lastKey='';refresh();};
 const categoryLabel=id=>id==='all'?'All items':ITEM_CATEGORIES.find(choice=>choice.id===id)?.label||'Items';
 const stars=rarity=>'★'.repeat(RARITIES.indexOf(rarity)+1);
 const setNote=text=>{note.textContent=text;note.prepend(document.createRange().createContextualFragment(svg('<rect x="7" y="3" width="10" height="18" rx="5"/><path d="M12 3v6"/>',20)));};
 for(const choice of [{id:'all',label:'All items'},...ITEM_CATEGORIES]){
  const filter=document.createElement('button');filter.innerHTML=`${svg(CATEGORY_ICONS[choice.id])}<span></span>`;filter.querySelector('span').textContent=choice.label;filter.title=choice.label;filter.dataset.category=choice.id;filter.setAttribute('aria-pressed',choice.id==='all');
  filter.onclick=()=>{category=choice.id;lastKey='';refresh();};filters.append(filter);
 }
 const select=id=>{selectedId=id;seen?.add(id);choosingSlot=false;lastKey='';refresh();if(matchMedia('(max-width: 600px) and (min-height: 561px)').matches)dialog.querySelector('.backpack-details').scrollIntoView({block:'nearest',behavior:'smooth'});};
 // Rarity colours the border and corner gem; stacks ready to combine and slotted artifacts get a small tag.
 function markArtifact(card,inventory,item){
  card.classList.add('backpack-artifact');card.dataset.rarity=item.rarity;
  const label=`${RARITY_NAMES[item.rarity]} ${item.name}`;card.title=label;card.setAttribute('aria-label',`Select ${label}, ${itemCount(item)} carried`);
  const ready=nextRarity(item.rarity)&&copiesOf(inventory,artifactKey(item))>=COMBINE_COUNT,slotted=inArtifactSlot(inventory,item);
  const rating=document.createElement('span');rating.className='backpack-card-stars';rating.setAttribute('aria-hidden','true');rating.textContent=stars(item.rarity);card.querySelector('.backpack-card-art').append(rating);
  return slotted?'In slot':ready?'Ready':'';
 }
 // The three artifact slots sit above the collection while the Artifacts tab is open.
 function artifactSlotPanel(inventory){
  const panel=document.createElement('div');panel.className='backpack-artifact-slots';
  const slotted=slottedArtifacts(inventory),heading=document.createElement('p');heading.className='backpack-artifact-heading';
  heading.innerHTML='<span>Artifact slots</span><span></span>';heading.lastChild.textContent=`${slotted.length} / ${ARTIFACT_SLOT_COUNT}`;
  const row=document.createElement('div');row.className='backpack-artifact-row';
  for(const key of artifactSlots(inventory)){
   const item=key&&inventory.allItems.find(entry=>isArtifact(entry)&&artifactKey(entry)===key);
   if(!item){const empty=document.createElement('span');empty.className='backpack-cell backpack-artifact-empty';empty.textContent='Empty';row.append(empty);continue;}
   const card=document.createElement('button');card.className='backpack-cell backpack-item backpack-artifact';card.dataset.rarity=item.rarity;card.setAttribute('aria-pressed',selectedId===item.id);
   card.setAttribute('aria-label',`Artifact slot: ${RARITY_NAMES[item.rarity]} ${item.name}`);card.title=`${RARITY_NAMES[item.rarity]} ${item.name}`;
   const art=document.createElement('span');art.className='backpack-card-art';const icon=document.createElement('span');icon.className='backpack-item-icon';setItemIcon(icon,item.name);const rating=document.createElement('span');rating.className='backpack-card-stars';rating.setAttribute('aria-hidden','true');rating.textContent=stars(item.rarity);art.append(icon,rating);card.append(art);card.onclick=()=>select(item.id);row.append(card);
  }
  const hint=document.createElement('p');hint.className='backpack-artifact-hint';hint.textContent=slotted.length?'Artifacts work only while they are in a slot.':'Put an artifact in a slot to use its power.';
  const collection=document.createElement('p');collection.className='backpack-artifact-heading';collection.innerHTML='<span>Collection</span>';
  panel.append(heading,row,hint,collection);return panel;
 }
 // What an artifact does now, what each rarity would do, and how close the stack is to combining.
 function artifactDetails(inventory,item){
  const box=document.createElement('div');box.className='backpack-artifact-details';
  const effect=document.createElement('p');effect.className='backpack-artifact-effect';effect.textContent=artifactEffect(item.artifact,item.rarity)+'.';
  const tiers=document.createElement('div');tiers.className='backpack-artifact-tiers';
  for(const rarity of RARITIES){const tier=document.createElement('span');tier.dataset.rarity=rarity;tier.classList.toggle('current',rarity===item.rarity);tier.title=`${RARITY_NAMES[rarity]}: ${artifactEffect(item.artifact,rarity)}`;tier.textContent=RARITY_NAMES[rarity];tiers.append(tier);}
  const next=nextRarity(item.rarity),copies=copiesOf(inventory,artifactKey(item)),progress=document.createElement('p');progress.className='backpack-artifact-progress';
  progress.textContent=next?`${Math.min(copies,COMBINE_COUNT)} / ${COMBINE_COUNT} to combine into ${RARITY_NAMES[next]}`:'Legendary is the highest rarity.';
  box.append(effect,tiers,progress);return box;
 }
 function refresh(){
  const world=getWorld(),inventory=world.inventory,entries=sortBackpackItems(backpackItems(inventory,category),sort,reverse);
  // Items picked up since the backpack was last looked at get a New tag until they are selected or the backpack closes.
  if(seenWorld!==world){seenWorld=world;seen=new Set(inventory.allItems.map(item=>item.id));}
  // Keep a selection visible like the reference design: fall back to the first item in the current category.
  if(!entries.some(({item})=>item.id===selectedId)){selectedId=entries[0]?.item.id??null;choosingSlot=false;}
  const key=JSON.stringify([inventory.marks,inventory.allItems,inventory.slots,artifactSlots(inventory),inventory.selected,category,sort,reverse,selectedId,choosingSlot,[...seen]]);if(key===lastKey)return;lastKey=key;
  const total=inventory.allItems.reduce((sum,item)=>sum+itemCount(item),0),stacks=inventory.allItems.length;
  dialog.querySelector('.backpack-capacity').textContent=`${total} ${total===1?'item':'items'} · ${stacks} ${stacks===1?'slot':'slots'}`;
  dialog.querySelector('.backpack-crumb').textContent=categoryLabel(category);
  dialog.querySelector('.backpack-hotbar-count').textContent=`Hotbar ${inventory.slots.filter(Boolean).length} / 6`;
  dialog.querySelector('.backpack-marks span').textContent=marksLabel(inventory.marks||0);
  for(const filter of filters.children)filter.setAttribute('aria-pressed',filter.dataset.category===category);
  items.replaceChildren();actions.replaceChildren();actionRow.replaceChildren();
  const selected=inventory.allItems.find(item=>item.id===selectedId);
  const details=dialog.querySelector('.backpack-details');details.classList.toggle('empty',!selected);details.dataset.rarity=isArtifact(selected)?selected.rarity:'';details.dataset.category=selected?itemCategory(selected):'';setItemIcon(artIcon,selected?.name);
  dialog.querySelector('.backpack-name').textContent=selected?.name||'Nothing here yet';
  dialog.querySelector('.backpack-kind').textContent=!selected?categoryLabel(category):isArtifact(selected)?`${RARITY_NAMES[selected.rarity]} artifact`:categoryLabel(itemCategory(selected));
  dialog.querySelector('.backpack-stars').textContent=isArtifact(selected)?stars(selected.rarity):'';
  if(selected){
   const uses=document.createElement('small');uses.className='backpack-uses';uses.textContent=isArtifact(selected)?`${itemCount(selected)} carried`:PERMANENT_ITEMS.has(selected.name)?'Unlimited uses':stackable(selected)?`${itemCount(selected)} in this stack`:amountLabel(selected);
   const description=document.createElement('p');description.textContent=selected.description||'Choose what to do with this item.';
   const place=document.createElement('strong');place.className='backpack-equip';const hotbarSlot=inventory.slots.findIndex(entry=>entry?.id===selected.id);place.textContent=inArtifactSlot(inventory,selected)?'In an artifact slot':hotbarSlot>=0?`Hotbar ${hotbarSlot+2}`:'In backpack';
   actions.append(uses,description);if(isArtifact(selected))actions.append(artifactDetails(inventory,selected));actions.append(place);
   const addAction=(label,action)=>{const control=document.createElement('button');control.textContent=label;control.onclick=action;actionRow.append(control);return control;};
   const execute=action=>{const previous=selected.id;if(onAction(selected.id,action)){selectedId=null;choosingSlot=false;lastKey='';if(isArtifact(selected))setNote(getWorld().message);if(action==='combine')selectedId=getWorld().inventory.allItems.find(item=>isArtifact(item)&&item.artifact===selected.artifact&&item.rarity===nextRarity(selected.rarity))?.id??null;if(['slot','unslot'].includes(action))selectedId=getWorld().inventory.allItems.some(item=>item.id===previous)?previous:null;refresh();}else{setNote(getWorld().fishing.state!=='idle'?'Finish or abandon fishing before managing items.':getWorld().message||'Action unavailable. Let your attack recover.');}};
   // Only equipping and combining happen here: artifacts go into their own slots, everything else onto the hotbar.
   if(isArtifact(selected)){
    const next=nextRarity(selected.rarity);
    if(next&&copiesOf(inventory,artifactKey(selected))>=COMBINE_COUNT)addAction(`Combine ${COMBINE_COUNT} into ${RARITY_NAMES[next]}`,()=>execute('combine')).className='primary';
    const slotted=inArtifactSlot(inventory,selected);addAction(slotted?'Unequip':'Equip',()=>execute(slotted?'unslot':'slot'));
   }else{const hotbar=addAction('Equip to hotbar',()=>{choosingSlot=!choosingSlot;lastKey='';refresh();});hotbar.className='primary';hotbar.setAttribute('aria-expanded',choosingSlot);}
   if(choosingSlot){
    const title=document.createElement('p');title.className='backpack-slot-title';title.textContent='Choose a hotbar slot. Replaced items stay in the backpack.';actions.prepend(title);
    const slots=document.createElement('div');slots.className='backpack-slot-choices';title.after(slots);
    for(let slot=2;slot<=7;slot++){
     const control=document.createElement('button');control.textContent=`${slot}: ${inventory.slots[slot-2]?.name||'Empty'}`;
     control.onclick=()=>{if(onAction(selected.id,'hotbar',slot)){choosingSlot=false;lastKey='';refresh();}else setNote('Finish or abandon fishing first.');};slots.append(control);
    }
    actions.scrollTop=0;
   }
  }else{
   const empty=document.createElement('p');empty.className='backpack-empty';empty.textContent=category==='all'?'Your backpack is empty. Fish to find items.':'No items in this category yet.';actions.append(empty);
  }
  if(category==='artifacts')items.append(artifactSlotPanel(inventory));
  if(!entries.length){const empty=document.createElement('p');empty.className='backpack-grid-empty';empty.textContent=category==='all'?'Nothing carried yet.':`No ${categoryLabel(category).toLowerCase()} yet.`;items.append(empty);}
  // Cards like the reference: tinted art by type or rarity, a cream strip with the amount, and corner tags.
  for(const {item} of entries){
   const card=document.createElement('button');card.className='backpack-cell backpack-item';card.dataset.category=itemCategory(item);card.setAttribute('aria-label',`Select ${item.name}, ${stackable(item)?`${itemCount(item)} carried`:amountLabel(item)}`);card.setAttribute('aria-pressed',selectedId===item.id);card.title=item.name;
   const art=document.createElement('span');art.className='backpack-card-art';
   const icon=document.createElement('span');icon.className='backpack-item-icon';setItemIcon(icon,item.name);art.append(icon);
   const count=document.createElement('small');count.className='backpack-count';count.textContent=PERMANENT_ITEMS.has(item.name)?'∞':stackable(item)?`×${itemCount(item)}`:`${item.uses} ${item.uses===1?'use':'uses'}`;
   card.append(art,count);
   let tag=isArtifact(item)?markArtifact(card,inventory,item):'';if(!tag&&!seen.has(item.id))tag='New';
   if(tag){const label=document.createElement('small');label.className='backpack-tag';label.dataset.tag=tag.toLowerCase().replace(' ','-');label.textContent=tag;card.append(label);}
   const hotbarSlot=inventory.slots.findIndex(entry=>entry?.id===item.id);
   if(hotbarSlot>=0){const badge=document.createElement('small');badge.className='backpack-hotbar-badge';badge.textContent=hotbarSlot+2;badge.title=`Hotbar ${hotbarSlot+2}`;card.append(badge);}
   card.onclick=()=>select(item.id);items.append(card);
  }
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();selectedId=null;choosingSlot=false;lastKey='';setNote('Select an item for actions. Catches stay in your backpack.');refresh();dialog.showModal();button.setAttribute('aria-expanded','true');}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{if(seen)for(const item of getWorld().inventory.allItems)seen.add(item.id);button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
