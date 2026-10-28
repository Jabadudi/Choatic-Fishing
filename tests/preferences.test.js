import test from 'node:test';
import assert from 'node:assert/strict';
import {existsSync} from 'node:fs';
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
test('cursor choice is kept, unknown styles fall back to the system pointer',async()=>{
 const {CURSOR_STYLES,cursorValue}=await import('../src/cursors.js');
 assert.equal(normalizePreferences({cursor:'hook'}).cursor,'hook');
 assert.equal(normalizePreferences({cursor:'url(evil)'}).cursor,'system');
 assert.equal(cursorValue('system'),'');
 for(const c of CURSOR_STYLES.filter(c=>c.id!=='system')){
  const [x,y]=c.hotspot;assert.ok(x>=0&&x<32&&y>=0&&y<32,c.id);assert.ok(existsSync(new URL(`../${c.art}`,import.meta.url)),c.art);
  assert.match(cursorValue(c.id),new RegExp(`^url\\("assets/cursors/${c.id}\\.png"\\) ${x} ${y}, url\\("data:image/svg\\+xml,[^"]+"\\) ${x} ${y}, auto$`));
 }
});
test('UI size is clamped to the slider range in 5% steps and kept across reloads',()=>{
 assert.equal(DEFAULT_PREFERENCES.uiScale,1);
 assert.equal(normalizePreferences({uiScale:9}).uiScale,1.5);
 assert.equal(normalizePreferences({uiScale:.1}).uiScale,.7);
 assert.equal(normalizePreferences({uiScale:1.13}).uiScale,1.15);
 assert.equal(normalizePreferences({uiScale:'big'}).uiScale,1);
 assert.equal(normalizePreferences({uiScale:NaN}).uiScale,1);
 const data=new Map(),storage={getItem:k=>data.get(k),setItem:(k,v)=>data.set(k,v)};
 createPreferenceStore(storage).set({uiScale:1.25});assert.equal(createPreferenceStore(storage).value.uiScale,1.25);
});
