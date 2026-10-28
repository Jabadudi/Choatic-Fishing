// What the HUD announces when Eli's backpack gains items: a short pickup feed, and a card the first time an item is ever found.
// Found item names are saved with the journey. Saves from before the list count everything already carried as found.
import {itemCount,itemCategory,ITEM_CATEGORIES} from './inventory.js';
export const FOUND_LIMIT=500;
const RARE=new Set(['rare','epic','legendary']);
export function carriedItems(inventory){
 const carried=new Map();
 for(const item of inventory.allItems)if(item){const entry=carried.get(item.name);if(entry)entry.count+=itemCount(item);else carried.set(item.name,{item,count:itemCount(item)});}
 return carried;
}
// before is the last carried map, or null on the first look at a journey; nothing is announced then.
export function notePickups(world,before){
 const carried=carriedItems(world.inventory),gained=[],firsts=[];
 if(!world.itemsFound)world.itemsFound=new Set(carried.keys());
 for(const [name,{item,count}] of carried){
  const more=count-(before?.get(name)?.count||0);
  if(before&&more>0)gained.push({name,item,count:more,rare:RARE.has(item.rarity)});
  if(!world.itemsFound.has(name)&&world.itemsFound.size<FOUND_LIMIT){world.itemsFound.add(name);if(before)firsts.push({name,item,category:ITEM_CATEGORIES.find(c=>c.id===itemCategory(item))?.label||'Item'});}
 }
 return {carried,gained,firsts};
}
export function restoreItemsFound(data,world){
 world.itemsFound=null;if(data===undefined||data===null)return;
 if(!Array.isArray(data)||data.length>FOUND_LIMIT||!data.every(name=>typeof name==='string'&&name.length>0&&name.length<=80))throw Error('Invalid found items.');
 world.itemsFound=new Set(data);
}
