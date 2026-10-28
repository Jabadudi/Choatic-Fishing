import test from 'node:test';
import assert from 'node:assert/strict';
import {Hub,nicknameProblem,readPresence,readPosition,AFK_AFTER,HUB_SEND_INTERVAL,HUB_SMOOTHING} from '../src/hub.js';
import {render} from '../src/renderer.js';
import {World} from '../src/world.js';

// An in-memory stand-in for the Realtime Database paths in hub-backend.js, shared by several players.
class FakeRealtime{
 constructor(){this.presence={};this.pos={};this.nicknames={};this.profiles={};this.watchers={presence:new Set()};this.writes=0;}
 for(uid){const db=this;return {
  async profile(id){return db.profiles[id]||null;},
  async claimNick(id,nick,old,online){if(db.nicknames[nick.toLowerCase()]&&db.nicknames[nick.toLowerCase()]!==id)throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});if(old)delete db.nicknames[old.toLowerCase()];db.nicknames[nick.toLowerCase()]=id;db.profiles[id]={nick};if(online)db.setPresence(id,{...db.presence[id],n:nick});},
  async join(id,p){db.setPresence(id,{...p});},
  async updatePresence(id,patch){db.setPresence(id,{...db.presence[id],...patch});},
  async changeArea(id,from,to,pose){if(from)db.setPos(from,id,null);db.setPresence(id,{...db.presence[id],a:to});if(pose)db.setPos(to,id,pose);},
  async leaveArea(id,area){db.setPos(area,id,null);},
  async sendPosition(id,area,pose){db.writes++;db.setPos(area,id,pose);},
  watchPresence(cb){db.watchers.presence.add(cb);for(const [id,p] of Object.entries(db.presence))cb(id,p);return ()=>db.watchers.presence.delete(cb);},
  watchArea(area,cb){const set=db.watchers[area]??=new Set();set.add(cb);for(const [id,p] of Object.entries(db.pos[area]||{}))cb(id,p);return ()=>set.delete(cb);},
  async leave(id,area){if(area)db.setPos(area,id,null);db.setPresence(id,null);}
 };}
 setPresence(id,value){if(value)this.presence[id]=value;else delete this.presence[id];for(const cb of this.watchers.presence)cb(id,value);}
 setPos(area,id,value){const room=this.pos[area]??={};if(value)room[id]=value;else delete room[id];for(const cb of this.watchers[area]||[])cb(id,value);}
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
 const db=new FakeRealtime();let clock=0;
 const make=uid=>{const hub=new Hub({backend:Promise.resolve(db.for(uid)),now:()=>clock});return hub;};
 return {db,make,tick:s=>{clock+=s;},get clock(){return clock;}};
}
const journey=(areaId,x,y,facing='down')=>({adventure:true,areaId,elapsed:0,player:{x,y,facing}});
async function online(hub,uid,nick){await hub.setUser({uid});await hub.setNick(nick);await hub.goOnline();}

test('nicknames are short, plain and never a story character or staff title',()=>{
 assert.equal(nicknameProblem('Reedling'),'');
 assert.equal(nicknameProblem('a_9'),'');
 for(const bad of ['ab','9lives','has space','toolongnicknamehere','Eli','ADMIN','<b>x</b>'])assert.notEqual(nicknameProblem(bad),'',bad);
});

test('other players’ data is checked before use',()=>{
 assert.deepEqual(readPresence({n:'Kestrel',a:'village',afk:true}),{nick:'Kestrel',areaId:'village',afk:true});
 assert.equal(readPresence({n:'Kestrel',a:'the-moon'}),null);
 assert.equal(readPresence({n:'<script>',a:'village'}),null);
 assert.deepEqual(readPosition({x:-50,y:99999,f:'l',w:true},'village').x,0);
 assert.equal(readPosition({x:'1',y:2},'village'),null);
 assert.equal(readPosition({x:1,y:2,f:'?'},'village').facing,'down');
});

test('signing in leads to picking a unique nickname before going online',async()=>{
 const {make}=setup(),a=make('ua'),b=make('ub');
 assert.equal(a.state,'signed-out');
 await a.goOnline();assert.equal(a.state,'signed-out','nobody goes online without Google sign-in');
 await a.setUser({uid:'ua'});assert.equal(a.state,'needs-nick');
 await a.goOnline();assert.equal(a.state,'needs-nick');
 await a.setNick('Reedling');assert.equal(a.state,'offline');
 await b.setUser({uid:'ub'});
 await assert.rejects(b.setNick('reedling'),/taken/);
 await assert.rejects(b.setNick('Eli'),/reserved/);
 await b.setNick('Kestrel');assert.equal(b.nick,'Kestrel');
});

test('players in the same area see each other; other areas only show on the list',async()=>{
 const {make,tick}=setup(),a=make('ua'),b=make('ub'),c=make('uc');
 await online(a,'ua','Reedling');await online(b,'ub','Kestrel');await online(c,'uc','Wren');
 a.sync(journey('village',300,400));b.sync(journey('village',500,410,'left'));c.sync(journey('marsh',100,100));await settle();
 const seen=a.others(journey('village',300,400));
 assert.deepEqual(seen.map(o=>[o.name,o.x,o.y,o.facing]),[['Kestrel',500,410,'left']]);
 assert.equal(seen[0].spriteId,'eli');
 assert.deepEqual(a.roster().map(p=>[p.nick,p.area,p.me]),[['Reedling','Willowback Village',true],['Kestrel','Willowback Village',false],['Wren','Shellback Marsh',false]]);
 // Wren walks into the village and appears; Kestrel walks out and disappears.
 tick(1);c.sync(journey('village',600,600));b.sync(journey('crossroads',50,50));await settle();
 assert.deepEqual(a.others(journey('village',300,400)).map(o=>o.name),['Wren']);
 assert.equal(b.others(journey('crossroads',50,50)).length,0);
});

test('positions go out a few times a second while moving, once more on stopping, and arrive smoothed',async()=>{
 const {db,make,tick}=setup(),a=make('ua'),b=make('ub');
 await online(a,'ua','Reedling');await online(b,'ub','Kestrel');
 a.sync(journey('village',300,400));b.sync(journey('village',500,400));await settle();
 const before=db.writes;
 for(let i=0;i<60;i++){tick(1/60);b.sync(journey('village',500+i,400));}
 const sent=db.writes-before;
 assert.ok(sent>=3&&sent<=Math.ceil(1/HUB_SEND_INTERVAL)+1,`about four updates a second, got ${sent}`);
 assert.equal(db.pos.village.ub.w,true);
 tick(HUB_SEND_INTERVAL);b.sync(journey('village',559,400));tick(HUB_SEND_INTERVAL);b.sync(journey('village',559,400));
 assert.equal(db.pos.village.ub.w,false,'stopping sends a final standing pose');
 const count=db.writes;for(let i=0;i<30;i++){tick(1/60);b.sync(journey('village',559,400));}
 assert.equal(db.writes,count,'standing still sends nothing');
 // A jump in position is eased over a fraction of a second rather than snapped.
 tick(1);b.sync(journey('village',700,400));await settle();
 const mid=a.others(journey('village',300,400))[0].x;
 assert.ok(mid<700&&mid>=559,`mid-way ${mid}`);
 tick(HUB_SMOOTHING+.01);assert.equal(a.others(journey('village',300,400))[0].x,700);
});

test('indoors and on the title screen a player is listed but not drawn',async()=>{
 const {db,make}=setup(),a=make('ua'),b=make('ub');
 await online(a,'ua','Reedling');await online(b,'ub','Kestrel');
 a.sync(journey('village',300,400));b.sync(journey('cabin',100,100));await settle();
 assert.equal(db.pos.cabin,undefined,'no position is shared inside a room');
 assert.equal(a.others(journey('village',300,400)).length,0);
 assert.match(a.roster()[1].area,/Cabin/);
 b.sync(journey('village',320,400));await settle();assert.equal(a.others(journey('village',300,400)).length,1);
 b.sync(null);await settle();assert.equal(a.others(journey('village',300,400)).length,0);
});

test('a player turns AFK after five idle minutes or by choice, and moving brings them back',async()=>{
 const {db,make,tick}=setup(),a=make('ua');
 await online(a,'ua','Reedling');a.sync(journey('village',300,400));
 tick(AFK_AFTER-1);a.sync(journey('village',300,400));assert.equal(a.afk,false);
 tick(2);a.sync(journey('village',300,400));assert.equal(a.afk,true);await settle();assert.equal(db.presence.ua.afk,true);
 tick(1);a.sync(journey('village',320,400));assert.equal(a.afk,false);await settle();assert.equal(db.presence.ua.afk,false);
 a.setAfk(true);tick(1);a.sync(journey('village',320,400));assert.equal(a.afk,true);await settle();assert.equal(db.presence.ua.afk,true);
});

test('renaming while online updates everyone, and going offline or signing out removes the player',async()=>{
 const {db,make}=setup(),a=make('ua'),b=make('ub');
 await online(a,'ua','Reedling');await online(b,'ub','Kestrel');
 a.sync(journey('village',300,400));b.sync(journey('village',500,400));await settle();
 await b.setNick('Kestrel2');await settle();
 assert.equal(a.others(journey('village',300,400))[0].name,'Kestrel2');
 assert.equal(db.nicknames.kestrel,undefined,'the old name is released');
 await b.goOffline();await settle();
 assert.equal(a.others(journey('village',300,400)).length,0);assert.equal(a.roster().length,1);
 assert.equal(b.wantOnline,false);
 await a.setUser(null);assert.equal(a.state,'signed-out');assert.equal(db.presence.ua,undefined);
});

test('other players are drawn with the scenery and wear a name tag',()=>{
 const world=new World(()=>0,{adventure:true,story:true});world.areaId='village';Object.assign(world.player,{x:500,y:500});
 const texts=[],ctx=new Proxy({fillText(text){texts.push(text);},measureText:text=>({width:text.length*6})},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});
 render(ctx,world,undefined,{others:[{remote:true,spriteId:'eli',name:'Kestrel',x:540,y:500,facing:'left',angle:0},{remote:true,spriteId:'eli',name:'Wren',afk:true,x:460,y:520,facing:'down',angle:0}]});
 assert.ok(texts.includes('Kestrel'));assert.ok(texts.includes('Wren · away'));
});
