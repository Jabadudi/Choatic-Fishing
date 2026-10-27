import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {snapshot,fromSnapshot} from '../src/protocol.js';
import {Presentation} from '../src/presentation.js';
import {Lobby} from '../src/lobby.js';
const make=()=>new World(Math.random,{humans:[{id:'host',name:'H'},{id:'guest',name:'G'}],countdownSeconds:0});
test('snapshot size stays bounded as catches accumulate and hydration reuses actors',()=>{
 const w=make(),before=JSON.stringify(snapshot(w)).length;
 w.player.catches=Array.from({length:1000},()=>({name:'Frying Pan',description:'historical loot'}));
 const data=snapshot(w);assert.ok(JSON.stringify(data).length-before<10);assert.equal(data.actors[0].catchCount,1000);assert.equal(data.actors[0].catches,undefined);
 const guest=fromSnapshot(data,'guest'),actor=guest.player;w.humans[1].health=42;
 assert.equal(fromSnapshot(snapshot(w),'guest',guest),guest);assert.equal(guest.player,actor);assert.equal(actor.health,42);
});
test('render interpolation smooths position without changing authoritative coordinates',()=>{
 const w=make(),p=new Presentation(),x=w.player.x;p.capture(w,100);w.player.x+=20;
 assert.equal(p.view(w,125).player.x,x+10);assert.equal(w.player.x,x+20);assert.equal(p.view(w,150).player.x,x+20);
 p.capture(w,150);w.player.x+=400;assert.equal(p.view(w,151).player.x,w.player.x);
});
test('congested realtime packets are dropped but discrete actions are delivered',()=>{
 const l=new Lobby(),sent=[],conn={open:true,bufferSize:0,dataChannel:{bufferedAmount:50000},send:data=>sent.push(data)};
 assert.equal(l.send(conn,{type:'state'}),false);assert.equal(l.send(conn,{type:'input'}),false);assert.equal(l.send(conn,{type:'action'}),true);assert.equal(sent.length,1);
 conn.dataChannel.bufferedAmount=0;assert.ok(l.send(conn,{type:'state'}));
});

import {walkable,LAND,LAKES,lakeDistance,DECOR} from '../src/terrain.js';
test('spatial collision lookup matches full scenery scan across the map',()=>{
 for(let x=140;x<1650;x+=17)for(let y=100;y<1250;y+=19){const expected=x>=LAND.left+15&&x<=LAND.right-15&&y>=LAND.top+15&&y<=LAND.bottom-15&&!LAKES.some(l=>lakeDistance(x,y,l)<15)&&!DECOR.some(o=>o.kind!=='bush'&&Math.hypot(x-o.x,y-o.y)<o.r+14);assert.equal(walkable(x,y),expected);}
});
import {MARSH_BOARDS,onMarshDeck,segmentDistance} from '../src/marsh.js';
test('boxed marsh boardwalk lookup matches checking every plank segment',()=>{
 const full=(x,y)=>MARSH_BOARDS.some(board=>board.points.some((point,i)=>i>0&&segmentDistance(x,y,board.points[i-1],point)<=board.width/2));
 for(let x=0;x<2400;x+=7)for(let y=0;y<2000;y+=9)assert.equal(onMarshDeck(x,y),full(x,y));
});
