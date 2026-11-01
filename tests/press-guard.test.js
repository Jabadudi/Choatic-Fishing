import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {keepsNativePress,installPressGuard} from '../src/press-guard.js';

const node=match=>({closest:sel=>sel.split(',').some(s=>s===match)?{}:null});

test('long-press menus are blocked on game art but kept for text fields',()=>{
 const handlers={};installPressGuard({addEventListener:(type,fn)=>{handlers[type]=fn;}});
 assert.deepEqual(Object.keys(handlers).sort(),['contextmenu','dragstart','selectstart']);
 let blocked=false;handlers.contextmenu({target:node('img'),preventDefault:()=>{blocked=true;}});
 assert.ok(blocked,'a held image does not open the share / save menu');
 blocked=false;handlers.contextmenu({target:node('input'),preventDefault:()=>{blocked=true;}});
 assert.ok(!blocked,'a text field keeps paste');
 assert.equal(keepsNativePress(null),false);
});

test('images and buttons never offer the iOS callout',()=>{
 const css=readFileSync(new URL('../style.css',import.meta.url),'utf8');
 assert.match(css,/img,button\{[^}]*-webkit-touch-callout:none/);
 assert.match(css,/-webkit-user-drag:none/);
});
