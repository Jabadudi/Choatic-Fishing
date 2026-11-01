import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {gameScale} from '../src/mobile.js';
import {walkable,isWater,transitionAt,drawWilds,drawDepthSorted,paintAtlas,shorePoints,clearTerrainCache,placesFor,AREAS} from '../src/wilds.js';
import {VILLAGE,VILLAGE_ROADS,VILLAGE_BUILDINGS} from '../src/village.js';
import {PORT,onPortDeck,onPortStairs,STAIRS,GREAT_PIER,PORT_DOCK} from '../src/village-districts.js';
import {captureSave,restoreSave} from '../src/save-format.js';
const fresh=()=>new World(()=>.1,{adventure:true});
// Every place in an area can be walked to from where Eli comes in.
function reachable(id,start){
 const queue=[[Math.round(start.x/10)*10,Math.round(start.y/10)*10]],seen=new Set([queue[0].join()]),reached=new Set(),area=AREAS[id];
 for(let at=0;at<queue.length;at++){
  const [x,y]=queue[at];for(const place of placesFor(id))if(Math.hypot(x-place.x,y-place.y)<60)reached.add(place.id);
  for(const [dx,dy] of [[20,0],[-20,0],[0,20],[0,-20]]){const nx=x+dx,ny=y+dy,key=`${nx},${ny}`;if(nx<20||nx>area.width-20||ny<20||ny>area.height-20||seen.has(key)||!walkable(nx,ny,id))continue;seen.add(key);queue.push([nx,ny]);}
 }
 return reached;
}
test('the crossroads road west reaches the farm, and the farm road leads back east',()=>{
 const w=fresh();w.areaId='crossroads';Object.assign(w.player,{x:4,y:460});w.inventory.receive({name:'Sardine'});w.quests['mara-sardine'].status='active';
 w.move(-12,0,false);assert.equal(w.areaId,'village-farm');assert.ok(walkable(w.player.x,w.player.y,'village-farm'));
 Object.assign(w.player,{x:1996,y:830});w.move(12,0,false);assert.equal(w.areaId,'crossroads');assert.equal(w.player.y,460);assert.ok(walkable(w.player.x,w.player.y,'crossroads'));
 assert.equal(w.inventory.allItems[0].name,'Sardine');assert.equal(w.quests['mara-sardine'].status,'active');
 assert.equal(transitionAt(-1,250,'crossroads'),null);
});
test('Town Square lanes are continuous, buildings are solid, and every landmark can be walked to',()=>{
 for(const road of VILLAGE_ROADS)for(let i=1;i<road.length;i++)for(let j=0;j<=100;j++){
  const t=j/100,x=road[i-1][0]+(road[i][0]-road[i-1][0])*t,y=road[i-1][1]+(road[i][1]-road[i-1][1])*t;
  if(y<30||y>VILLAGE.height-30)continue;
  assert.ok(walkable(x,y,'village'),`blocked lane: ${x},${y}`);
 }
 for(const b of VILLAGE_BUILDINGS){assert.equal(walkable(b.x,b.y-30,'village'),false,b.id);assert.ok(walkable(b.x,b.y+55,'village'),`${b.id} door`);}
 assert.equal(reachable('village',VILLAGE.spawn).size,placesFor('village').length);
 // No water in the square: fishing is at the Port and on the farm's river.
 for(let x=40;x<1900;x+=60)for(let y=40;y<1140;y+=60)assert.equal(isWater(x,y,'village'),false);
 // The track north into the forest is closed for now.
 assert.equal(transitionAt(690,-4,'village'),null);
});
test('the Port: one stairway down the cliff to the dock, the Great Pier, and real casts into the lagoon',()=>{
 assert.equal(reachable('village-port',PORT.spawn).size,placesFor('village-port').length);
 // The cliff face is solid apart from the stairway, and the stairway is walkable all the way down.
 for(const x of [200,600,1200,1600])assert.equal(walkable(x,500,'village-port'),false,`cliff at ${x}`);
 for(const f of [STAIRS.one,STAIRS.two])for(let y=f.top+2;y<f.bottom;y+=4){const x=f.from+(f.to-f.from)*(y-f.top)/(f.bottom-f.top);assert.ok(onPortStairs(x,y));assert.ok(walkable(x,y,'village-port'),`stairs ${x},${y}`);}
 assert.ok(walkable(970,508,'village-port'),'the landing');
 // Water below the dock blocks walking; the dock, pier and jetties do not.
 assert.equal(isWater(900,800,'village-port'),true);assert.equal(walkable(900,720,'village-port'),false);
 const [[ax,ay],[bx,by]]=GREAT_PIER;for(let t=0;t<=1;t+=.05)assert.ok(walkable(ax+(bx-ax)*t,ay+(by-ay)*t,'village-port'),'the pier');
 const w=fresh();w.areaId='village-port';Object.assign(w.player,{x:bx-10,y:by-8});assert.ok(onPortDeck(w.player.x,w.player.y));
 assert.ok(w.cast({x:bx+60,y:by+80}));const bobber={...w.bobber};w.move(-20,0,true);assert.deepEqual(w.bobber,bobber);
 for(const points of Object.values(shorePoints('village-port',1,1)))for(const [x,y] of points)assert.equal(onPortDeck(x,y),false);
 // The only way out is the lane up to the square.
 assert.deepEqual(PORT.exits.map(e=>e.target),['village']);assert.equal(transitionAt(10,300,'village-port'),null);
 assert.ok(walkable(PORT_DOCK.left+20,PORT_DOCK.top+20,'village-port'));
});
test('Willowback rendering and maps draw the signs, shops and landmarks without missing palettes',()=>{
 const texts=[],c=new Proxy({fillText(t){texts.push(t);},measureText:t=>({width:t.length*7}),createLinearGradient:()=>({addColorStop(){}}),createRadialGradient:()=>({addColorStop(){}})},{get:(o,k)=>k in o?o[k]:()=>{},set:(o,k,v)=>(o[k]=v,true)});
 for(const id of ['village','village-port','village-market','village-farm']){
  const w=fresh();w.areaId=id;Object.assign(w.player,AREAS[id].spawn);const view={left:0,top:0,right:AREAS[id].width,bottom:AREAS[id].height};
  drawWilds(c,w,view);drawDepthSorted(c,w,view,[],()=>{});paintAtlas(c,800,600,w.player,new Set(),id);
 }
 for(const text of ['THE WILLOW HEARTH','THE CHIEF’S HOUSE','NET & NEEDLE','Willow Docks','The Great Pier','THE BLACKSMITH','THE OVEN DOOR','LOOM & SHUTTLE','WILLOWBACK','THE WATERMILL','THE BARN','The Training Grounds'])assert.ok(texts.includes(text),text);
 clearTerrainCache();
});
test('saves in the square keep the area, discoveries and dropped items',()=>{
 const w=fresh();w.journeyId='village-test';const old=captureSave(w);assert.equal(restoreSave(old).areaId,'landing');
 w.areaId='village';Object.assign(w.player,{x:1300,y:800});w.discovered.add('village-commons');w.inventory.receive({name:'Sardine'});w.backpackAction(w.inventory.allItems[0].id,'drop');
 const restored=restoreSave(captureSave(w));assert.equal(restored.areaId,'village');assert.equal(restored.player.x,1300);assert.equal(restored.player.y,800);assert.ok(restored.discovered.has('village-commons'));assert.equal(restored.drops[0].areaId,'village');
});
test('southern map padding keeps the player above portrait controls out on the Great Pier',()=>{
 const width=390,height=844,scale=gameScale(width,height,true);
 for(const y of [640,800,900]){
  const cameraY=Math.max(Math.min(0,height-PORT.height*scale),Math.min(0,height/2-y*scale));
  const screenY=y*scale+cameraY;assert.ok(screenY<height-300,`${y}`);assert.ok(screenY>200);
 }
});
