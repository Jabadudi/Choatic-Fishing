import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPRITES,PROPS,walkClips} from '../src/sprite-definitions.js';
import {existsSync} from 'node:fs';
import {drawSprite,drawEntitySprite,drawProp,frameIndex,frameRect,clearSpriteCache} from '../src/sprites.js';
import {createNpcs,drawNpc} from '../src/npcs.js';
import {releaseFingerprint} from '../build-version.mjs';

function fakeCanvas(){const ops=[];return {ops,ctx:new Proxy({drawImage(...a){ops.push(['image',...a]);},translate(...a){ops.push(['translate',...a]);},scale(...a){ops.push(['scale',...a]);}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)})};}
function withImages(fn,[width,height]=[256,256]){
 const original=globalThis.Image;let loads=0;
 globalThis.Image=class {constructor(){loads++;this.complete=true;this.naturalWidth=width;this.naturalHeight=height;}set src(v){this.url=v;}};
 clearSpriteCache();try{fn(()=>loads);}finally{globalThis.Image=original;clearSpriteCache();}
}
test('animation clips support directions, state fallback and nonlooping final poses',()=>{
 const d={animations:{idle:{frames:[1,2],fps:2},'walk:north':{frames:[4,5,6],fps:10},death:{frames:[7,8],fps:4,loop:false}}};
 assert.equal(frameIndex(d,'idle',.5),2);assert.equal(frameIndex(d,'walk',.2,{direction:'north'}),6);
 assert.equal(frameIndex(d,'missing',0),1);assert.equal(frameIndex(d,'death',20),8);
 assert.equal(frameIndex(d,'death',.25,{duration:1}),7);
});
test('regular grids and irregular sheet crops both align to a stable ground anchor',()=>withImages(()=>{
 const d={asset:'test-grid.png',frameSize:[64,64],columns:4,scale:.5,anchor:[.5,1],offset:[2,14],animations:{idle:{frames:[5]}}},c=fakeCanvas();
 assert.deepEqual(frameRect(d,5,256,256),[64,64,64,64]);assert.ok(drawSprite(c.ctx,d,{x:100,y:200}));
 assert.deepEqual(c.ops.find(o=>o[0]==='translate'),['translate',102,214]);
 assert.deepEqual(c.ops.find(o=>o[0]==='image').slice(2),[64,64,64,64,-16,-32,32,32]);
 assert.deepEqual(frameRect({frames:[[10,20,30,40]]},0,256,256),[10,20,30,40]);
}));
test('images are shared between entities, mirrored visually and invalid crops keep the fallback',()=>withImages(loads=>{
 const c=fakeCanvas(),d={asset:'shared-test.png',frames:[[0,0,20,30]],scale:1};
 assert.ok(drawSprite(c.ctx,d));assert.ok(drawSprite(c.ctx,d,{x:40,flipX:true}));assert.equal(loads(),1);
 assert.ok(c.ops.some(o=>o[0]==='scale'&&o[1]===-1));
 const images=c.ops.filter(o=>o[0]==='image').length;
 assert.equal(drawSprite(c.ctx,{...d,frames:[[250,0,20,30]]}),false);
 assert.equal(drawSprite(c.ctx,{...d,scale:0}),false);assert.equal(drawEntitySprite(c.ctx,'unconfigured'),false);
 assert.equal(c.ops.filter(o=>o[0]==='image').length,images);
}));
test('replacing Mara artwork changes only drawing and preserves NPC state and interactions',()=>withImages(()=>{
 const n=createNpcs()[0],before=JSON.stringify(n),old=SPRITES.mara,c=fakeCanvas();
 try{
  SPRITES.mara={...old,asset:'new-mara.png',frameSize:[64,64],scale:.75};drawNpc(c.ctx,n,1);
  assert.ok(c.ops.some(o=>o[0]==='image'));assert.equal(JSON.stringify(n),before);
  assert.equal(n.greeting,'Hello!');assert.equal(n.x,1380);assert.equal(n.y,1810);
 }finally{SPRITES.mara=old;}
}));
test('missing or still-loading artwork returns control to the existing placeholder',()=>{
 const original=globalThis.Image,c=fakeCanvas();
 try{
  clearSpriteCache();globalThis.Image=class{constructor(){this.complete=false;this.naturalWidth=0;this.naturalHeight=0;}set src(v){}};
  assert.equal(drawSprite(c.ctx,{asset:'not-loaded.png'}),false);
  clearSpriteCache();globalThis.Image=class{constructor(){this.complete=true;this.naturalWidth=0;this.naturalHeight=0;}set src(v){}};
  assert.equal(drawSprite(c.ctx,{asset:'missing.png'}),false);assert.equal(c.ops.length,0);
 }finally{globalThis.Image=original;clearSpriteCache();}
});
test('replacing image bytes at the same filename changes the deployment cache version',()=>{
 const a=[['src/entity.js','same behaviour'],['assets/deer.png',Buffer.from([1,2,3])]],b=[['src/entity.js','same behaviour'],['assets/deer.png',Buffer.from([1,2,4])]];
 assert.notEqual(releaseFingerprint(a),releaseFingerprint(b));assert.equal(releaseFingerprint(a),releaseFingerprint([...a].reverse()));
});
test('deer and turtle sheets match their configured grids and every clip frame fits',()=>{
 for(const [id,w,h]of [['deer',256,256],['turtle',384,192]]){
  const d=SPRITES[id],png=readFileSync(new URL(`../assets/${d.asset}`,import.meta.url));
  assert.equal(png.toString('ascii',1,4),'PNG');assert.equal(png.readUInt32BE(16),w);assert.equal(png.readUInt32BE(20),h);
  for(const clip of Object.values(d.animations))for(const i of clip.frames){const [x,y,fw,fh]=frameRect(d,i,w,h);assert.ok(x+fw<=w&&y+fh<=h);}
 }
});
test('every furniture prop ships an image and fits its box from the bottom centre',()=>{
 for(const asset of Object.values(PROPS))assert.ok(existsSync(new URL(`../assets/${asset}`,import.meta.url)),asset);
 withImages(()=>{
  const c=fakeCanvas();assert.ok(drawProp(c.ctx,'well',{x:100,y:200,w:64,h:32}));
  assert.deepEqual(c.ops.find(o=>o[0]==='translate'),['translate',100,200]);
  assert.deepEqual(c.ops.find(o=>o[0]==='image').slice(2),[-16,-32,32,32]);
  assert.equal(drawProp(c.ctx,'not-a-prop',{x:0,y:0,w:10,h:10}),false);
 });
 assert.equal(drawProp(fakeCanvas().ctx,'well',{x:0,y:0,w:10,h:10}),false);
});
const eliPng=readFileSync(new URL(`../assets/${SPRITES.eli.asset}`,import.meta.url));
test('Eli walks in four directions from one sheet and borrows the right-facing stand when facing left',()=>withImages(()=>{
 const d=SPRITES.eli,w=eliPng.readUInt32BE(16),h=eliPng.readUInt32BE(20);
 assert.deepEqual([w,h],[d.frameSize[0]*8,d.frameSize[1]*5]);
 for(const clip of Object.values(d.animations))for(const i of clip.frames){const [x,y,fw,fh]=frameRect(d,i,w,h);assert.ok(x+fw<=w&&y+fh<=h);}
 for(const [dir,row] of [['right',0],['left',1],['down',2],['up',3]])assert.deepEqual(d.animations[`walk:${dir}`].frames,[0,1,2,3,4,5,6,7].map(i=>row*8+i));
 assert.equal(frameIndex(d,'walk',.1,{direction:'left'}),9);
 const draw=(state,direction)=>{const c=fakeCanvas();drawEntitySprite(c.ctx,'eli',{state,direction,facingX:direction==='left'?-1:1});return {flipped:c.ops.some(o=>o[0]==='scale'&&o[1]===-1),crop:c.ops.find(o=>o[0]==='image').slice(2,4)};};
 assert.deepEqual(draw('walk','left'),{flipped:false,crop:frameRect(d,8,w,h).slice(0,2)});
 assert.deepEqual(draw('idle','left'),{flipped:true,crop:frameRect(d,37,w,h).slice(0,2)});
 assert.deepEqual(draw('idle','right'),{flipped:false,crop:frameRect(d,37,w,h).slice(0,2)});
 assert.deepEqual(draw('throw','left'),{flipped:true,crop:frameRect(d,32,w,h).slice(0,2)});
},[eliPng.readUInt32BE(16),eliPng.readUInt32BE(20)]));
test('Chapter 6 walk sheets fill their grids, and every clip frame fits',()=>{
 for(const [id,rows] of [['mara-story',4],['emilia-story',4],['drayfus-story',5],['ocelot',5]]){
  const d=SPRITES[id],png=readFileSync(new URL(`../assets/${d.asset}`,import.meta.url)),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
  assert.deepEqual([w,h],[d.frameSize[0]*8,d.frameSize[1]*rows],id);
  for(const dir of ['right','left','down','up'])assert.ok(d.animations[`walk:${dir}`],`${id} walk:${dir}`);
  for(const clip of Object.values(d.animations))for(const i of clip.frames){const [x,y,fw,fh]=frameRect(d,i,w,h);assert.ok(x+fw<=w&&y+fh<=h,`${id} frame ${i}`);}
 }
});
test('story NPCs walk with the sheet row for the way they are heading',()=>withImages(()=>{
 const d=SPRITES['mara-story'],crop=n=>{const c=fakeCanvas();drawNpc(c.ctx,{spriteId:'mara-story',name:'Mara',x:0,y:0,...n},0);return c.ops.find(o=>o[0]==='image').slice(2,4);};
 assert.deepEqual(crop({animationState:'walk',direction:'up'}),frameRect(d,24,704,452).slice(0,2));
 assert.deepEqual(crop({animationState:'walk',facingX:-3}),frameRect(d,8,704,452).slice(0,2));
 assert.deepEqual(crop({}),frameRect(d,16,704,452).slice(0,2));
},[704,452]));
test('a 6-frame walk keeps the same stride pace as an 8-frame one',()=>{
 const six={animations:walkClips(6,.8)},eight={animations:walkClips(8,.8)};
 assert.deepEqual(six.animations['walk:left'].frames,[8,9,10,11,12,13]);assert.deepEqual(eight.animations['walk:up'].frames,[24,25,26,27,28,29,30,31]);
 // Halfway through the loop each sheet shows its halfway frame, and both loop back at the same moment.
 assert.equal(frameIndex(six,'walk',.4,{direction:'right'}),3);assert.equal(frameIndex(eight,'walk',.4,{direction:'right'}),4);
 assert.equal(frameIndex(six,'walk',.8,{direction:'right'}),0);assert.equal(frameIndex(eight,'walk',.8,{direction:'right'}),0);
 assert.deepEqual(walkClips([7,7,8,8],.8)['walk:left'].frames,[8,9,10,11,12,13,14]);
});
