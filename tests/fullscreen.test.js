import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {screenSupport,enterLandscape,leaveFullscreen,isFullscreen} from '../src/fullscreen.js';

const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
function fakeScreen({fullscreenApi=true,lockRejects=false}={}){
 const calls=[],doc={fullscreenElement:null,fullscreenEnabled:fullscreenApi,documentElement:{}};
 if(fullscreenApi){doc.documentElement.requestFullscreen=async()=>{calls.push('request');doc.fullscreenElement=doc.documentElement;};doc.exitFullscreen=async()=>{calls.push('exit');doc.fullscreenElement=null;};}
 const win={screen:{orientation:{lock:async o=>{calls.push(`lock ${o}`);if(lockRejects)throw new Error('NotSupportedError');},unlock(){calls.push('unlock');}}},matchMedia:()=>({matches:false})};
 return {doc,win,calls};
}

test('Android Chrome reports full screen and orientation lock; iPhone Safari reports neither full screen nor install',()=>{
 const android=fakeScreen(),iphone=fakeScreen({fullscreenApi:false});
 assert.deepEqual(screenSupport({doc:android.doc,win:android.win,nav:{userAgent:ANDROID}}),{ios:false,standalone:false,fullscreen:true,orientationLock:true});
 const ios=screenSupport({doc:iphone.doc,win:iphone.win,nav:{userAgent:IPHONE}});
 assert.equal(ios.ios,true);assert.equal(ios.fullscreen,false);assert.equal(ios.standalone,false);
 assert.equal(screenSupport({doc:iphone.doc,win:iphone.win,nav:{userAgent:IPHONE,standalone:true}}).standalone,true);
 assert.equal(screenSupport({doc:iphone.doc,win:iphone.win,nav:{userAgent:'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)',maxTouchPoints:5}}).ios,true);
});

test('landscape play enters full screen before locking, and survives browsers that refuse the lock',async()=>{
 const android=fakeScreen();
 assert.deepEqual(await enterLandscape({doc:android.doc,win:android.win}),{fullscreen:true,locked:true});
 assert.deepEqual(android.calls,['request','lock landscape']);assert.ok(isFullscreen(android.doc));
 await leaveFullscreen({doc:android.doc,win:android.win});assert.deepEqual(android.calls.slice(2),['unlock','exit']);assert.equal(isFullscreen(android.doc),false);
 const desktop=fakeScreen({lockRejects:true});
 assert.deepEqual(await enterLandscape({doc:desktop.doc,win:desktop.win}),{fullscreen:true,locked:false});
 const keyboard=fakeScreen();
 assert.deepEqual(await enterLandscape({doc:keyboard.doc,win:keyboard.win,landscape:false}),{fullscreen:true,locked:false});assert.deepEqual(keyboard.calls,['request']);
 const iphone=fakeScreen({fullscreenApi:false});
 assert.deepEqual(await enterLandscape({doc:iphone.doc,win:iphone.win}),{fullscreen:false,locked:false});assert.deepEqual(iphone.calls,[]);
});

test('the web app manifest installs as a landscape full screen game with relative paths for GitHub Pages',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../manifest.webmanifest',import.meta.url),'utf8'));
 assert.equal(manifest.display,'fullscreen');assert.equal(manifest.orientation,'landscape');
 assert.equal(manifest.start_url,'./');assert.equal(manifest.scope,'./');
 for(const icon of manifest.icons)assert.ok(!icon.src.startsWith('/'),icon.src);
 assert.ok(manifest.icons.some(icon=>icon.sizes==='512x512')&&manifest.icons.some(icon=>icon.sizes==='192x192'));
 const html=await readFile(new URL('../index.html',import.meta.url),'utf8');
 assert.match(html,/rel="manifest" href="manifest.webmanifest"/);assert.match(html,/apple-mobile-web-app-capable/);assert.match(html,/href="landscape.css"/);
});
