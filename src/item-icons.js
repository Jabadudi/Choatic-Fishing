export const ICONS={'Fishing Rod':'♧','Reed Spear':'♆','Crab Maul':'⚒','Shell Sling':'◌','Treasure Key':'⚿','Frying Pan':'◉','Swordfish':'⚔','Harpoon Gun':'➶','Anchor':'⚓','Pufferfish Bomb':'✹','Grappling Squid':'↗','Sardine':'♢','Old Boot':'♟','Hunting Bow':'➹','Deer Meat':'♨','Deer Hide':'▤','Deer Antlers':'Ψ','Rabbit Meat':'♨','Rabbit Pelt':'▤','Rabbit’s Foot':'♣','Turtle Meat':'♨','Turtle Shell':'⬢','River Pearl':'●','Eel Fillet':'♨','Eel Skin':'≋','Eel Oil':'⚱','Shadow Ichor':'◈','Rusted Axe Head':'⚒','Black Light Shard':'✦','Hunting Knife':'†','Iron Fishhooks':'ʖ','Whetstone':'▰','Shell Buckler':'⛉','Woven Fish Trap':'⌗','Wild Herbs':'❦','Willow Apples':'❀','Healing Salve':'✚','Lodestone':'⬣','Stag Crown':'Ψ','Mossback Scute':'⬢','Heart of Black Light':'✦'};
// Painted icons replace the glyph; the glyph stays as the fallback. Art is cut from art/sprites/items/sheets by scripts/prepare-item-icons.py.
// The lure becomes the Region Core in Chapter 4; it is the same object, so both names share the art.
const ART_FILES={'Fishing Rod':'fishing-rod','Hunting Bow':'hunting-bow','Hunting Knife':'hunting-knife','Reed Spear':'reed-spear','Shell Buckler':'shell-buckler','Crab Maul':'crab-maul','Shell Sling':'shell-sling','Frying Pan':'frying-pan','Swordfish':'swordfish','Harpoon Gun':'harpoon-gun','Anchor':'anchor','Pufferfish Bomb':'pufferfish-bomb',
 'Sardine':'sardine','Deer Meat':'deer-meat','Rabbit Meat':'rabbit-meat','Turtle Meat':'turtle-meat','Eel Fillet':'eel-fillet','Wild Herbs':'wild-herbs','Willow Apples':'willow-apples','Healing Salve':'healing-salve','Grappling Squid':'grappling-squid','Iron Fishhooks':'iron-fishhooks','Whetstone':'whetstone','Woven Fish Trap':'woven-fish-trap',
 'Deer Hide':'deer-hide','Rabbit Pelt':'rabbit-pelt','Turtle Shell':'turtle-shell','Eel Skin':'eel-skin','Eel Oil':'eel-oil','Shadow Ichor':'shadow-ichor','Rusted Axe Head':'rusted-axe-head','Deer Antlers':'deer-antlers','Rabbit’s Foot':'rabbits-foot','River Pearl':'river-pearl','Black Light Shard':'black-light-shard','Old Boot':'old-boot',
 'Rabbit Familiar Shard':'shard-rabbit','Deer Familiar Shard':'shard-deer','Turtle Familiar Shard':'shard-turtle','Eel Familiar Shard':'shard-eel','Shadow Walker Familiar Shard':'shard-shadow-walker',
 // Stand-ins from scripts/draw-guardian-shard-icons.py until the guardian shards are painted.
 'Moonfang Familiar Shard':'shard-moonfang','Rimejaw Familiar Shard':'shard-rimejaw','Flitlynx Familiar Shard':'shard-flitlynx',
 // Artifacts. Until they have their own paintings, the crown, scute and heart share the art of the antlers, shell and shard they come from.
 'Lodestone':'lodestone','Stag Crown':'deer-antlers','Mossback Scute':'turtle-shell','Heart of Black Light':'black-light-shard',
 'Region Core':'region-core','Mysterious Lure':'region-core','Treasure Key':'treasure-key'};
export const ITEM_ART=Object.fromEntries(Object.entries(ART_FILES).map(([name,file])=>[name,`assets/items/${file}.webp`]));
// The same art as a path under assets/, for drawing on the canvas.
export const itemAsset=name=>ART_FILES[name]&&`items/${ART_FILES[name]}.webp`;
export const MARK_ART='assets/items/reed-mark.webp';
export function setItemIcon(element,name){
 const key=name??'';if(element.dataset.icon===key)return;element.dataset.icon=key;
 if(name&&ITEM_ART[name]){const image=document.createElement('img');image.src=ITEM_ART[name];image.alt='';image.draggable=false;element.replaceChildren(image);}
 else element.textContent=name?ICONS[name]||'◆':'—';
}
