import test from 'node:test';import assert from 'node:assert/strict';
import {DEFAULT_BINDINGS,normalizeBindings,rebind,validBinding} from '../src/input-bindings.js';
import {createPreferenceStore} from '../src/preferences.js';
import {controlRows} from '../src/controls-help.js';
import {World} from '../src/world.js';import {SCENES,cabinDamaged} from '../src/story.js';
import {storyAction,updateStoryAction} from '../src/story-action.js';
import {captureSave,restoreSave} from '../src/save-format.js';
import {walkable} from '../src/wilds.js';
test('rebinding an occupied key swaps actions and survives storage normalization',()=>{
 const swapped=rebind(DEFAULT_BINDINGS,'inspect','KeyE');assert.equal(swapped.inspect,'KeyE');assert.equal(swapped.fish,'Space');
 assert.deepEqual(normalizeBindings(swapped),swapped);assert.equal(new Set(Object.values(swapped)).size,Object.keys(swapped).length);
 assert.equal(validBinding('Escape'),false);assert.equal(validBinding('F10'),false);assert.equal(validBinding('ControlLeft'),false);
 assert.deepEqual(normalizeBindings({inspect:'Invalid',left:'Escape'}),DEFAULT_BINDINGS);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)},store=createPreferenceStore(storage);store.set({keybinds:swapped});assert.deepEqual(createPreferenceStore(storage).value.keybinds,swapped);
});
test('Space interacts by default and older saved keys move from G to Space',()=>{
 assert.equal(DEFAULT_BINDINGS.inspect,'Space');assert.equal(DEFAULT_BINDINGS.backpack,'KeyB');assert.equal(DEFAULT_BINDINGS.help,'KeyH');assert.equal(Object.hasOwn(DEFAULT_BINDINGS,'reel'),false);
 const old={...DEFAULT_BINDINGS,inspect:'KeyG',reel:'Space'};delete old.help;
 assert.deepEqual(normalizeBindings(old),DEFAULT_BINDINGS);
 const custom=normalizeBindings({...old,inspect:'KeyX'});assert.equal(custom.inspect,'KeyX');assert.equal(new Set(Object.values(custom)).size,Object.keys(custom).length);
});
test('the Controls card follows the current keys',()=>{
 const rows=controlRows(DEFAULT_BINDINGS).flatMap(([,list])=>list),find=text=>rows.find(([,t])=>t.startsWith(text))?.[0];
 assert.equal(find('Talk, examine'),'Space');assert.equal(find('Use the equipped item'),'Left click');assert.equal(find('Backpack'),'B');assert.equal(find('This list'),'H');
 assert.equal(controlRows(rebind(DEFAULT_BINDINGS,'inspect','KeyE')).flatMap(([,list])=>list).find(([,t])=>t.startsWith('Talk'))[0],'E');
});
test('cooking has no photograph illustration',()=>assert.equal(SCENES.dinner[0].art,null));
test('scripted escape stays on land, exits cabin, finishes rescue and grants lure once',()=>{
 const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='action-test';w.areaId='cabin';Object.assign(w.player,{x:435,y:330});Object.assign(w.story,{stage:'storm',scene:'storm',page:4,lureSeen:true,photoSeen:true});assert.equal(storyAction(w),'escape');assert.ok(cabinDamaged(w.story));
 let steps=0,escaped=false;while(w.story.scene==='storm'&&steps++<3000){updateStoryAction(w,1/60);if(w.areaId==='landing')escaped=true;assert.ok(walkable(w.player.x,w.player.y,w.areaId));}
 assert.ok(steps<3000);assert.ok(escaped);assert.equal(w.story.scene,'awakening');assert.equal(w.inventory.allItems.filter(i=>i.name==='Mysterious Lure').length,1);
 updateStoryAction(w,1);assert.equal(w.inventory.allItems.filter(i=>i.name==='Mysterious Lure').length,1);
});
test('escape resumes from an existing save without changing the save contract',()=>{
 let w=new World(()=>.2,{adventure:true,story:true});w.journeyId='action-save';w.areaId='cabin';Object.assign(w.player,{x:435,y:330});Object.assign(w.story,{stage:'storm',scene:'storm',page:4,lureSeen:true,photoSeen:true});for(let i=0;i<100;i++)updateStoryAction(w,1/60);
 w=restoreSave(captureSave(w));assert.equal(w.npcs.length,0);let count=0;while(w.story.scene==='storm'&&count++<3000)updateStoryAction(w,1/60);assert.equal(w.story.scene,'awakening');assert.equal(w.inventory.allItems.filter(i=>i.name==='Mysterious Lure').length,1);
});


