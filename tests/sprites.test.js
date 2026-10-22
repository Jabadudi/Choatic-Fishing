import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {SPRITES} from '../src/sprite-definitions.js';
import {drawSprite,drawEntitySprite,frameIndex,frameRect,clearSpriteCache} from '../src/sprites.js';
import {createNpcs,drawNpc} from '../src/npcs.js';
import {releaseFingerprint} from '../build-version.mjs';

function fakeCanvas(){const ops=[];return {ops,ctx:new Proxy({drawImage(...a){ops.push(['image',...a]);},translate(...a){ops.push(['translate',...a]);},scale(...a){ops.push(['scale',...a]);}},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)})};}
function withImages(fn){
 const original=globalThis.Image;let loads=0;
 globalThis.Image=class {constructor(){loads++;this.complete=true;this.naturalWidth=256;this.naturalHeight=256;}set src(v){this.url=v;}};
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
