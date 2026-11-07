import test from 'node:test';import assert from 'node:assert/strict';
import {validateTexturePack,textureAsset,texturePackName} from '../src/texture-packs.js';
const pack=assets=>({format:'the-wilds-texture-pack',version:1,name:'Test pack',assets});const png='data:image/png;base64,aGVsbG8=';
test('partial texture packs preserve only artwork and leave input untouched',()=>{const source=pack({'ground/forest-floor.webp':png});const value=validateTexturePack(source);assert.equal(value.assets['ground/forest-floor.webp'],png);assert.equal(value.health,undefined);assert.equal(source.assets['ground/forest-floor.webp'],png);});
test('packs reject remote files, scripts, unsafe paths and incompatible versions',()=>{for(const assets of [{'../x.png':png},{'x.png':'https://example.com/x.png'},{'x.svg':'data:image/svg+xml;base64,abcd'},{'/x.png':png}])assert.throws(()=>validateTexturePack(pack(assets)));assert.throws(()=>validateTexturePack({...pack({}),version:2}));});
test('default artwork is available without browser APIs',()=>{assert.equal(textureAsset('anything.png','original'),'original');assert.equal(texturePackName(),'Default artwork');});
test('pack validation enforces size and image count limits',()=>{assert.throws(()=>validateTexturePack(pack(Object.fromEntries(Array.from({length:513},(_,i)=>[`${i}.png`,png])))));assert.throws(()=>validateTexturePack(pack({'large.png':'data:image/png;base64,'+'A'.repeat(12000001)})));});
test('installation is atomic, switching notifies renderers and reset restores default artwork',async()=>{
 const {installTexturePack,resetTexturePack,onTexturePackChange}=await import('../src/texture-packs.js');const oldDB=globalThis.indexedDB,oldImage=globalThis.Image;let fail=false,changes=0;
 globalThis.Image=class{naturalWidth=32;naturalHeight=32;async decode(){}};
 globalThis.indexedDB={open(){const r={};queueMicrotask(()=>{r.result={close(){},transaction(){const tx={objectStore:()=>({put(){queueMicrotask(()=>{if(fail){tx.error=Error('Disk full');tx.onerror();}else tx.oncomplete();});}})};return tx;}};r.onsuccess();});return r;}};
 const unsubscribe=onTexturePackChange(()=>changes++);
 try{await installTexturePack(pack({'ground/forest-floor.webp':png}));assert.equal(textureAsset('ground/forest-floor.webp','default'),png);assert.equal(textureAsset('other','default'),'default');assert.equal(changes,1);fail=true;await assert.rejects(installTexturePack({...pack({}),name:'Failed pack'}),/Disk full/);assert.equal(texturePackName(),'Test pack');assert.equal(changes,1);fail=false;await resetTexturePack();assert.equal(textureAsset('ground/forest-floor.webp','default'),'default');assert.equal(changes,2);}finally{unsubscribe();globalThis.indexedDB=oldDB;globalThis.Image=oldImage;}
});

test('packs cannot replace combat effects, projectiles, UI, or animation and gameplay definitions',()=>{for(const path of ['core/wave.svg','story/eli-sabre-sheet.png','ui/panel.png','projectiles/arrow.png'])assert.throws(()=>validateTexturePack(pack({[path]:png})),/not packable/);for(const field of ['animations','health','frameSize','scale'])assert.throws(()=>validateTexturePack({...pack({}),[field]:{}}),/only replace artwork/);});
