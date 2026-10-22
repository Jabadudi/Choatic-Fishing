import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {render} from '../src/renderer.js';
import {sceneryAt,clearTerrainCache,canopyAlpha} from '../src/wilds.js';

// Records draw calls in order so tests can check what ends up on top.
function recorder(){
 const ops=[],grad={addColorStop(){}};
 const ctx=new Proxy({ops,
  ellipse(...a){ops.push(['ellipse',...a]);},drawImage(...a){ops.push(['drawImage',...a]);},
  createLinearGradient:()=>grad,createRadialGradient:()=>grad
 },{get:(t,k)=>k in t?t[k]:()=>{},set:(t,k,v)=>{if(k==='fillStyle')t.ops.push(['fill',v]);t[k]=v;return true;}});
 return ctx;
}
function withDocument(ctx,fn){
 const original=globalThis.document;
 try{globalThis.document={createElement:()=>({getContext:()=>ctx})};clearTerrainCache();return fn();}
 finally{globalThis.document=original;clearTerrainCache();}
}
function find(kind){for(let gy=4;gy<26;gy++)for(let gx=6;gx<30;gx++){const o=sceneryAt(gx,gy,'landing');if(o?.kind===kind)return {...o,gx,gy};}}
function scene(player){const w=new World(()=>0,{adventure:true});w.rabbits=[];Object.assign(w.player,player);return w;}
const viewAt=p=>({left:p.x-480,top:p.y-360,right:p.x+480,bottom:p.y+360});
const explorerAt=(ops,p)=>ops.findIndex(o=>o[0]==='ellipse'&&o[1]===Math.round(p.x)+5&&o[2]===Math.round(p.y)+14);
const crownAt=(ops,o)=>ops.findIndex(op=>op[0]==='drawImage'&&op.length===4&&Math.abs(op[2]-(Math.round(o.x)-48))<=2&&op[3]===Math.round(o.y)-100);

test('a tree in front of the player draws its canopy over them, one behind draws under them',()=>{
 const tree=find('tree');
 for(const [dy,front] of [[-40,true],[40,false]]){
  const ctx=recorder(),w=scene({x:tree.x+4,y:tree.y+dy});
  withDocument(ctx,()=>render(ctx,w,viewAt(w.player)));
  const player=explorerAt(ctx.ops,w.player),crown=crownAt(ctx.ops,tree);
  assert.ok(player>=0&&crown>=0,'both drawn');
  assert.equal(crown>player,front,front?'canopy over player':'player over canopy');
 }
});
test('a rock in front of the player is drawn again over them',()=>{
 const rock=find('rock'),ctx=recorder(),w=scene({x:rock.x+2,y:rock.y-30});
 withDocument(ctx,()=>render(ctx,w,viewAt(w.player)));
 const player=explorerAt(ctx.ops,w.player);
 assert.ok(player>=0);
 assert.ok(ctx.ops.slice(player).some(o=>o[0]==='fill'&&o[1]==='#575f59'),'rock face drawn after the player');
});
test('the canopy eases to 30% while the player is behind it and back when they leave',()=>{
 const tree=find('tree'),ctx=recorder(),w=scene({x:tree.x+4,y:tree.y-40});
 withDocument(ctx,()=>{
  render(ctx,w,viewAt(w.player));
  w.elapsed+=1/60;render(ctx,w,viewAt(w.player));
  assert.ok(canopyAlpha(tree.gx,tree.gy)>.8,'eases rather than snapping');
  for(let i=0;i<120;i++){w.elapsed+=1/60;render(ctx,w,viewAt(w.player));}
  assert.ok(Math.abs(canopyAlpha(tree.gx,tree.gy)-.3)<.02,'settles at 30%');
  w.player.y=tree.y+60;
  for(let i=0;i<120;i++){w.elapsed+=1/60;render(ctx,w,viewAt(w.player));}
  assert.ok(canopyAlpha(tree.gx,tree.gy)>.98,'restores when the player leaves');
 });
});
