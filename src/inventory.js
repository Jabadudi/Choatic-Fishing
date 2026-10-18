// Exactly two equipment slots: permanent rod and one finite-use catch.
const USES={'Frying Pan':3,'Swordfish':3,'Harpoon Gun':3,'Anchor':2};
export class Inventory {
  constructor(){this.selected=1;this.item=null;}
  equip(slot){if(slot!==1&&slot!==2)return false;this.selected=slot;return true;}
  receive(item){if(this.item)return false;this.item={...item,uses:USES[item.name]||1};return true;}
  use(){
    if(this.selected!==2||!this.item)return null;
    const used={...this.item};
    if(--this.item.uses===0){this.item=null;this.selected=1;}
    return used;
  }
}
