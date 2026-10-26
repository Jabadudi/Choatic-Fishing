import test from 'node:test';
import assert from 'node:assert/strict';
import {createPreferenceStore,normalizePreferences,DEFAULT_PREFERENCES,channelVolume} from '../src/preferences.js';
import {cutscenePresentation} from '../src/cutscene-presentation.js';
test('preferences reject malformed fields and clamp channel levels independently',()=>{
 const p=normalizePreferences({musicVolume:2,sfxVolume:-1,musicMuted:'true',dialogueTheme:'arbitrary',injected:1});
 assert.deepEqual(p,{...DEFAULT_PREFERENCES,musicVolume:1,sfxVolume:0});
 assert.equal(channelVolume({...p,musicMuted:true},'music'),0);
 assert.equal(channelVolume({...p,sfxVolume:.8,musicMuted:true},'sfx'),.8);
});
test('settings survive reopening without touching journey saves',()=>{
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 const store=createPreferenceStore(storage);store.set({dialogueTheme:'quiet-hud',musicVolume:.14,sfxMuted:true});
 assert.deepEqual(createPreferenceStore(storage).value,store.value);assert.equal(data.size,1);
});
test('failed preference writes keep session changes and notify listeners',()=>{
 const store=createPreferenceStore({getItem:()=>'{bad',setItem:()=>{throw Error('quota');}});assert.ok(store.error);
 let observed;store.subscribe(p=>observed=p);store.set({dialogueTheme:'lantern-night'});
 assert.equal(observed.dialogueTheme,'lantern-night');assert.match(store.error,/session/);
});
test('cutscenes fade in, hold clear artwork three seconds, then dim before dialogue',()=>{
 assert.equal(cutscenePresentation(500).art,.5);
 for(const t of [1000,2000,3999]){const p=cutscenePresentation(t);assert.equal(p.darkness,0);assert.equal(p.dialogue,0);assert.equal(p.ready,false);}
 assert.equal(cutscenePresentation(4700).darkness,.43);
 assert.equal(cutscenePresentation(5400).dialogue,0);
 assert.equal(cutscenePresentation(5850).ready,true);assert.equal(cutscenePresentation(5850).darkness,.86);
 assert.equal(cutscenePresentation(0,false).ready,true);
});
