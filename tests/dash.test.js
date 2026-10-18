import test from 'node:test';
import assert from 'node:assert/strict';
import {World,INLAND} from '../src/world.js';
import {damage} from '../src/combat.js';
const input={left:false,right:false,up:false,down:false,aim:{x:900,y:365},held:false};
const fresh=()=>new World(()=>0,{botCount:0,countdownSeconds:0});
test('active dash blocks damage and knockback, but recharge grants no invulnerability',()=>{
 const w=new World(()=>0,{botCount:1,countdownSeconds:0}),enemy=w.bots[0];
 w.dash({right:true});
 assert.equal(damage(w,w.player,200,enemy,0,300),false);
 assert.equal(w.player.health,100);assert.equal(w.player.vx,0);assert.equal(w.player.vy,0);
 w.update(.08,input);
 assert.equal(damage(w,w.player,200,enemy,0,300),false);
 w.update(.08,input);
 assert.equal(w.dashRemaining,0);assert.equal(w.dashCooldown,2);
 assert.equal(damage(w,w.player,20,enemy,0,100),true);
 assert.equal(w.player.health,80);assert.equal(w.player.vx,100);
});
test('dash moves in input direction, recharges for two seconds, and cannot repeat early',()=>{
 const w=fresh();assert.ok(w.dash({left:true}));assert.equal(w.dash(),false);
 w.update(.16,input);assert.equal(w.player.x,344);assert.equal(w.dashCooldown,2);
 w.update(1.99,input);assert.equal(w.dash(),false);w.update(.02,input);assert.ok(w.dash());
});
test('stationary dash follows aim; diagonal dash has the same distance',()=>{
 const w=fresh();w.player.angle=Math.PI/2;w.dash();w.update(.16,input);assert.equal(w.player.y,501);
 const diagonal=fresh();diagonal.dash({right:true,down:true});diagonal.update(.16,input);
 assert.ok(Math.abs(Math.hypot(diagonal.player.x-480,diagonal.player.y-365)-136)<1e-8);
});
test('dash obeys shoreline restriction and countdown/bite-wait locks',()=>{
 assert.equal(new World().dash(),false);
 const w=fresh();w.player.x=INLAND.left-5;w.cast({x:0,y:365});assert.equal(w.dash(),false);
 w.fishing.update(2,false);assert.ok(w.dash({right:true}));w.update(.16,input);
 assert.equal(w.player.x,INLAND.left);assert.equal(w.fishing.state,'reeling');assert.deepEqual(w.bobber,{x:0,y:365});
});
