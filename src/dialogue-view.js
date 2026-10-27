import {drawEntitySprite,drawSprite} from './sprites.js';
import {SPRITES} from './sprite-definitions.js';
import {drawNpc} from './npcs.js';
import {drawExplorer} from './wilds.js';
const keywords=/\b(Rimejaw|Flitlynx|Moonfang|Croshelda|Goldanir|Region Core|Reedwater|Ember Volcano|Listening Tree|Crystal Lakes)\b/g;
export function setDialogueText(target,text){
 target.replaceChildren();let from=0;for(const match of text.matchAll(keywords)){
  target.append(document.createTextNode(text.slice(from,match.index)));const mark=document.createElement('mark');mark.textContent=match[0];target.append(mark);from=match.index+match[0].length;
 }target.append(document.createTextNode(text.slice(from)));
}
export function dialogueMarkup(prefix){return `<section class="dialogue-box" aria-label="Dialogue"><button class="dialogue-close" id="${prefix}-close" aria-label="Close dialogue">×</button><div class="dialogue-identity"><div class="dialogue-portrait-frame"><canvas id="${prefix}-portrait" width="256" height="256" aria-label="Speaker portrait"></canvas></div><strong class="dialogue-name" id="${prefix}-name"></strong></div><div class="dialogue-content"><small class="dialogue-chapter" id="${prefix}-chapter"></small><h2 class="dialogue-title" id="${prefix}-title"></h2><p class="dialogue-text" id="${prefix}-text"></p><footer class="dialogue-actions"><button class="dialogue-end" id="${prefix}-end">End conversation</button><span class="dialogue-page" id="${prefix}-page"></span><button class="dialogue-previous" id="${prefix}-previous">‹ Previous</button><button class="dialogue-next" id="${prefix}-next">Next › <kbd>Space</kbd></button></footer></div></section>`;}
// Narration shows an open book; the voice in the storm is a pulse of the lure's blue light.
function drawVoiceEmblem(c,id){
 if(id==='voice'){
  const glow=c.createRadialGradient(128,128,6,128,128,110);glow.addColorStop(0,'#e8fbff');glow.addColorStop(.25,'#7fd4f0');glow.addColorStop(.6,'#2a6f9a66');glow.addColorStop(1,'#0c1a2600');
  c.fillStyle='#0c1a26';c.fillRect(0,0,256,256);c.fillStyle=glow;c.fillRect(0,0,256,256);return;
 }
 c.fillStyle='#e9dcb8';c.fillRect(0,0,256,256);c.lineWidth=6;c.strokeStyle='#6b4b35';c.fillStyle='#fbf3df';
 for(const side of [-1,1]){c.beginPath();c.moveTo(128,78);c.quadraticCurveTo(128+side*50,60,128+side*96,76);c.lineTo(128+side*96,186);c.quadraticCurveTo(128+side*50,170,128,188);c.closePath();c.fill();c.stroke();}
 c.lineWidth=3;c.strokeStyle='#a68a66';for(const side of [-1,1])for(let i=0;i<4;i++){const y=104+i*18;c.beginPath();c.moveTo(128+side*18,y);c.lineTo(128+side*80,y-4);c.stroke();}
}
export function drawDialoguePortrait(canvas,speaker={name:'Eli',spriteId:'eli'}){
 const c=canvas.getContext('2d');c.clearRect(0,0,256,256);canvas.setAttribute('aria-label',`${speaker.name||'Eli'} portrait`);
 if(speaker.id==='mara'||speaker.name==='The girl'){
  if(drawSprite(c,{...SPRITES['mara-portrait'],scale:.51},{x:128,y:15}))return;
 }else if(speaker.id==='narrator'||speaker.id==='voice'){drawVoiceEmblem(c,speaker.id);return;
 }else if(speaker.id==='emilia'){
  if(drawSprite(c,{...SPRITES['emilia-portrait'],scale:.51},{x:128,y:15}))return;
 }else if(speaker.creature){if(drawEntitySprite(c,speaker.spriteId,{x:128,y:210,time:0}))return;}
 c.save();c.scale(4,4);
 if(speaker.npc)drawNpc(c,{...speaker,x:32,y:43,name:''},0);else drawExplorer(c,{x:32,y:41,angle:0,spriteId:'eli'},0);
 c.restore();
}

