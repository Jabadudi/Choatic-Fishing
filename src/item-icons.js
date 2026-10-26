export const ICONS={'Reed Spear':'♆','Crab Maul':'⚒','Shell Sling':'◌','Treasure Key':'⚿','Frying Pan':'◉','Swordfish':'⚔','Harpoon Gun':'➶','Anchor':'⚓','Pufferfish Bomb':'✹','Grappling Squid':'↗','Sardine':'♢','Old Boot':'♟'};
// Painted icons replace the glyph. The lure becomes the Region Core in Chapter 4; it is the same object, so both names share the art.
export const ITEM_ART={'Region Core':'assets/items/region-core.svg','Mysterious Lure':'assets/items/region-core.svg'};
export function setItemIcon(element,name){
 const key=name??'';if(element.dataset.icon===key)return;element.dataset.icon=key;
 if(name&&ITEM_ART[name]){const image=document.createElement('img');image.src=ITEM_ART[name];image.alt='';image.draggable=false;element.replaceChildren(image);}
 else element.textContent=name?ICONS[name]||'◆':'—';
}
