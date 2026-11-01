import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {WORLD_DATA} from '../src/world-data.js';
import {AREAS,INTERIOR_AREAS} from '../src/wilds.js';
import {fromEditor,toEditor,formatWorldData} from '../scripts/world-editor.mjs';
const areas=Object.fromEntries(Object.entries(AREAS).filter(([k])=>!INTERIOR_AREAS.includes(k)));

test('the world editor round-trips the shipped world data without changing a line',async()=>{
 const notes=[],again=fromEditor(toEditor(WORLD_DATA),areas,notes);
 assert.deepEqual(notes,[]);
 assert.equal(formatWorldData(again),await readFile(new URL('../src/world-data.js',import.meta.url),'utf8'));
});

test('editor exports drop what the game cannot use instead of shipping it',()=>{
 const docs=toEditor(WORLD_DATA),notes=[];
 docs.spawnSlots.push({id:'nowhere-slot',areaId:'nowhere',habitat:'land',x:1,y:1},{id:'odd-slot',areaId:'landing',habitat:'lava',x:1,y:1},{id:'far-slot',areaId:'landing',habitat:'land',x:1e6,y:-50});
 docs.npcs.push({id:'ghost',name:'Ghost',areaId:'nowhere',x:0,y:0});
 docs.spawnAreas.find(a=>a.id==='landing').tables.land.dragon=0;
 const out=fromEditor(docs,areas,notes);
 assert.ok(!out.spawnSlots.some(s=>['nowhere-slot','odd-slot'].includes(s.id)));
 assert.deepEqual(out.spawnSlots.find(s=>s.id==='far-slot'),{id:'far-slot',areaId:'landing',habitat:'land',x:AREAS.landing.width,y:0});
 assert.ok(!out.npcs.some(n=>n.id==='ghost'));assert.ok(!('dragon' in out.spawnAreas.landing.tables.land));
 assert.equal(notes.length,3);
});
