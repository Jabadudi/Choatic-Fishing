import test from 'node:test';
import assert from 'node:assert/strict';
import {ATLAS_PROP_ART,PROPS} from '../src/sprite-definitions.js';
import {PROP_SOLID,defineArea} from '../src/atlas-area.js';
import {fromEditor} from '../scripts/land-editor.mjs';
import {groundKind} from '../src/ground-textures.js';
import {drawAtlasProp} from '../src/atlas-area-art.js';

test('village looks and new ground materials survive shipment without deriving collision from art',()=>{
 const props=Object.entries(ATLAS_PROP_ART).flatMap(([kind,looks])=>Object.entries(looks).map(([art,[asset]])=>{assert.ok(PROPS[asset],asset);return {kind,art,at:[30,30]};}));
 const def={id:'harbor-test',num:'99',isNew:true,name:'Harbor test',frame:[0,100,0,100],size:[2000,2000],base:'land',ground:'decking',props,zones:['moss','leaves','pebbles','decking'].map(k=>[k,[[10,10],[20,10],[20,20]]]),textures:{decking:.5,moss:.75}};
 const notes=[],out=fromEditor([{id:def.id,def:JSON.stringify(def)}],notes)[def.id];
 assert.deepEqual(notes,[]);assert.deepEqual(out.props,props);assert.deepEqual(out.zones,def.zones);assert.deepEqual(out.textures,def.textures);
 for(const p of defineArea({...out,id:def.id}).props)assert.equal(p.r,PROP_SOLID[p.kind]);
 for(const zone of ['moss','leaves','pebbles','decking'])assert.equal(groundKind('harbor-test',{zone}),zone);
});

test('boat and lantern animation change drawing only and retain visible missing-art fallbacks',()=>{
 const calls=[],ctx=new Proxy({},{get:(_,key)=>(...args)=>calls.push([key,...args]),set:()=>true});
 const boat={kind:'boat',art:'moored-rowboat',x:100,y:100,r:0},before=structuredClone(boat);
 const original=Math.random;Math.random=()=>{throw Error('Rendering consumed gameplay randomness');};
 try{drawAtlasProp(ctx,boat,0);const first=calls.find(c=>c[0]==='translate');calls.length=0;drawAtlasProp(ctx,boat,1);assert.notDeepEqual(calls.find(c=>c[0]==='translate'),first);assert.deepEqual(boat,before);assert.ok(calls.some(c=>c[0]==='fill'),'boat fallback remains visible');
 calls.length=0;const lamp={kind:'lantern',art:'harbor-lantern',x:40,y:40};drawAtlasProp(ctx,lamp,1);assert.ok(calls.some(c=>c[0]==='fillRect'));assert.equal(lamp.y,40);
 }finally{Math.random=original;}
});

