const USES={'Frying Pan':3,'Swordfish':3,'Harpoon Gun':3,'Anchor':2,'Reed Spear':5,'Crab Maul':3,'Shell Sling':6};
export class Inventory {
 constructor(){this.selected=1;this.capacity=6;this.slots=Array(6).fill(null);}
 get full(){return this.slots.every(Boolean);}
 get item(){return this.slots[this.selected===1?0:this.selected-2]||null;}
 equip(slot){if(!Number.isInteger(slot)||slot<1||slot>this.capacity+1)return false;this.selected=slot;return true;}
 receive(item){const index=this.slots.indexOf(null);if(index<0)return false;this.slots[index]={...item,uses:USES[item.name]||1};return true;}
 use(){
  if(this.selected===1||!this.item)return null;
  const index=this.selected-2,used={...this.slots[index]};
  if(--this.slots[index].uses===0){this.slots[index]=null;this.selected=1;}
  return used;
 }
}
