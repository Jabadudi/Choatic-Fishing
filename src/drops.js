import {walkable} from './wilds.js';
import {drawEntitySprite,drawImageAsset} from './sprites.js';
import {itemAsset} from './item-icons.js';
export const nearbyDrop=world=>world.adventure?(world.drops||[]).filter(drop=>drop.areaId===world.areaId&&Math.hypot(drop.x-world.player.x,drop.y-world.player.y)<65).sort((a,b)=>Math.hypot(a.x-world.player.x,a.y-world.player.y)-Math.hypot(b.x-world.player.x,b.y-world.player.y))[0]||null:null;
export function dropItem(world,item){
 const p=world.player;let position=null;
 for(const distance of [40,24,0]){for(const offset of [0,.8,-.8,1.6,-1.6,Math.PI]){
  const x=p.x+Math.cos(p.angle+offset)*distance,y=p.y+Math.sin(p.angle+offset)*distance;
  if(walkable(x,y,world.areaId)){position={x,y};break;}
 }if(position)break;}
 if(!position)return false;
 const removed=world.inventory.removeId(item.id);if(!removed)return false;
 world.drops.push({id:`drop-${world.nextDropId++}`,entityType:'pickup',spriteId:'pickup',areaId:world.areaId,...position,item:removed});
 world.message=`Dropped ${item.name}. Examine it nearby to pick it up.`;return true;
}
// A drop shows its own item art, floating a little above its shadow. Each drop's phase comes from its position, so a pile doesn't bob in step.
export function drawDrop(c,drop,time){
 if(drawEntitySprite(c,drop.spriteId,{x:drop.x,y:drop.y,state:'idle',time}))return;
 const lift=(1+Math.sin(time*2.6+drop.x*.7+drop.y*.3))*1.6,y=drop.y-3-lift;
 c.save();c.fillStyle='#17372c55';c.beginPath();c.ellipse(drop.x,drop.y+4,9-lift*.6,3.5-lift*.25,0,0,Math.PI*2);c.fill();c.restore();
 const asset=itemAsset(drop.item?.name);
 if(asset&&drawImageAsset(c,asset,{x:drop.x,y,w:24,h:24}))return;
 c.save();c.translate(0,y-drop.y+3);
 c.fillStyle='#e6c98a';c.fillRect(drop.x-7,drop.y-8,14,13);c.strokeStyle='#594b2d';c.lineWidth=2;c.strokeRect(drop.x-7,drop.y-8,14,13);c.beginPath();c.moveTo(drop.x-5,drop.y-7);c.lineTo(drop.x,drop.y-13);c.lineTo(drop.x+5,drop.y-7);c.stroke();c.restore();
}
