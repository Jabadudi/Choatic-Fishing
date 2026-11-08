// Creatures drawn from Netanel's 4x4 painted sheets: walk, hit, die and attack, four frames each. The sheets are cut by
// scripts/prepare-creature-sheet.py (art/sprites/creatures/<sheet>-sheet.png -> assets/creatures/<sheet>/), every frame
// on the same 300x300 canvas with the feet on the bottom edge, facing right.
// - stump: the stumpling of Regions 1.2.
// - shore-crab: the crabs of Regions 1.3 (crab sheet), and boss-crab, Mudshell, their boss (mudshell sheet), drawn
//   more than twice their size.
// Drawing only; the creatures' stats are in src/entities.js.
import {castShadow} from './ground-shadow.js';
import {drawProp} from './sprites.js';
export const SHEET_ROWS=Object.freeze(['walk','hit','die','attack']);
// size: how many game px wide the 300 px canvas is drawn. shadow: the contact shadow's half width.
export const SHEET_CREATURES=Object.freeze({
 stump:{sheet:'stump',size:39,shadow:8},
 'shore-crab':{sheet:'crab',size:76,shadow:19},
 'boss-crab':{sheet:'mudshell',size:190,shadow:62}
});
export const sheetCreature=a=>SHEET_CREATURES[a.species]||null;
// Which painted frame fits this moment: [row, frame].
export function sheetFrame(a){
 const t=a.time||0;
 // Down: it topples over in about half a second, then lies still while it fades.
 if(a.health<=0)return ['die',Math.min(3,Math.floor(t/.15))];
 if(a.hurtRemaining>0)return ['hit',Math.min(2,Math.floor((.25-a.hurtRemaining)/.25*3))];
 if(a.state==='attack'){const k=1-Math.max(0,Math.min(1,(a.attackRemaining??0)/Math.max(.01,a.attackWindup||.5)));return ['attack',k<.35?0:k<.75?1:2];}
 // Just after a swing it pulls back in.
 if(a.attackCooldown&&a.attackCooldownRemaining>a.attackCooldown-.3)return ['attack',3];
 if(['walk','chase','return','flee'].includes(a.state))return ['walk',Math.floor(t*8+((a.seed>>>0)%4))%4];
 if(a.state==='notice')return ['hit',0];
 // Standing: the settled pose that ends the hit row, with the odd step in place.
 return Math.floor(t*1.3+((a.seed>>>0)%3))%5===0?['walk',3]:['hit',3];
}
const facing=a=>(a.direction?.x??1)<0?-1:1;
// The contact shadow for the shadow pass.
export function sheetShadow(a){const s=sheetCreature(a);if(!s||a.health<=0)return null;return {x:Math.round(a.x),y:Math.round(a.y)-1,rx:s.shadow,ry:Math.max(4.5,s.shadow*.3)};}
export function drawSheetCreature(c,a){
 const s=sheetCreature(a),[row,f]=sheetFrame(a),x=Math.round(a.x),y=Math.round(a.y);
 if(a.health>0)castShadow(c,x,y,s.shadow);
 if(!drawProp(c,`${s.sheet}/${row}-${f}`,{x,y:y+2,w:s.size,h:s.size,flipX:facing(a)<0})){
  // Until the frames load: a plain block in the creature's colour.
  c.fillStyle=s.sheet==='stump'?'#7a4a26':'#c8502c';c.fillRect(x-s.shadow*.8,y-s.size*.35,s.shadow*1.6,s.size*.35);
 }
}
