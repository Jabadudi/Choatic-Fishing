import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {updateStoryAction,nightAttackActors,storyActionElapsed,NIGHT_ATTACK} from '../src/story-action.js';
const stormWorld=()=>{const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='night-attack';w.areaId='cabin';Object.assign(w.player,{x:435,y:330});Object.assign(w.story,{stage:'storm',scene:'storm',page:2,lureSeen:true,photoSeen:true});return w;};
const run=(w,until)=>{let n=0;while(!until()&&n++<6000)updateStoryAction(w,1/60);assert.ok(n<6000);};
const byId=(w,id)=>nightAttackActors(w).find(a=>a.spriteId===id);
test('the shadow walker waits in front of the cabin, closes on Eli and is defeated by Moonfang in story order',()=>{
 const w=stormWorld();assert.deepEqual(nightAttackActors(w),[]);
 run(w,()=>w.areaId==='landing');updateStoryAction(w,1/60);
 const porch=byId(w,'nightwalker');assert.ok(porch&&!byId(w,'moonfang-charge'));assert.ok(porch.x<w.player.x&&porch.y>1515);
 run(w,()=>w.story.page===3);const start=byId(w,'nightwalker');
 run(w,()=>storyActionElapsed(w)>=NIGHT_ATTACK.approach-.1);const close=byId(w,'nightwalker');
 assert.ok(w.player.x-close.x<w.player.x-start.x);assert.equal(close.state,'raise');assert.ok(!byId(w,'moonfang-charge'));
 run(w,()=>w.story.page===4);updateStoryAction(w,1/60);
 const wolf=byId(w,'moonfang-charge');assert.equal(wolf.state,'run');assert.ok(wolf.x>w.player.x);assert.equal(byId(w,'nightwalker').state,'raise');
 run(w,()=>storyActionElapsed(w)>=NIGHT_ATTACK.charge+NIGHT_ATTACK.leap+.1);
 assert.equal(byId(w,'nightwalker').state,'death');assert.ok(byId(w,'moonfang-charge').x<w.player.x);
 run(w,()=>w.story.page===5);assert.deepEqual(nightAttackActors(w),[]);
});
test('reading the night attack never advances the scene',()=>{
 const w=stormWorld();run(w,()=>w.story.page===4);for(let i=0;i<90;i++)updateStoryAction(w,1/60);
 const before=JSON.stringify(nightAttackActors(w)),t=storyActionElapsed(w);for(let i=0;i<10;i++)nightAttackActors(w);
 assert.equal(storyActionElapsed(w),t);assert.equal(JSON.stringify(nightAttackActors(w)),before);
});
test('cutscene sheets match their grid and every clip frame exists',()=>{
 for(const id of ['nightwalker','moonfang-charge']){
  const def=SPRITES[id],png=readFileSync(new URL(`../assets/${def.asset}`,import.meta.url)),width=png.readUInt32BE(16),height=png.readUInt32BE(20);
  const [cw,ch]=def.frameSize;assert.equal(width%cw,0);assert.equal(height%ch,0);assert.equal(width/cw,def.columns);
  const cells=def.columns*height/ch;for(const clip of Object.values(def.animations))for(const f of clip.frames)assert.ok(f<cells,`${id} frame ${f}`);
 }
});
