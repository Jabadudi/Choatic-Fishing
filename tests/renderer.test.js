import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {render} from '../src/renderer.js';

test('fresh defeat and special effects render without negative geometry',()=>{
 const world=new World(()=>0,{botCount:0,countdownSeconds:0});
 const ctx=new Proxy({arc(x,y,r){assert.ok(r>=0);},ellipse(x,y,rx,ry){assert.ok(rx>=0&&ry>=0);}},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});
 world.effects=[{name:'defeat',life:.8,x:0,y:0,angle:0},{name:'Whirlpool Burst',life:.8,x:0,y:0,angle:0},{name:'explosion',life:.55,x:0,y:0,angle:0}];
 render(ctx,world);
});

