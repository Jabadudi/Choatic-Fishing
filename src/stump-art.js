// Stumplings for Regions 1.2: little walking tree stumps with a sprout on top. They use Netanel's painted stump sheet
// (art/sprites/creatures/stump-sheet.png, cut by scripts/prepare-stump-sprites.py into four rows of four: walk, hit,
// die, attack). Every frame sits on the same 300x300 canvas with the feet on the bottom edge, and the stump faces right.
// Drawing only; the stumpling's stats are in src/entities.js.
import {castShadow} from './ground-shadow.js';
import {drawProp} from './sprites.js';
export const STUMP_ROWS=Object.freeze(['walk','hit','die','attack']);
// 300 canvas px drawn this many game px wide: the stump's body ends up about 50 game px tall.
const DRAWN=78;
// Which painted frame fits this moment: [row, frame].
export function stumpFrame(a){
 const t=a.time||0;
 // Down: it topples over in about half a second, then lies still while it fades.
 if(a.health<=0)return ['die',Math.min(3,Math.floor(t/.15))];
 if(a.hurtRemaining>0)return ['hit',Math.min(2,Math.floor((.25-a.hurtRemaining)/.25*3))];
 if(a.state==='attack'){const k=1-Math.max(0,Math.min(1,(a.attackRemaining??0)/Math.max(.01,a.attackWindup||.5)));return ['attack',k<.35?0:k<.75?1:2];}
 // Just after a swing it pulls its arm back in.
 if(a.attackCooldown&&a.attackCooldownRemaining>a.attackCooldown-.3)return ['attack',3];
 if(['walk','chase','return','flee'].includes(a.state))return ['walk',Math.floor(t*8+((a.seed>>>0)%4))%4];
 // Standing: the settled pose that ends the hit row, with the odd step in place.
 if(a.state==='notice')return ['hit',0];
 return Math.floor(t*1.3+((a.seed>>>0)%3))%5===0?['walk',3]:['hit',3];
}
const facing=a=>(a.direction?.x??1)<0?-1:1;
// The stumpling's contact shadow for the shadow pass.
export function stumpShadow(a){if(a.health<=0)return null;return {x:Math.round(a.x),y:Math.round(a.y)-1,rx:15,ry:4.5};}
export function drawStump(c,a){
 const [row,f]=stumpFrame(a),id=`stump/${row}-${f}`,x=Math.round(a.x),y=Math.round(a.y);
 if(a.health>0)castShadow(c,x,y,15);
 if(!drawProp(c,id,{x,y:y+2,w:DRAWN,h:DRAWN,flipX:facing(a)<0})){
  // Until the frames load: a plain brown stump.
  c.fillStyle='#7a4a26';c.fillRect(x-12,y-30,24,30);c.fillStyle='#d9a866';c.fillRect(x-12,y-32,24,5);
 }
}
