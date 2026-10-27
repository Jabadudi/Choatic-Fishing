import {WARES,MERCHANT_NAMES,marksLabel,marksOf,sellValue,buyWare,sellItem} from './trade.js';
import {setItemIcon,MARK_ART} from './item-icons.js';
import {itemCount} from './inventory.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// A reed mark: a copper disc stamped with a single reed.
export const markIcon=(size=18)=>`<img class="mark-icon" src="${MARK_ART}" width="${size}" height="${size}" alt="" draggable="false">`;
const STALL='<path d="M4 9l2-5h12l2 5M4 9h16v11H4zM4 9c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3c0 1.7 1.3 3 3 3s3-1.3 3-3M10 20v-5h4v5"/>';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export function mountTrade({getWorld,onOpen,onClose}){
 const dialog=document.createElement('dialog');dialog.id='trade-sheet';dialog.setAttribute('aria-labelledby','trade-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(STALL,40)}</span><h2 id="trade-title">Stall</h2><p class="backpack-capacity trade-purse"></p><button class="backpack-close" aria-label="Close stall">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div><div class="trade-body"><section class="trade-column" aria-labelledby="trade-buy-title"><h3 id="trade-buy-title" class="trade-column-title">For sale</h3><ul class="trade-list trade-wares"></ul></section><section class="trade-column" aria-labelledby="trade-sell-title"><h3 id="trade-sell-title" class="trade-column-title">Sell from your backpack</h3><ul class="trade-list trade-pack"></ul></section></div><p class="trade-note" role="status"></p></div>`;
 document.body.append(dialog);
 const wares=dialog.querySelector('.trade-wares'),pack=dialog.querySelector('.trade-pack'),purse=dialog.querySelector('.trade-purse'),note=dialog.querySelector('.trade-note');
 let merchant=null,lastKey='';
 function row(list,{name,count,detail,price,disabled,title,actions}){
  const item=el('li','trade-row'),icon=el('span','trade-icon');setItemIcon(icon,name);
  const text=el('span','trade-text');text.append(el('strong',null,count>1?`${name} ×${count}`:name),el('small',null,detail));
  const cost=el('span','trade-price');cost.innerHTML=markIcon(16);cost.append(String(price));cost.setAttribute('aria-label',marksLabel(price));
  const buttons=el('span','trade-buttons');
  for(const [label,action,aria] of actions){
   const button=el('button','trade-action',label);button.disabled=disabled;if(title)button.title=title;button.setAttribute('aria-label',aria);
   button.onclick=()=>{action();note.textContent=getWorld().message;lastKey='';refresh();};buttons.append(button);
  }
  item.append(icon,text,cost,buttons);list.append(item);
 }
 function refresh(){
  const world=getWorld(),marks=marksOf(world),items=world.inventory.allItems;
  const key=JSON.stringify([merchant,marks,items.map(item=>[item.id,item.uses,itemCount(item)])]);if(key===lastKey)return;lastKey=key;
  purse.innerHTML=`${markIcon(20)}<span></span>`;purse.querySelector('span').textContent=`Your purse: ${marksLabel(marks)}`;
  wares.replaceChildren();pack.replaceChildren();
  WARES[merchant].forEach((ware,index)=>row(wares,{name:ware.item,count:ware.count,detail:ware.description,price:ware.price,disabled:marks<ware.price,title:marks<ware.price?`You need ${marksLabel(ware.price-marks)} more`:'',actions:[['Buy',()=>buyWare(world,merchant,index),`Buy ${ware.count>1?`${ware.count} ${ware.item}`:ware.item} for ${marksLabel(ware.price)}`]]}));
  const sellable=items.filter(item=>sellValue(item)>0);
  for(const item of sellable){
   const count=itemCount(item),value=sellValue(item),actions=[['Sell',()=>sellItem(world,item.id),`Sell one ${item.name} for ${marksLabel(value)}`]];
   // Stacks can go in one trade.
   if(count>1)actions.push([`All ×${count}`,()=>sellItem(world,item.id,Infinity),`Sell all ${count} ${item.name} for ${marksLabel(value*count)}`]);
   row(pack,{name:item.name,count,detail:count>1?`${marksLabel(value)} each. ${item.description||''}`:item.description||'',price:value,disabled:false,actions});
  }
  if(!sellable.length)pack.append(el('li','trade-empty','Nothing the merchant wants. Hunt or fish for goods to sell.'));
 }
 function open(id){
  const world=getWorld();if(!WARES[id]||!world.adventure||world.player.health<=0||dialog.open)return;
  merchant=id;lastKey='';onOpen();dialog.querySelector('#trade-title').textContent=MERCHANT_NAMES[id];
  note.textContent=`${world.message} Merchants pay in reed marks. Quest items and Grandpa’s bow are not for sale.`;
  refresh();dialog.showModal();
 }
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{merchant=null;onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 return {get open(){return dialog.open;},show:open,close(){if(dialog.open)dialog.close();},update(visible){if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
