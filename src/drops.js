import {walkable} from './wilds.js';
import {drawEntitySprite,drawImageAsset} from './sprites.js';
import {itemAsset} from './item-icons.js';
import {isArtifact} from './artifacts.js';
// Artifact drops glow in their rarity colour so a lucky find stands out on the ground.
export const RARITY_COLORS=Object.freeze({common:'#d9dccf',uncommon:'#7fd18b',rare:'#6fb6ff',epic:'#c58cff',legendary:'#ffb347'});
export const nearbyDrop=world=>world.adventure?(world.drops||[]).filter(drop=>drop.areaId===world.areaId&&Math.hypot(drop.x-world.player.x,drop.y-world.player.y)<65).sort((a,b)=>Math.hypot(a.x-world.player.x,a.y-world.player.y)-Math.hypot(b.x-world.player.x,b.y-world.player.y))[0]||null:null;
export function dropItem(world,item){
 const p=world.player;let position=null;
 for(const distance of [40,24,0]){for(const offset of [0,.8,-.8,1.6,-1.6,Math.PI]){
  const x=p.x+Math.cos(p.angle+offset)*distance,y=p.y+Math.sin(p.angle+offset)*distance;
  if(walkable(x,y,world.areaId)){position={x,y};break;}
 }if(position)break;}
 if(!position)return false;
 const removed=world.inventory.removeId(item.id);if(!removed)return false;
 // A Lodestone leaves a thrown item alone for a few seconds.
 world.drops.push({id:`drop-${world.nextDropId++}`,entityType:'pickup',spriteId:'pickup',areaId:world.areaId,...position,item:removed,heldUntil:(world.elapsed||0)+4});
 world.message=`Dropped ${item.name}. Examine it nearby to pick it up.`;return true;
}
// A drop shows its own item art, floating a little above its shadow. Each drop's phase comes from its position, so a pile doesn't bob in step.
export function drawDrop(c,drop,time){
 if(drawEntitySprite(c,drop.spriteId,{x:drop.x,y:drop.y,state:'idle',time}))return;
 const lift=(1+Math.sin(time*2.6+drop.x*.7+drop.y*.3))*1.6,y=drop.y-3-lift;
 c.save();c.fillStyle='#17372c55';c.beginPath();c.ellipse(drop.x,drop.y+4,9-lift*.6,3.5-lift*.25,0,0,Math.PI*2);c.fill();c.restore();
 if(isArtifact(drop.item)){
  const color=RARITY_COLORS[drop.item.rarity],pulse=.75+.25*Math.sin(time*3+drop.x);
  c.save();const glow=c.createRadialGradient(drop.x,y,2,drop.x,y,30);glow.addColorStop(0,color+'ee');glow.addColorStop(.45,color+'77');glow.addColorStop(1,color+'00');
  c.globalAlpha=pulse;c.fillStyle=glow;c.beginPath();c.arc(drop.x,y,30,0,Math.PI*2);c.fill();
  c.globalAlpha=1;c.strokeStyle=color;c.lineWidth=2;c.beginPath();c.ellipse(drop.x,drop.y+4,13,5,0,0,Math.PI*2);c.stroke();
  if(drop.item.rarity!=='common'){const beam=c.createLinearGradient(0,y-70,0,y);beam.addColorStop(0,color+'00');beam.addColorStop(1,color+'aa');c.fillStyle=beam;c.globalAlpha=pulse;c.fillRect(drop.x-2.5,y-70,5,64);}c.restore();
 }
 const asset=itemAsset(drop.item?.name);
 if(asset&&drawImageAsset(c,asset,{x:drop.x,y,w:24,h:24}))return;
 c.save();c.translate(0,y-drop.y+3);
 c.fillStyle='#e6c98a';c.fillRect(drop.x-7,drop.y-8,14,13);c.strokeStyle='#594b2d';c.lineWidth=2;c.strokeRect(drop.x-7,drop.y-8,14,13);c.beginPath();c.moveTo(drop.x-5,drop.y-7);c.lineTo(drop.x,drop.y-13);c.lineTo(drop.x+5,drop.y-7);c.stroke();c.restore();
}
