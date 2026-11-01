import test from 'node:test';
import assert from 'node:assert/strict';
import {AREAS,walkable,placesFor,transitionAt,EXAMINE_RANGE} from '../src/wilds.js';
import {DELTA} from '../src/delta-areas.js';
import {World} from '../src/world.js';

// Everything Eli can reach on foot from where he arrives, on a 16-unit grid.
function reach(id,start){
 const a=AREAS[id],S=16,cols=Math.ceil(a.width/S),rows=Math.ceil(a.height/S),seen=new Uint8Array(cols*rows),queue=[];
 const sx=Math.round(start.x/S),sy=Math.round(start.y/S);seen[sy*cols+sx]=1;queue.push([sx,sy]);
 while(queue.length){const [x,y]=queue.pop();for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cols||ny>=rows||seen[ny*cols+nx])continue;if(!walkable(nx*S,ny*S,id)||!walkable((x+nx)*S/2,(y+ny)*S/2,id))continue;seen[ny*cols+nx]=1;queue.push([nx,ny]);}}
 return (x,y,r)=>{for(let gy=Math.max(0,Math.floor((y-r)/S));gy<=Math.min(rows-1,Math.ceil((y+r)/S));gy++)for(let gx=Math.max(0,Math.floor((x-r)/S));gx<=Math.min(cols-1,Math.ceil((x+r)/S));gx++)if(seen[gy*cols+gx]&&Math.hypot(gx*S-x,gy*S-y)<=r)return true;return false;};
}
for(const id of Object.keys(DELTA))test(`${AREAS[id].name}: every landmark and exit can be reached on foot`,()=>{
 const a=AREAS[id],links=[...a.exits,...a.portals,...placesFor(id).filter(p=>p.travel).map(p=>p.travel)];assert.ok(links.length>0,'has a way in');
 for(const e of links){assert.ok(e.entry,`arrival in ${e.target}`);assert.ok(walkable(e.entry.x,e.entry.y,e.target),`entry into ${e.target} is walkable`);assert.equal(transitionAt(e.entry.x,e.entry.y,e.target),null,`arriving in ${e.target} does not bounce straight on`);}
 const reached=reach(id,a.spawn);
 for(const p of placesFor(id))assert.ok(reached(p.x,p.y,EXAMINE_RANGE),`${p.name} can be examined`);
 for(const q of a.portals)assert.ok(reached(q.x,q.y,q.r),`the way to ${q.target}`);
 for(const e of a.exits){const mid=(e.from+e.to)/2,x=e.edge==='west'?20:e.edge==='east'?a.width-20:mid,y=e.edge==='north'?20:e.edge==='south'?a.height-20:mid;assert.ok(reached(x,y,40),`exit to ${e.target}`);assert.equal(transitionAt(e.edge==='west'?-2:e.edge==='east'?a.width+2:mid,e.edge==='north'?-2:e.edge==='south'?a.height+2:mid,id)?.areaId,e.target);}
});
test('every exit into an atlas area has a way back',()=>{
 const ways=id=>[...AREAS[id].exits,...(AREAS[id].portals||[]),...placesFor(id).filter(p=>p.travel).map(p=>p.travel)];
 for(const a of Object.values(AREAS))for(const e of ways(a.id))if(DELTA[e.target])assert.ok(ways(e.target).some(b=>b.target===a.id),`${e.target} leads back to ${a.id}`);
});
test('Eli walks from Windchime Path into Chimewood and back',()=>{
 const w=new World(()=>.1,{adventure:true});w.areaId='windchime';Object.assign(w.player,{x:1590,y:400});w.move(20,0,false);
 assert.equal(w.areaId,'chimewood');assert.ok(walkable(w.player.x,w.player.y,'chimewood'));
 Object.assign(w.player,{x:10,y:120});w.move(-20,0,false);assert.equal(w.areaId,'windchime');
});
test('Eli walks west from the Landing into the Drowned Road, and rows from the pier to Arrival Bay',()=>{
 const w=new World(()=>.1,{adventure:true});w.areaId='landing';Object.assign(w.player,{x:10,y:1600});w.move(-20,0,false);
 assert.equal(w.areaId,'drowned-road');assert.ok(walkable(w.player.x,w.player.y,'drowned-road'));
 const pier=placesFor('landing').find(p=>p.id==='pier');assert.ok(walkable(pier.x,pier.y,'landing'));
 assert.equal(pier.travel.target,'arrival-bay');assert.ok(walkable(pier.travel.entry.x,pier.travel.entry.y,'arrival-bay'));
});
