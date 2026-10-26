import test from 'node:test';
import assert from 'node:assert/strict';
import {Fishing,ITEMS} from '../src/fishing.js';
import {World,LAND,INLAND} from '../src/world.js';
test('loot is sampled only upon completion; tracking can land a catch',()=>{
 let calls=0;const f=new Fishing(()=>{calls++;return .99;},{sardinesOnly:false});f.cast();assert.equal(calls,1);assert.equal(f.result,null);
 for(let i=0;i<400;i++)f.update(1/120,false);
 assert.equal(f.state,'reeling');assert.equal(calls,1);
 for(let i=0;i<4000&&f.state==='reeling';i++){const predicted=f.bar+f.velocity*.2;f.update(1/120,predicted+.135<f.target);}
 assert.equal(f.state,'caught');assert.equal(f.result,ITEMS.at(-1));assert.equal(calls,2);
});
test('missed contact loses the catch without awarding an item',()=>{const f=new Fishing(()=>0);f.cast();for(let i=0;i<2400;i++)f.update(1/120,false);assert.equal(f.state,'escaped');assert.equal(f.result,null);});
test('cast requires shore and water aim; bite waiting locks movement; cancel restores it immediately',()=>{
 const w=new World(()=>0,{botCount:0,countdownSeconds:0}),input={right:true,left:false,up:false,down:false,aim:{x:0,y:365},held:false};
 assert.equal(w.cast(input.aim),false);w.player.x=LAND.left+25;
 assert.equal(w.cast({x:600,y:365}),false);assert.equal(w.cast(input.aim),true);
 const x=w.player.x;w.update(1/120,input);assert.equal(w.player.x,x);w.cancel();w.update(1/120,input);assert.ok(w.player.x>x);assert.equal(w.bobber,null);assert.equal(w.fishing.result,null);
});

test('reeling permits shoreline movement, blocks inland movement, and keeps the bobber anchored',()=>{
 const w=new World(()=>0,{botCount:0,countdownSeconds:0});
 w.player.x=INLAND.left-5;w.player.y=365;
 const input={right:true,left:false,up:false,down:false,aim:{x:20,y:365},held:false};
 assert.equal(w.cast(input.aim),true);
 w.fishing.update(2,false);
 assert.equal(w.fishing.state,'reeling');
 const bobber={...w.bobber};
 w.update(.1,input);
 assert.equal(w.player.x,INLAND.left);
 input.right=false;input.up=true;
 w.update(.1,input);assert.ok(w.player.y<365);
 assert.deepEqual(w.bobber,bobber);
 w.cancel();input.up=false;input.right=true;
 w.update(.1,input);assert.ok(w.player.x>INLAND.left);
});

test('all four inner shoreline edges block crossing and corners allow sliding',()=>{
 const w=new World(Math.random,{botCount:0,countdownSeconds:0});
 for(const [x,y,dx,dy,expectedX,expectedY] of [
  [INLAND.left-1,365,50,0,INLAND.left,365],
  [INLAND.right+1,365,-50,0,INLAND.right,365],
  [480,INLAND.top-1,0,50,480,INLAND.top],
  [400,INLAND.bottom+1,0,-50,400,INLAND.bottom],
  [INLAND.left-1,INLAND.top-1,20,20,INLAND.left+19,INLAND.top]
 ]){w.player.x=x;w.player.y=y;w.move(dx,dy,true);assert.equal(w.player.x,expectedX);assert.equal(w.player.y,expectedY);}
});
test('bar physics stays bounded and independent of frame subdivision at fixed simulation step',()=>{const f=new Fishing(()=>0);f.cast();f.update(2,false);for(let i=0;i<300;i++){f.update(1/120,true);assert.ok(f.bar>=0&&f.bar<=.73);}assert.equal(f.result,null);});

test('casts land at the chosen water point at different distances and stay there as aim moves',()=>{
 const w=new World(()=>0,{botCount:0,countdownSeconds:0});w.player.x=LAND.left+25;
 for(const target of [{x:145,y:365},{x:25,y:310},{x:900,y:50}]){
   const aim={...target};
   assert.equal(w.cast(aim),true);
   assert.deepEqual(w.bobber,target);
   aim.x=480;aim.y=365;
   assert.deepEqual(w.bobber,target);
   w.cancel();
 }
 assert.equal(w.cast({x:170,y:365}),false);
});


