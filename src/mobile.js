// Touch input remains separate from fishing physics and keyboard input.
export function joystickVector(dx,dy,radius=46){
 const distance=Math.hypot(dx,dy),dead=radius*.16;
 if(distance<=dead)return {x:0,y:0,thumbX:dx,thumbY:dy};
 const travel=Math.min(distance,radius),strength=(travel-dead)/(radius-dead);
 return {x:dx/distance*strength,y:dy/distance*strength,thumbX:dx/distance*travel,thumbY:dy/distance*travel};
}
export function gameScale(width,height,touch=false){
 if(touch&&width<1100)return Math.max(.55,Math.min(width/540,height/620));
 return Math.min(width/960,height/720);
}
export class TouchInput {
 constructor(){this.enabled=false;this.movePointer=null;this.usePointer=null;this.facing={x:0,y:-1};this.manualAim=null;this.reset();}
 reset(){this.movePointer=null;this.usePointer=null;this.x=0;this.y=0;this.held=false;}
 beginMove(id){if(!this.enabled||this.movePointer!==null)return false;this.movePointer=id;this.manualAim=null;return true;}
 move(id,dx,dy){if(id!==this.movePointer)return null;const v=joystickVector(dx,dy);this.x=v.x;this.y=v.y;if(v.x||v.y){const d=Math.hypot(v.x,v.y);this.facing={x:v.x/d,y:v.y/d};}return v;}
 endMove(id){if(id!==this.movePointer)return false;this.movePointer=null;this.x=0;this.y=0;return true;}
 beginUse(id){if(!this.enabled||this.usePointer!==null)return false;this.usePointer=id;this.held=true;return true;}
 endUse(id){if(id!==this.usePointer)return false;this.usePointer=null;this.held=false;return true;}
 aim(player){return this.manualAim||{x:player.x+this.facing.x*190,y:player.y+this.facing.y*190};}
}
export function mountMobileControls({state,action,examine,active}){
 const root=document.createElement('section');root.id='touch-controls';root.setAttribute('aria-label','Touch controls');
 root.innerHTML=`<div class="touch-actions"><button id="touch-use" class="touch-action primary" aria-label="Use selected item"><span class="touch-symbol" aria-hidden="true">✦</span><strong>Use</strong><small id="touch-use-hint">Selected item</small></button><button id="touch-examine" class="touch-action" aria-label="Examine nearby landmark"><span aria-hidden="true">⌕</span><strong>Examine</strong></button></div><div class="touch-movement"><div id="touch-stick" role="group" aria-label="Movement joystick"><span class="stick-arrows" aria-hidden="true">✥</span><span id="touch-thumb"></span></div><span class="stick-label">MOVE</span></div>`;
 document.querySelector('.playfield').append(root);
 const stick=root.querySelector('#touch-stick'),thumb=root.querySelector('#touch-thumb'),use=root.querySelector('#touch-use'),inspect=root.querySelector('#touch-examine');
 const center=()=>{thumb.style.transform='translate(0px, 0px)';stick.classList.remove('engaged');};
 const move=e=>{const r=stick.getBoundingClientRect(),v=state.move(e.pointerId,e.clientX-r.left-r.width/2,e.clientY-r.top-r.height/2);if(v)thumb.style.transform=`translate(${v.thumbX}px, ${v.thumbY}px)`;};
 stick.addEventListener('pointerdown',e=>{if(e.button!==0||!active()||!state.beginMove(e.pointerId))return;e.preventDefault();stick.setPointerCapture(e.pointerId);stick.classList.add('engaged');move(e);});
 stick.addEventListener('pointermove',move);
 for(const type of ['pointerup','pointercancel','lostpointercapture'])stick.addEventListener(type,e=>{if(state.endMove(e.pointerId))center();});
 use.addEventListener('pointerdown',e=>{if(e.button!==0||!active()||!state.beginUse(e.pointerId))return;e.preventDefault();use.setPointerCapture(e.pointerId);use.classList.add('pressed');action();});
 for(const type of ['pointerup','pointercancel','lostpointercapture'])use.addEventListener(type,e=>{if(state.endUse(e.pointerId))use.classList.remove('pressed');});
 use.addEventListener('click',e=>{if(e.detail===0&&active())action();});
 // Examine fires on touch-down too, so it works while the other thumb is walking.
 let touched=false;
 inspect.addEventListener('pointerdown',e=>{touched=false;if(e.pointerType==='mouse'||!active())return;touched=true;examine();});
 inspect.addEventListener('click',e=>{if(touched&&e.detail){touched=false;return;}touched=false;if(active())examine();});
 root.addEventListener('contextmenu',e=>e.preventDefault());
 return {
  reset(){state.reset();center();use.classList.remove('pressed');},
  update(world,blocked){
   state.enabled=!blocked;root.hidden=blocked;
   if(blocked)this.reset();
   const phase=world.fishing.state,item=world.inventory.item;
   root.querySelector('#touch-use-hint').textContent=phase==='reeling'?'Hold to reel':phase==='waiting'?'Cancel cast':world.inventory.selected===1?'Cast rod':item?.name||'Empty slot';
   use.querySelector('strong').textContent=phase==='reeling'?'Reel':phase==='waiting'?'Cancel':'Use';
   use.setAttribute('aria-label',phase==='reeling'?'Hold to reel in the catch':phase==='waiting'?'Cancel fishing cast':world.inventory.selected===1?'Cast fishing rod':'Use selected item');
  }
 };
}
