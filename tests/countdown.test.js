import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
const input={left:false,right:true,up:false,down:false,aim:{x:0,y:365},held:true};

test('one opponent and five-second countdown freeze both players before a simultaneous start',()=>{
 const w=new World(()=>0);
 assert.equal(w.bots.length,1);assert.equal(w.countdownRemaining,5);
 w.player.x=180;
 const start=w.actors.map(a=>({x:a.x,y:a.y,health:a.health}));
 assert.equal(w.cast(input.aim),false);assert.equal(w.useItem(),false);
 for(let i=0;i<599;i++)w.update(1/120,input);
 assert.equal(w.matchState,'countdown');assert.equal(w.elapsed,0);
 assert.deepEqual(w.actors.map(a=>({x:a.x,y:a.y,health:a.health})),start);
 assert.ok(w.actors.every(a=>a.fishing.state==='idle'));
 w.update(1/120,input);assert.equal(w.matchState,'playing');assert.equal(w.countdownRemaining,0);
 w.update(1/120,input);assert.ok(w.player.x>180);assert.equal(w.bots[0].fishing.state,'waiting');
 assert.equal(new World().countdownRemaining,5);
});
