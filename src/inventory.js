import {RARITIES} from './artifacts.js';
export const ITEM_CATEGORIES=Object.freeze([
 {id:'consumables',label:'Consumables'}, {id:'weapons',label:'Weapons'},
 {id:'armor',label:'Armor'}, {id:'artifacts',label:'Artifacts'}, {id:'quest-items',label:'Quest items'},
 {id:'trophies',label:'Trophies'}, {id:'upgrade-materials',label:'Upgrade materials'}
]);
const ITEM_CATEGORY={'Sardine':'consumables','Deer Meat':'consumables','Deer Hide':'upgrade-materials','Deer Antlers':'trophies','Grappling Squid':'consumables','Treasure Key':'quest-items','Old Boot':'trophies'};
const WEAPON_NAMES=new Set(['Frying Pan','Swordfish','Harpoon Gun','Anchor','Reed Spear','Crab Maul','Shell Sling','Pufferfish Bomb','Hunting Bow','Hunting Knife']);
// Permanent tools are never used up, however often they are fired.
export const PERMANENT_ITEMS=new Set(['Hunting Bow']);
// Identical single-use items share one backpack slot, up to a full stack. Weapons wear down one by one and story items are one of a kind.
export const STACK_SIZE=20;
const UNIQUE_ITEMS=new Set(['Mysterious Lure','Region Core']);
export const stackable=item=>!!item&&!WEAPON_NAMES.has(item.name)&&!PERMANENT_ITEMS.has(item.name)&&!UNIQUE_ITEMS.has(item.name)&&(item.uses??1)===1;
// Copies share a stack only at the same rarity, so a Rare artifact never folds into Common ones.
export const sameStack=(a,b)=>a.name===b.name&&(a.rarity??null)===(b.rarity??null);
export const itemCount=item=>Number.isInteger(item?.count)&&item.count>0?item.count:1;
// The short amount shown on slots: a stack's size, a weapon's remaining uses, or unlimited.
export const amountLabel=item=>PERMANENT_ITEMS.has(item.name)?'Unlimited':stackable(item)?`×${itemCount(item)}`:`${item.uses} ${item.uses===1?'use':'uses'}`;
// Food bought from the gardens restores health instead of being thrown.
export const HEALING=Object.freeze({'Wild Herbs':15,'Willow Apples':10,'Healing Salve':40});
export const canUseItem=item=>!!item&&(WEAPON_NAMES.has(item.name)||Object.hasOwn(HEALING,item.name)||['Sardine','Grappling Squid','Treasure Key','Old Boot'].includes(item.name));
export function itemCategory(item){
 if(ITEM_CATEGORIES.some(category=>category.id===item.category))return item.category;
 return ITEM_CATEGORY[item.name]||(WEAPON_NAMES.has(item.name)?'weapons':'upgrade-materials');
}
export function backpackItems(inventory,category='all'){
 return inventory.allItems.flatMap((item,index)=>item&&(category==='all'||itemCategory(item)===category)?[{item,slot:inventory.slots.includes(item)?inventory.slots.indexOf(item)+2:null,category:itemCategory(item)}]:[]);
}
const USES={'Frying Pan':3,'Swordfish':3,'Harpoon Gun':3,'Anchor':2,'Reed Spear':5,'Crab Maul':3,'Shell Sling':6,'Hunting Knife':12};
export class Inventory {
 constructor({separateStorage=false}={}){this.selected=1;this.capacity=6;this.slots=Array(6).fill(null);this.separateStorage=separateStorage;this.storedItems=[];this.nextId=1;this.marks=0;this.artifactSlots=[null,null,null];}
 get allItems(){return this.separateStorage?this.storedItems:this.slots.filter(Boolean);}
 get full(){return !this.separateStorage&&this.slots.every(Boolean);}
 get item(){return this.slots[this.selected===1?0:this.selected-2]||null;}
 equip(slot){if(!Number.isInteger(slot)||slot<1||slot>this.capacity+1)return false;this.selected=slot;return true;}
 receive(item){
  const index=this.slots.indexOf(null);if(!this.separateStorage&&index<0)return false;
  const stored={...item,id:`item-${this.nextId++}`,uses:Number.isInteger(item.uses)&&item.uses>0?item.uses:USES[item.name]||1};delete stored.count;
  if(!this.separateStorage){this.slots[index]=stored;return true;}
  if(!stackable(stored)){this.storedItems.push(stored);return true;}
  // Top up stacks already carried, then open new stacks for whatever is left over.
  let left=itemCount(item);
  for(const stack of this.storedItems)if(left>0&&sameStack(stack,stored)&&stackable(stack)&&itemCount(stack)<STACK_SIZE){const added=Math.min(left,STACK_SIZE-itemCount(stack));stack.count=itemCount(stack)+added;left-=added;}
  for(let first=true;left>0;first=false){const stack={...stored,id:first?stored.id:`item-${this.nextId++}`,count:Math.min(left,STACK_SIZE)};left-=stack.count;this.storedItems.push(stack);}
  return true;
 }
 countOf(name){return this.allItems.reduce((total,item)=>total+(item.name===name?itemCount(item):0),0);}
 // Removes up to amount of a name across stacks and reports how many went. Quests take the plainest artifacts first.
 removeName(name,amount){
  let left=amount;for(const item of [...this.allItems].sort((a,b)=>RARITIES.indexOf(a.rarity)-RARITIES.indexOf(b.rarity)))if(left>0&&item.name===name)left-=itemCount(this.removeId(item.id,left));
  return amount-left;
 }
 assignHotbar(id,slot){
  if(!this.separateStorage||!Number.isInteger(slot)||slot<2||slot>7)return false;
  const item=this.storedItems.find(item=>item.id===id);if(!item)return false;
  for(let i=0;i<this.slots.length;i++)if(this.slots[i]?.id===id)this.slots[i]=null;
  this.slots[slot-2]=item;return true;
 }
 // Folds loose copies of an item into earlier stacks, keeping hotbar shortcuts on the stack that absorbed them.
 restack(){
  for(const item of [...this.storedItems]){
   if(!stackable(item))continue;
   for(const stack of this.storedItems){
    if(stack===item)break;if(!sameStack(stack,item)||!stackable(stack)||itemCount(stack)>=STACK_SIZE)continue;
    const moved=Math.min(itemCount(item),STACK_SIZE-itemCount(stack));stack.count=itemCount(stack)+moved;item.count=itemCount(item)-moved;
    if(item.count===0){this.storedItems=this.storedItems.filter(entry=>entry!==item);for(let i=0;i<this.slots.length;i++)if(this.slots[i]===item)this.slots[i]=this.slots.includes(stack)?null:stack;break;}
   }
  }
  if(this.selected>1&&!this.item)this.selected=1;
 }
 // Takes one from a stack by default; the slot empties once the whole stack is gone.
 removeId(id,amount=1){
  const item=this.allItems.find(item=>item.id===id);if(!item)return null;
  if(itemCount(item)>amount){item.count-=amount;return {...item,count:amount};}
  if(this.separateStorage)this.storedItems=this.storedItems.filter(item=>item.id!==id);
  for(let i=0;i<this.slots.length;i++)if(this.slots[i]?.id===id){this.slots[i]=null;if(this.selected===i+2)this.selected=1;}
  return item;
 }
 useId(id){
  const item=this.allItems.find(item=>item.id===id);if(!item)return null;
  const used={...item,count:1};if(PERMANENT_ITEMS.has(item.name))return used;
  if(itemCount(item)>1)item.count--;else if(--item.uses===0)this.removeId(id);return used;
 }
 use(){
  if(this.selected===1||!this.item)return null;
  return this.useId(this.item.id);
 }
}
