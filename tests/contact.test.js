import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {SLOTS} from '../src/spawn-tables.js';
import {createCreature} from '../src/spawns.js';
import {CONTACT,contactDamage} from '../src/contact.js';

const idle=w=>({left:false,right:false,up:false,down:false,held:false,aim:{x:w.player.x+1,y:w.player.y}});
function setup(species='shadow-walker'){
 const w=new World(()=>.5,{adventure:true});w.journeyId='contact-test';w.spawns=null;w.rabbits=[];
 const a=createCreature(SLOTS['landing-east'],species,{id:'mob'});a.health=a.maxHealth=10000;w.wildlife=[a];
 Object.assign(w.player,{x:a.x+8,y:a.y,angle:0});return {w,a};
}

test('walking into a monster costs a quarter of its swing, then waits out a short cooldown',()=>{
 const {w,a}=setup(),start=w.player.health;
 assert.equal(contactDamage(a),Math.round(a.attackDamage*CONTACT.share));assert.ok(contactDamage(a)<a.attackDamage);
 w.update(1/60,idle(w));const after=w.player.health;assert.ok(Math.abs(after-(start-contactDamage(a)))<.1,`${after}`);
 // Still touching: no second bump until the cooldown runs out.
 Object.assign(w.player,{x:a.x+8,y:a.y});w.update(1/60,idle(w));assert.ok(w.player.health>=after);
});

test('a dash slips through, and calm or knocked-down animals do not hurt',()=>{
 const dash=setup();dash.w.player.dashRemaining=.2;const h=dash.w.player.health;dash.w.update(1/60,idle(dash.w));assert.ok(dash.w.player.health>=h);
 const down=setup();down.a.downRemaining=2;const h2=down.w.player.health;down.w.update(1/60,idle(down.w));assert.ok(down.w.player.health>=h2);
 const deer=setup('deer');const h3=deer.w.player.health;deer.w.update(1/60,idle(deer.w));assert.ok(deer.w.player.health>=h3,'a calm deer is harmless');
});
