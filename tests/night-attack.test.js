import test from 'node:test';import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {World} from '../src/world.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {updateStoryAction,nightAttackActors,storyActionElapsed,NIGHT_ATTACK} from '../src/story-action.js';
const stormWorld=()=>{const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='night-attack';w.areaId='cabin';Object.assign(w.player,{x:435,y:330});Object.assign(w.story,{stage:'storm',scene:'storm',page:2,lureSeen:true,photoSeen:true});return w;};
const run=(w,until)=>{let n=0;while(!until()&&n++<6000)updateStoryAction(w,1/60);assert.ok(n<6000);};
const byId=(w,id)=>nightAttackActors(w).find(a=>a.spriteId===id);
test('the walker appears 20 feet left of Eli, closes to 10 feet, and Moonfang strikes from behind it',()=>{
 const w=stormWorld();assert.deepEqual(nightAttackActors(w),[]);
 run(w,()=>w.areaId==='landing');updateStoryAction(w,1/60);
 const spawn=byId(w,'nightwalker'),feet=NIGHT_ATTACK.foot;assert.ok(spawn&&!byId(w,'moonfang-charge'));
 assert.ok(spawn.x<w.player.x);assert.ok(Math.abs(Math.hypot(w.player.x-spawn.x,w.player.y-spawn.y)/feet-20)<1);
 const eliStart=w.player.x;run(w,()=>w.story.page===3);assert.ok(w.player.x>eliStart+100,'Eli flees along the shore');
 run(w,()=>w.story.page===4);updateStoryAction(w,1/60);
 const walker=byId(w,'nightwalker'),gap=Math.hypot(w.player.x-walker.x,w.player.y-walker.y)/feet;assert.ok(gap>9&&gap<11,`gap ${gap}`);
 const wolf=byId(w,'moonfang-charge');assert.equal(wolf.state,'run');assert.ok(wolf.x<walker.x,'Moonfang comes from behind the walker');assert.equal(wolf.facingX,1);
 run(w,()=>storyActionElapsed(w)>=NIGHT_ATTACK.charge+NIGHT_ATTACK.leap+.05);assert.equal(byId(w,'nightwalker').state,'death');
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
