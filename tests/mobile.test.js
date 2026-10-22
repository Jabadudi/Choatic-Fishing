import test from 'node:test';
import assert from 'node:assert/strict';
import {joystickVector,TouchInput,gameScale,mountMobileControls} from '../src/mobile.js';
import {World} from '../src/world.js';
import {cleanInput,neutralInput} from '../src/protocol.js';

test('stick has a dead zone, gradual speed and a bounded circular range',()=>{
 assert.equal(joystickVector(4,3).x,0);
 const half=joystickVector(23,0),full=joystickVector(460,0),diag=joystickVector(100,100);
 assert.ok(half.x>0&&half.x<.5);assert.equal(full.x,1);assert.equal(full.thumbX,46);
 assert.ok(Math.abs(Math.hypot(diag.x,diag.y)-1)<1e-10);
 assert.ok(Math.abs(Math.hypot(diag.thumbX,diag.thumbY)-46)<1e-10);
});

test('moving and using have separate finger ownership and release independently',()=>{
 const t=new TouchInput();t.enabled=true;
 assert.ok(t.beginMove(11));assert.equal(t.beginMove(12),false);t.move(11,46,0);
 assert.ok(t.beginUse(12));assert.equal(t.beginUse(13),false);
 assert.equal(t.endUse(11),false);assert.equal(t.held,true);assert.equal(t.x,1);
 t.endMove(11);assert.equal(t.x,0);assert.equal(t.held,true);
 t.endUse(12);assert.equal(t.held,false);assert.equal(t.usePointer,null);
});

test('cancellation clears held buttons and movement without snapping aim back',()=>{
 const t=new TouchInput();t.enabled=true;t.beginMove(1);t.move(1,0,-46);t.beginUse(2);t.reset();
 assert.equal(t.held,false);assert.equal(t.x,0);assert.equal(t.y,0);assert.equal(t.movePointer,null);
 assert.deepEqual(t.aim({x:300,y:400}),{x:300,y:210});
 t.manualAim={x:900,y:800};assert.deepEqual(t.aim({x:300,y:400}),{x:900,y:800});
 t.beginMove(3);assert.equal(t.manualAim,null);
 t.enabled=false;assert.equal(t.beginUse(4),false);
});

test('analog movement keeps partial speed, caps diagonal speed and leaves keyboard movement intact',()=>{
 const input=neutralInput(),make=()=>new World(()=>0,{botCount:0,countdownSeconds:0});
 const half=make(),full=make(),keyboard=make(),diag=make(),x=full.player.x,y=full.player.y;
 half.update(.1,{...input,moveX:.5,moveY:0});full.update(.1,{...input,moveX:1,moveY:0});keyboard.update(.1,{...input,right:true});
 diag.update(.1,{...input,moveX:1,moveY:1});
 assert.ok(Math.abs((half.player.x-x)*2-(full.player.x-x))<1e-8);
 assert.equal(full.player.x,keyboard.player.x);
 assert.ok(Math.abs(Math.hypot(diag.player.x-x,diag.player.y-y)-(full.player.x-x))<1e-8);
});

test('remote touch axes are normalized and nonfinite or incomplete input is rejected',()=>{
 const i=cleanInput({...neutralInput(),moveX:10,moveY:10});
 assert.ok(Math.abs(Math.hypot(i.moveX,i.moveY)-1)<1e-9);
 assert.equal(cleanInput({...neutralInput(),moveX:NaN,moveY:0}),null);
 assert.equal(cleanInput({...neutralInput(),moveX:1}),null);
 assert.equal('moveX' in cleanInput(neutralInput()),false);
});

test('portrait zoom keeps the explorer readable while desktop zoom stays the same',()=>{
 assert.ok(gameScale(390,844,true)>.7);assert.equal(gameScale(960,720,false),1);
 assert.ok(Number.isFinite(gameScale(320,568,true)));
});

test('pointer capture handles multi-touch, lost capture, and a blocked map without stuck input',()=>{
 class Element {
  constructor(){this.handlers={};this.style={};this.classList={add(){},remove(){}};this.children={};}
  querySelector(s){return this.children[s]??=new Element();}
  setAttribute(){}append(){}setPointerCapture(id){this.captured=id;}
  getBoundingClientRect(){return {left:0,top:0,width:132,height:132};}
  addEventListener(type,fn){(this.handlers[type]??=[]).push(fn);}
  fire(type,pointerId,x=66,y=66){for(const fn of this.handlers[type]||[])fn({pointerId,button:0,clientX:x,clientY:y,detail:1,preventDefault(){}});}
 }
 const original=globalThis.document,root=new Element();let calls=0;
 globalThis.document={createElement:()=>root,querySelector:()=>new Element()};
 try{
  const state=new TouchInput(),ui=mountMobileControls({state,action:()=>calls++,examine(){},active:()=>true});
  const w=new World(()=>0,{botCount:0,countdownSeconds:0});ui.update(w,false);
  const stick=root.querySelector('#touch-stick'),use=root.querySelector('#touch-use');
  stick.fire('pointerdown',1,112,66);use.fire('pointerdown',2);
  assert.equal(stick.captured,1);assert.equal(use.captured,2);assert.equal(calls,1);assert.equal(state.x,1);assert.equal(state.held,true);
  use.fire('lostpointercapture',2);assert.equal(state.held,false);assert.equal(state.x,1);
  stick.fire('pointercancel',1);assert.equal(state.x,0);
  stick.fire('pointerdown',3,20,66);use.fire('pointerdown',4);ui.update(w,true);
  assert.equal(state.enabled,false);assert.equal(state.held,false);assert.equal(state.x,0);assert.ok(root.hidden);
 }finally{globalThis.document=original;}
});
