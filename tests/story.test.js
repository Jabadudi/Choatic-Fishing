import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {neutralInput,applyAction} from '../src/protocol.js';
import {captureSave,restoreSave,importantProgress,SAVE_VERSION} from '../src/save-format.js';
import {currentScene,cabinDamaged,storyPrompt,restoreStory} from '../src/story.js';
import {walkable,transitionAt,sceneryAt} from '../src/wilds.js';
import {SPRITES} from '../src/sprite-definitions.js';
import {frameRect,frameIndex,greenMattePixel} from '../src/sprites.js';
import {readFileSync} from 'node:fs';
const fresh=()=>{const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='story-test';return w;};
const finish=w=>{const name=w.story.scene;while(w.story.scene===name)w.advanceStory();};
const go=(w,area,x,y)=>{w.areaId=area;Object.assign(w.player,{x,y});};
function prepareDinner(w){
 finish(w);go(w,'landing',1630,1560);assert.ok(w.inspect());assert.equal(w.areaId,'cabin');
 go(w,'cabin',520,150);w.inspect();finish(w);go(w,'cabin',110,270);w.inspect();finish(w);
 assert.equal(w.story.stage,'fish');
}
test('Chapter 1 flows from arrival through discoveries, dinner, rescue and a persistent changed shore',()=>{
 const w=fresh();assert.equal(w.player.name,'Eli');assert.equal(w.npcs.length,0);prepareDinner(w);
 go(w,'cabin',100,120);w.inspect();assert.equal(w.story.scene,null);assert.match(w.message,/Still needed: 2 Sardines, 3 Deer Meat/);
 for(let i=0;i<3;i++)w.inventory.receive({name:'Sardine'});for(let i=0;i<3;i++)w.inventory.receive({name:'Deer Meat'});
 w.inspect();assert.deepEqual(w.inventory.allItems.map(i=>i.name),['Sardine']);assert.equal(w.progression.skills.cooking.level,2);assert.equal(w.progression.totalXp,40);finish(w);assert.equal(w.story.stage,'rest');
 go(w,'cabin',435,330);assert.equal(storyPrompt(w),'Rest until night');w.inspect();assert.equal(w.story.scene,'storm');
 const saved=restoreSave(captureSave(w));assert.equal(saved.story.scene,'storm');assert.equal(saved.areaId,'cabin');
 finish(saved);assert.equal(saved.story.scene,'awakening');assert.ok(cabinDamaged(saved.story));assert.equal(saved.areaId,'landing');assert.equal(saved.npcs[0].id,'mara');
 finish(saved);assert.equal(saved.story.stage,'complete');assert.equal(saved.inventory.allItems.filter(i=>i.name==='Mysterious Lure').length,1);
 const restored=restoreSave(captureSave(saved));assert.ok(cabinDamaged(restored.story));assert.equal(restored.npcs[0].name,'The girl');assert.equal(restored.story.scene,null);
 go(restored,'landing',1730,1640);restored.inspect();finish(restored);assert.equal(restored.inventory.allItems.filter(i=>i.name==='Mysterious Lure').length,1);assert.equal(restored.progression.totalXp,40);
 const lure=restored.inventory.allItems.find(i=>i.name==='Mysterious Lure');assert.equal(restored.backpackAction(lure.id,'discard'),false);
});
test('story scenes freeze simulation and block input actions; save/resume preserves the exact page',()=>{
 const w=fresh(),before=captureSave(w);w.update(10,{...neutralInput(),right:true});assert.deepEqual(captureSave(w).state,before.state);
 assert.equal(applyAction(w,'player','dash',neutralInput()),false);assert.equal(w.inspect(),false);
 w.advanceStory();w.advanceStory();assert.equal(w.story.page,2);const restored=restoreSave(captureSave(w));assert.equal(currentScene(restored).title,'No service');
 assert.notEqual(importantProgress(restored),importantProgress(fresh()));
});
test('tutorial fishing supplies dinner without granting magical powers or timed upgrades',()=>{
 const w=fresh();prepareDinner(w);go(w,'landing',1250,1850);
 w.fishing.state='caught';w.fishing.result={name:'Anchor'};w.advanceFishing(w.player,0,false);
 assert.equal(w.inventory.allItems[0].name,'Sardine');assert.equal(w.progression.totalXp,30);assert.equal(w.progression.lastBuff,null);
 const remaining=w.progression.upgradeRemaining;w.update(1,neutralInput());assert.equal(w.progression.upgradeRemaining,remaining);
});
test('old exploration saves migrate deliberately without replaying the opening or changing existing quests',()=>{
 const w=new World(()=>.2,{adventure:true});w.journeyId='old';w.quests['mara-sardine'].status='complete';const old=captureSave(w);old.version=1;delete old.state.story;
 const restored=restoreSave(old);assert.equal(restored.story,null);assert.equal(restored.quests['mara-sardine'].status,'complete');assert.equal(captureSave(restored).version,SAVE_VERSION);
 const broken=captureSave(fresh());broken.state.story.page=100;assert.throws(()=>restoreSave(broken),/story/);
 assert.throws(()=>restoreStory({...fresh().story,stage:'storm',scene:null}),/story/);
});
test('cabin walls, interior furniture, entry and exit remain independent of artwork dimensions',()=>{
 assert.equal(walkable(1630,1430),false);assert.equal(walkable(1630,1560),true);assert.equal(walkable(320,395,'cabin'),true);
 assert.equal(walkable(500,300,'cabin'),false);assert.equal(walkable(435,330,'cabin'),true);
 assert.deepEqual(transitionAt(320,481,'cabin'),{areaId:'landing',x:1630,y:1570});
 for(let gx=20;gx<=25;gx++)for(let gy=18;gy<=23;gy++){const o=sceneryAt(gx,gy);if(o)assert.ok(o.x<1400||o.x>1930||o.y<1230||o.y>1760);}
});
test('Moonfang animation crops fit the supplied sheet and the matte removes green while retaining fur',()=>{
 const d=SPRITES.moonfang,png=readFileSync(new URL('../assets/'+d.asset,import.meta.url)),w=png.readUInt32BE(16),h=png.readUInt32BE(20);
 for(const clip of Object.values(d.animations))for(const i of clip.frames){const [x,y,fw,fh]=frameRect(d,i,w,h);assert.ok(x>=0&&y>=0&&x+fw<=w&&y+fh<=h);}
 assert.equal(frameIndex(d,'run',0),4);assert.equal(frameIndex(d,'unknown',0),0);
 assert.ok(greenMattePixel(0,255,0));assert.equal(greenMattePixel(150,165,180),false);
});
