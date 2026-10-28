import test from 'node:test';
import assert from 'node:assert/strict';
import {World} from '../src/world.js';
import {captureSave} from '../src/save-format.js';
import {CloudSync,planSync,describeSave,deviceLabel,CLOUD_UPLOAD_INTERVAL} from '../src/cloud-save.js';
const journey=(id='journey-a',savedAt=1000,elapsed=0)=>{const w=new World(()=>.1,{adventure:true});w.journeyId=id;w.elapsed=elapsed;return captureSave(w,'auto',savedAt);};
class FakeBackend{
 constructor(){this.docs={};this.writes=0;this.listener=null;}
 onUser(callback){this.listener=callback;}
 async signIn(){this.listener({uid:'u1',name:'Netanel Tester',photo:''});}
 async signOut(){this.listener(null);}
 async read(uid){return this.docs[uid]?JSON.parse(JSON.stringify(this.docs[uid])):null;}
 async write(uid,data){if(this.fail){this.fail=false;throw Error('offline');}this.writes++;this.docs[uid]={...this.docs[uid],...data};}
}
async function signedIn(options={}){
 const backend=new FakeBackend();let clock=options.now??100000;
 const cloud=new CloudSync({backend:Promise.resolve(backend),now:()=>clock,device:'Test · Browser'});
 await cloud.start();await cloud.signIn();
 return {cloud,backend,tick:ms=>{clock+=ms;}};
}

test('sync plan uploads, downloads, skips or asks the player',()=>{
 const a=journey('journey-a',1000),later=journey('journey-a',5000,600),other=journey('journey-b',9000,60);
 assert.equal(planSync(null,null),'none');
 assert.equal(planSync(a,null),'upload');
 assert.equal(planSync(null,a),'download');
 assert.equal(planSync(a,{...a,savedAt:7000}),'none','identical progress needs nothing');
 assert.equal(planSync(later,a),'upload','newer save of the same journey goes up');
 assert.equal(planSync(a,later),'choose','cloud played further on another device');
 assert.equal(planSync(later,other),'choose','a different journey is never overwritten silently');
});

test('save summary shows level, play time and date; device label names the system and browser',()=>{
 const text=describeSave(journey('journey-a',Date.UTC(2026,9,28),3*3600+12*60));
 assert.match(text,/^Level \d+ · 3h 12m played · saved /);
 assert.equal(deviceLabel({userAgent:'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 Version/18.0 Mobile/15E148 Safari/604.1'}),'iPhone · Safari');
 assert.equal(deviceLabel({userAgent:'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/130.0 Safari/537.36'}),'Windows · Chrome');
});

test('uploads are throttled to once a minute, forced saves go straight up',async()=>{
 const {cloud,backend,tick}=await signedIn();
 assert.equal(await cloud.queue(journey('journey-a',1),true),true);assert.equal(backend.writes,1);
 assert.equal(await cloud.queue(journey('journey-a',2)),false,'waits for the interval');assert.equal(backend.writes,1);
 tick(CLOUD_UPLOAD_INTERVAL);assert.equal(await cloud.queue(journey('journey-a',3)),true);assert.equal(backend.writes,2);
 assert.equal(JSON.parse(backend.docs.u1.current).savedAt,3);assert.equal(backend.docs.u1.device,'Test · Browser');
 assert.equal(cloud.state,'synced');
});

test('a failed upload is kept and retried, and nothing uploads when signed out',async()=>{
 const {cloud,backend}=await signedIn();
 backend.fail=true;assert.equal(await cloud.queue(journey('journey-a',10),true),false);assert.equal(cloud.state,'offline');
 assert.equal(await cloud.flush(),true);assert.equal(JSON.parse(backend.docs.u1.current).savedAt,10);
 await cloud.signOut();assert.equal(cloud.state,'signed-out');
 assert.equal(await cloud.queue(journey('journey-a',20),true),false);assert.equal(JSON.parse(backend.docs.u1.current).savedAt,10);
});

test('replacing a different cloud journey sets the old one aside',async()=>{
 const {cloud,backend}=await signedIn();
 await cloud.queue(journey('journey-a',10),true);
 await cloud.fetch();await cloud.queue(journey('journey-b',20),true);
 assert.equal(JSON.parse(backend.docs.u1.current).journeyId,'journey-b');assert.equal(JSON.parse(backend.docs.u1.previous).journeyId,'journey-a');
 await cloud.keepAside(journey('journey-c',30));assert.equal(JSON.parse(backend.docs.u1.previous).journeyId,'journey-c');
});

test('a corrupted cloud save is rejected before it can be loaded',async()=>{
 const {cloud,backend}=await signedIn();
 backend.docs.u1={current:'{"format":"something-else"}'};
 await assert.rejects(()=>cloud.fetch());
 backend.docs.u1={current:JSON.stringify(journey('journey-a',42))};
 assert.equal((await cloud.fetch()).save.savedAt,42);
});
