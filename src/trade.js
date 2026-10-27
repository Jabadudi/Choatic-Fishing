import {PERMANENT_ITEMS,itemCategory,itemCount} from './inventory.js';
// Willowback trades in reed marks: small copper discs stamped with a reed, struck for the delta's markets.
// Marks are a plain count on the backpack, never an item, so they cannot be dropped, stacked or lost to a full hotbar.
export const MARKS_LIMIT=1e6;
export const marksLabel=amount=>`${amount} ${amount===1?'mark':'marks'}`;
// Talking to one of these villagers opens their stall.
export const MERCHANTS=Object.freeze({'village-smith':'blacksmith','village-fisher':'fisher','basket-carrier':'gardener'});
export const MERCHANT_NAMES=Object.freeze({blacksmith:'The Blacksmith',fisher:'The Fisher',gardener:'The Gardener'});
// Prices are in marks. A count above one buys a bundle for the listed price.
export const WARES=Object.freeze({
 blacksmith:[
  {item:'Hunting Knife',category:'weapons',price:20,description:'A short, heavy blade from the village forge. Quick to swing. 28 damage, 12 uses.'},
  {item:'Iron Fishhooks',category:'upgrade-materials',price:12,description:'Barbed hooks of good iron. Stronger tackle, once rods can be upgraded.'},
  {item:'Whetstone',category:'upgrade-materials',price:8,description:'A fine grey stone. Keeps an edge keen.'},
  {item:'Shell Buckler',category:'armor',price:30,description:'A round shield rimmed in turtle shell.'}
 ],
 fisher:[
  {item:'Sardine',category:'consumables',price:4,count:3,description:'Fresh from this morning’s boats.'},
  {item:'Reed Spear',category:'weapons',price:10,description:'A light fishing spear. 22 damage, 5 uses.'},
  {item:'Woven Fish Trap',category:'upgrade-materials',price:12,description:'A reed basket trap. Set it in shallow water and come back later.'}
 ],
 gardener:[
  {item:'Wild Herbs',category:'consumables',price:4,description:'A bundle of bitter green leaves. Eat them to recover 15 health.'},
  {item:'Willow Apples',category:'consumables',price:6,count:4,description:'Small, sharp apples from the willow orchard. Each restores 10 health.'},
  {item:'Healing Salve',category:'consumables',price:10,description:'A tin of thick green salve. Restores 40 health.'}
 ]
});
// What a merchant pays for one item. Bought wares sell back for half their price.
export const SELL_VALUES=Object.freeze({
 'Sardine':1,'Old Boot':1,'Grappling Squid':2,'Frying Pan':2,'Swordfish':3,'Reed Spear':3,'Shell Sling':3,'Pufferfish Bomb':3,'Crab Maul':4,'Anchor':4,'Harpoon Gun':6,
 'Rabbit Meat':2,'Rabbit Pelt':3,'Rabbit’s Foot':8,'Deer Meat':3,'Deer Hide':5,'Deer Antlers':8,'Turtle Meat':3,'Turtle Shell':5,'River Pearl':20,
 'Eel Fillet':2,'Eel Skin':4,'Eel Oil':4,'Shadow Ichor':6,'Rusted Axe Head':5,'Black Light Shard':25,
 ...Object.fromEntries(Object.values(WARES).flat().filter(w=>!['Sardine','Reed Spear'].includes(w.item)).map(w=>[w.item,Math.max(1,Math.floor(w.price/(w.count||1)/2))]))
});
// Quest items and Grandpa's bow are never for sale.
export function sellValue(item){
 if(!item||PERMANENT_ITEMS.has(item.name)||itemCategory(item)==='quest-items')return 0;
 return SELL_VALUES[item.name]??1;
}
export const marksOf=world=>world.inventory.marks||0;
export function earnMarks(world,amount){
 if(!Number.isSafeInteger(amount)||amount<=0)return 0;
 world.inventory.marks=Math.min(MARKS_LIMIT,marksOf(world)+amount);return amount;
}
const tradeOpen=world=>world.adventure&&world.matchState==='playing'&&world.player.health>0&&world.fishing.state==='idle';
export function buyWare(world,merchant,index){
 const ware=WARES[merchant]?.[index];if(!ware||!tradeOpen(world))return false;
 if(marksOf(world)<ware.price){world.message=`${ware.item} costs ${marksLabel(ware.price)}. You have ${marksLabel(marksOf(world))}.`;return false;}
 world.inventory.marks-=ware.price;
 world.inventory.receive({name:ware.item,category:ware.category,description:ware.description,count:ware.count||1});
 world.message=`Bought ${ware.count>1?`${ware.count} ${ware.item}`:ware.item} for ${marksLabel(ware.price)}.`;return true;
}
// Sells one from a stack by default; pass Infinity to sell the whole stack.
export function sellItem(world,id,amount=1){
 const item=world.inventory.allItems.find(item=>item.id===id),value=sellValue(item);
 if(!item||!tradeOpen(world))return false;
 if(!value){world.message=`${item.name} is not for sale.`;return false;}
 const sold=itemCount(world.inventory.removeId(id,amount)),paid=earnMarks(world,value*sold);
 world.message=`Sold ${sold>1?`${sold} ${item.name}`:item.name} for ${marksLabel(paid)}.`;return true;
}
// A few lost marks sometimes come up tangled in a landed catch.
export const FOUND_MARKS={chance:.08,min:1,max:3};
export function findMarks(world,random){
 if(!world.adventure||world.story?.stage==='fish'||random()>=FOUND_MARKS.chance)return 0;
 return earnMarks(world,FOUND_MARKS.min+Math.floor(random()*(FOUND_MARKS.max-FOUND_MARKS.min+1)));
}
