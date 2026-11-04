import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,INTERIOR_AREAS,walkable,transitionAt} from '../src/wilds.js';
import {BUILT_DEFS,DELTA,LAND_FIELDS} from '../src/delta-areas.js';
import {defineArea} from '../src/atlas-area.js';
import {shippedLand,fromEditor} from '../scripts/land-editor.mjs';

const ids=['windchime','crossroads','village','village-port','village-market','village-farm','marsh'];
test('all outdoor maps publish editable atlas land and preserve their protected story footprints',()=>{
 const land=shippedLand();for(const a of Object.values(AREAS).filter(a=>!INTERIOR_AREAS.includes(a.id))){assert.ok(a.atlas,a.id);assert.ok(land.areas[a.id],a.id);}
 for(const id of ids){assert.ok(land.areas[id].fixedFeatures.length,id);assert.ok(walkable(AREAS[id].spawn.x,AREAS[id].spawn.y,id));}
});
test('every former custom map accepts real terrain edits through the shipment exporter',()=>{
 for(const id of ids){
  const d=structuredClone(shippedLand().areas[id]),base=BUILT_DEFS.find(d=>d.id===id),p=[(d.frame[0]+d.frame[1])/2,(d.frame[2]+d.frame[3])/2];
  d.shapes.push(['water','ellipse',p,3,3]);const notes=[],edit=fromEditor([{id,def:JSON.stringify(d)}],notes)[id],merged={...base};
  for(const k of LAND_FIELDS)if(Object.hasOwn(edit,k))merged[k]=edit[k];const built=defineArea(merged),[x,y]=built.toWorld(p);
  assert.deepEqual(notes,[],id);assert.ok(built.water(x,y)<0,id);assert.ok(DELTA[id]);
 }
});
test('protected chapter structures prevent unsafe map resizing',()=>{
 for(const id of ids){const d=structuredClone(shippedLand().areas[id]);d.size[0]+=100;assert.throws(()=>fromEditor([{id,def:JSON.stringify(d)}]),/resizing is unavailable/);}
});
test('the formerly one-way village lanes now connect back to their originating maps',()=>{
 for(const [id,x,y,target]of [['village',680,-4,'forest-edge'],['village-market',850,1404,'stonefall']]){
  const next=transitionAt(x,y,id);assert.equal(next.areaId,target);assert.ok(walkable(next.x,next.y,target));assert.ok(AREAS[target].exits.some(e=>e.target===id));
 }
});
