import test from 'node:test';
import assert from 'node:assert/strict';
import {shinyNotice,otherNotices} from '../src/notices.js';

test('the shiny notice is pulled out of the message for the middle of the screen',()=>{
 assert.equal(shinyNotice('Deer hunted · +10 Hunting XP · Something glimmers in Windchime Path…'),'Something glimmers in Windchime Path…');
 assert.equal(shinyNotice("Grandpa's fishing rod is on the weapon rack inside the cabin."),'');
 assert.equal(shinyNotice(undefined),'');
});

test('the bottom notice line keeps story text but leaves out XP and items gained',()=>{
 assert.equal(otherNotices("Grandpa's fishing rod is on the weapon rack inside the cabin. · +1 Wishstone"),"Grandpa's fishing rod is on the weapon rack inside the cabin.");
 assert.equal(otherNotices('Deer hunted · +10 Hunting XP · Dropped Venison, Deer Hide · Something glimmers in Windchime Path…'),'Deer hunted');
 assert.equal(otherNotices('Shadow Walker defeated · +40 Hunting XP · Hunting level 3!'),'Shadow Walker defeated · Hunting level 3!');
 assert.equal(otherNotices('Sardine caught! · +5 Fishing XP · 3 reed marks tangled in the line · A Wishstone came up on the hook'),'');
 assert.equal(otherNotices('Two Sardines caught! +5 Fishing XP · Bring one to Mara.'),'Bring one to Mara.');
 assert.equal(otherNotices('Sardine caught! Swift Fins: +10% speed · +5 Fishing XP'),'Swift Fins: +10% speed');
 assert.equal(otherNotices('Picked up Venison.'),'');
 assert.equal(otherNotices('Dropped Venison. Examine it nearby to pick it up.'),'Dropped Venison. Examine it nearby to pick it up.');
 assert.equal(otherNotices(undefined),'');
});
