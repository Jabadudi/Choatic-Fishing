import test from 'node:test';
import assert from 'node:assert/strict';
import {Hub,nicknameProblem,readPresence,readPosition,clean,AFK_AFTER,HUB_SEND_INTERVAL,HUB_SMOOTHING,MESSAGE_GAP} from '../src/hub.js';
import {runChat} from '../src/chat.js';
import {render} from '../src/renderer.js';
import {World} from '../src/world.js';

// An in-memory stand-in for the Realtime Database paths in hub-backend.js, shared by several players.
// Like the real rules, a player can only read a friend's presence and position.
class FakeRealtime{
 constructor(){this.data={presence:{},pos:{},friends:{},requests:{},profiles:{},nicknames:{},chat:{},dm:{}};this.ids=0;this.listeners=new Set();this.writes=0;}
 get(path){return path.split('/').reduce((node,key)=>node?.[key],this.data)??null;}
 put(path,value){const keys=path.split('/'),last=keys.pop();let node=this.data;for(const k of keys)node=node[k]??={};if(value===null)delete node[last];else node[last]=structuredClone(value);for(const l of [...this.listeners])l();}
 watch(reader,callback){let last;const check=()=>{const next=JSON.stringify(reader());if(next!==last){last=next;callback(JSON.parse(next));}};this.listeners.add(check);check();return ()=>this.listeners.delete(check);}
 children(path,callback){let seen={};const check=()=>{const now=this.get(path)||{};for(const [k,v] of Object.entries(now))if(JSON.stringify(seen[k])!==JSON.stringify(v))callback(k,v);for(const k of Object.keys(seen))if(!(k in now))callback(k,null);seen=structuredClone(now);};this.listeners.add(check);check();return ()=>this.listeners.delete(check);}
 for(uid){const db=this,friendOf=other=>other===uid||db.get(`friends/${other}/${uid}`)===true;return {
  async profile(id){return db.get(`profiles/${id}`);},
  async lookupNick(nick){return db.get(`nicknames/${nick.toLowerCase()}`);},
  async claimNick(id,nick,old,online){const owner=db.get(`nicknames/${nick.toLowerCase()}`);if(owner&&owner!==id)throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});if(old)db.put(`nicknames/${old.toLowerCase()}`,null);db.put(`nicknames/${nick.toLowerCase()}`,id);db.put(`profiles/${id}`,{nick});if(online)db.put(`presence/${id}/n`,nick);},
  async join(id,p){db.put(`presence/${id}`,p);},
  async updatePresence(id,patch){db.put(`presence/${id}`,{...db.get(`presence/${id}`),...patch});},
  async sendPosition(id,pose){db.writes++;db.put(`pos/${id}`,pose);},
  async leave(id){db.put(`pos/${id}`,null);db.put(`presence/${id}`,null);},
  watchFriends(id,cb){return db.children(`friends/${id}`,(k,v)=>cb(k,v===true));},
  watchRequests(id,cb){return db.children(`requests/${id}`,cb);},
  watchPresence(id,cb){return db.watch(()=>friendOf(id)?db.get(`presence/${id}`):null,cb);},
  watchPosition(id,cb){return db.watch(()=>friendOf(id)?db.get(`pos/${id}`):null,cb);},
  async request(from,to,nick){if(db.get(`friends/${to}/${from}`))throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});db.put(`requests/${to}/${from}`,{n:nick});},
  async answer(me,from,accept){if(accept){db.put(`friends/${me}/${from}`,true);db.put(`friends/${from}/${me}`,true);}db.put(`requests/${me}/${from}`,null);},
  async unfriend(me,other){db.put(`friends/${me}/${other}`,null);db.put(`friends/${other}/${me}`,null);},
  async say(id,nick,text){db.put(`chat/${id}/m${++db.ids}`,{n:nick,m:text,t:Date.now()});},
  async whisper(from,to,nick,text){if(db.get(`friends/${to}/${from}`)!==true)throw Object.assign(Error('permission_denied'),{code:'PERMISSION_DENIED'});db.put(`dm/${to}/d${++db.ids}`,{f:from,n:nick,m:text,t:Date.now()});},
  watchChat(id,since,cb){return db.children(`chat/${id}`,(k,v)=>{if(v&&friendOf(id)&&v.t>=since)cb(k,v);});},
  watchInbox(id,cb){return db.children(`dm/${id}`,(k,v)=>{if(v)cb(k,v);});},
  async clearInbox(id,key){db.put(`dm/${id}/${key}`,null);}
 };}
}
const settle=()=>new Promise(resolve=>setTimeout(resolve,0));
function setup(){
 const db=new FakeRealtime();let clock=0;
 const make=uid=>new Hub({backend:Promise.resolve(db.for(uid)),now:()=>clock});
 return {db,make,tick:s=>{clock+=s;}};
}
const journey=(areaId,x,y,facing='down')=>({adventure:true,areaId,elapsed:0,player:{x,y,facing}});
async function named(hub,uid,nick){await hub.setUser({uid});await hub.setNick(nick);}
async function befriend(a,b){await a.addByName(b.nick);await settle();await b.answer(a.user.uid,true);await settle();}

test('nicknames are short, plain and never a story character or staff title',()=>{
 assert.equal(nicknameProblem('Reedling'),'');
 assert.equal(nicknameProblem('a_9'),'');
 for(const bad of ['ab','9lives','has space','toolongnicknamehere','Eli','ADMIN','<b>x</b>'])assert.notEqual(nicknameProblem(bad),'',bad);
});

test('friends’ data is checked before use',()=>{
 assert.deepEqual(readPresence({n:'Kestrel',a:'village',afk:true}),{nick:'Kestrel',areaId:'village',afk:true});
 assert.equal(readPresence({n:'Kestrel',a:'the-moon'}),null);
 assert.equal(readPresence({n:'<script>',a:'village'}),null);
 assert.equal(readPosition({a:'village',x:-50,y:99999,f:'l',w:true}).x,0);
 assert.equal(readPosition({a:'village',x:'1',y:2}),null);
 assert.equal(readPosition({a:'nowhere',x:1,y:2}),null);
 assert.equal(readPosition({a:'village',x:1,y:2,f:'?'}).facing,'down');
});

test('signing in leads to picking a unique nickname',async()=>{
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

test('friendship is asked for by nickname and needs a yes',async()=>{
 const {db,make}=setup(),a=make('ua'),b=make('ub');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');
 await assert.rejects(a.addByName('Nobody'),/Nobody is called Nobody/);
 await assert.rejects(a.addByName('reedling'),/That’s you/);
 assert.equal(await a.addByName('kestrel'),'sent');await settle();
 assert.deepEqual([...b.requests.values()],[{uid:'ua',nick:'Reedling'}]);
 assert.equal(a.friends.size,0,'nothing is shared before Kestrel agrees');
 await b.answer('ua',true);await settle();
 assert.deepEqual([...a.friends.keys()],['ub']);assert.deepEqual([...b.friends.keys()],['ua']);
 assert.equal(b.requests.size,0);
 await assert.rejects(a.addByName('Kestrel'),/already your friend/);
 // Declining clears the request and makes no friends; asking someone who already asked you just accepts.
 const c=make('uc');await named(c,'uc','Wren');
 await c.addByName('Reedling');await settle();await a.answer('uc',false);await settle();
 assert.equal(a.friends.has('uc'),false);assert.equal(db.get('requests/ua/uc'),null);
 await c.addByName('Reedling');await settle();
 assert.equal(await a.addByName('Wren'),'accepted');await settle();
 assert.equal(a.friends.has('uc'),true);assert.equal(c.friends.has('ua'),true);
});

test('only friends see each other; strangers in the same place stay invisible',async()=>{
 const {make}=setup(),a=make('ua'),b=make('ub'),c=make('uc');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');await named(c,'uc','Stranger');
 await befriend(a,b);
 for(const hub of [a,b,c])await hub.goOnline();
 a.sync(journey('village',300,400));b.sync(journey('village',500,410,'left'));c.sync(journey('village',320,400));await settle();
 const seen=a.others(journey('village',300,400));
 assert.deepEqual(seen.map(o=>[o.name,o.x,o.y,o.facing]),[['Kestrel',500,410,'left']]);
 assert.equal(seen[0].spriteId,'eli');
 assert.deepEqual(c.others(journey('village',320,400)),[]);
 assert.deepEqual(a.roster().map(p=>[p.nick,p.online,p.area,p.me]),[['Reedling',true,'Willowback Village',true],['Kestrel',true,'Willowback Village',false]]);
});

test('friends in other areas are listed but not drawn, and appear when they walk in',async()=>{
 const {make,tick}=setup(),a=make('ua'),b=make('ub'),c=make('uc');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');await named(c,'uc','Wren');
 await befriend(a,b);await befriend(a,c);
 for(const hub of [a,b,c])await hub.goOnline();
 a.sync(journey('village',300,400));b.sync(journey('village',500,400));c.sync(journey('marsh',100,100));await settle();
 assert.deepEqual(a.others(journey('village',300,400)).map(o=>o.name),['Kestrel']);
 assert.deepEqual(a.roster().slice(1).map(p=>[p.nick,p.area]),[['Kestrel','Willowback Village'],['Wren','Shellback Marsh']]);
 tick(1);c.sync(journey('village',600,600));b.sync(journey('crossroads',50,50));await settle();
 assert.deepEqual(a.others(journey('village',300,400)).map(o=>o.name),['Wren']);
 assert.equal(b.others(journey('crossroads',50,50)).length,0);
});

test('positions go out a few times a second while moving, once more on stopping, and arrive smoothed',async()=>{
 const {db,make,tick}=setup(),a=make('ua'),b=make('ub');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');await befriend(a,b);await a.goOnline();await b.goOnline();
 a.sync(journey('village',300,400));b.sync(journey('village',500,400));await settle();
 const before=db.writes;
 for(let i=0;i<60;i++){tick(1/60);b.sync(journey('village',500+i,400));}
 const sent=db.writes-before;
 assert.ok(sent>=3&&sent<=Math.ceil(1/HUB_SEND_INTERVAL)+1,`about four updates a second, got ${sent}`);
 assert.equal(db.get('pos/ub/w'),true);
 for(let i=0;i<3;i++){tick(HUB_SEND_INTERVAL);b.sync(journey('village',559,400));}
 assert.equal(db.get('pos/ub/w'),false,'stopping sends a final standing pose');
 const count=db.writes;for(let i=0;i<30;i++){tick(1/60);b.sync(journey('village',559,400));}
 assert.equal(db.writes,count,'standing still sends nothing');
 tick(1);b.sync(journey('village',700,400));await settle();
 const mid=a.others(journey('village',300,400))[0].x;
 assert.ok(mid<700&&mid>=559,`mid-way ${mid}`);
 tick(HUB_SMOOTHING+.01);assert.equal(a.others(journey('village',300,400))[0].x,700);
});

test('indoors and on the title screen a friend is listed but not drawn',async()=>{
 const {db,make}=setup(),a=make('ua'),b=make('ub');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');await befriend(a,b);await a.goOnline();await b.goOnline();
 a.sync(journey('village',300,400));b.sync(journey('cabin',100,100));await settle();
 assert.equal(db.get('pos/ub'),null,'no position is shared inside a room');
 assert.equal(a.others(journey('village',300,400)).length,0);
 assert.match(a.roster()[1].area,/Cabin/);
 b.sync(journey('village',320,400));await settle();assert.equal(a.others(journey('village',300,400)).length,1);
 b.sync(null);await settle();assert.equal(a.others(journey('village',300,400)).length,0);
});

test('a player turns AFK after five idle minutes or by choice, and moving brings them back',async()=>{
 const {db,make,tick}=setup(),a=make('ua');
 await named(a,'ua','Reedling');await a.goOnline();a.sync(journey('village',300,400));
 tick(AFK_AFTER-1);a.sync(journey('village',300,400));assert.equal(a.afk,false);
 tick(2);a.sync(journey('village',300,400));assert.equal(a.afk,true);await settle();assert.equal(db.get('presence/ua/afk'),true);
 tick(1);a.sync(journey('village',320,400));assert.equal(a.afk,false);await settle();assert.equal(db.get('presence/ua/afk'),false);
 a.setAfk(true);tick(1);a.sync(journey('village',320,400));assert.equal(a.afk,true);
});

test('renaming reaches friends; removing a friend, going offline or signing out hides the player',async()=>{
 const {db,make}=setup(),a=make('ua'),b=make('ub');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');await befriend(a,b);await a.goOnline();await b.goOnline();
 a.sync(journey('village',300,400));b.sync(journey('village',500,400));await settle();
 await b.setNick('Kestrel2');await settle();
 assert.equal(a.others(journey('village',300,400))[0].name,'Kestrel2');
 assert.equal(db.get('nicknames/kestrel'),null,'the old name is released');
 await b.goOffline();await settle();
 assert.equal(a.others(journey('village',300,400)).length,0);
 assert.deepEqual(a.roster().map(p=>[p.nick,p.online]),[['Reedling',true],['Kestrel2',false]]);
 await b.goOnline();b.sync(journey('village',500,400));await settle();assert.equal(a.others(journey('village',300,400)).length,1);
 await a.unfriend('ub');await settle();
 assert.equal(a.others(journey('village',300,400)).length,0);assert.equal(b.friends.size,0,'removal is mutual');
 await a.setUser(null);assert.equal(a.state,'signed-out');assert.equal(db.get('presence/ua'),null);assert.deepEqual(a.roster(),[]);
});

test('friends are drawn with the scenery and wear a name tag',()=>{
 const world=new World(()=>0,{adventure:true,story:true});world.areaId='village';Object.assign(world.player,{x:500,y:500});
 const texts=[],ctx=new Proxy({fillText(text){texts.push(text);},measureText:text=>({width:text.length*6})},{get:(target,key)=>key in target?target[key]:()=>{},set:(target,key,value)=>{target[key]=value;return true;}});
 render(ctx,world,undefined,{others:[{remote:true,spriteId:'eli',name:'Kestrel',x:540,y:500,facing:'left',angle:0},{remote:true,spriteId:'eli',name:'Wren',afk:true,x:460,y:520,facing:'down',angle:0}]});
 assert.ok(texts.includes('Kestrel'));assert.ok(texts.includes('Wren · away'));
});

const lines=hub=>hub.log.map(l=>l.kind==='note'||l.kind==='error'?`${l.kind}: ${l.text}`:`${l.kind} ${l.nick}: ${l.text}`);
async function pair(){
 const {db,make,tick}=setup(),a=make('ua'),b=make('ub'),c=make('uc');
 await named(a,'ua','Reedling');await named(b,'ub','Kestrel');await named(c,'uc','Stranger');await befriend(a,b);
 for(const hub of [a,b,c])await hub.goOnline();
 return {db,a,b,c,tick};
}

test('chat reaches online friends only, and is cleaned first',async()=>{
 const {a,b,c,tick}=await pair();
 await runChat(a,'  hello   there  ');await settle();
 assert.deepEqual(lines(a),['chat Reedling: hello there']);
 assert.deepEqual(lines(b),['chat Reedling: hello there']);
 assert.deepEqual(lines(c),[],'a stranger hears nothing');
 tick(MESSAGE_GAP);await runChat(b,'you are a retard');await settle();
 assert.equal(a.log.at(-1).text,'you are a ******');
 assert.equal(clean('x'.repeat(500)).length,200);
 assert.equal(clean('line\nbreak\u0007'),'line break');
 await assert.rejects(runChat(b,'again'),/Slow down/);
});

test('private messages, replies and offline delivery',async()=>{
 const {db,a,b,c,tick}=await pair();
 await runChat(a,'/msg kestrel meet at the well');await settle();
 assert.deepEqual(lines(b),['from Reedling: meet at the well']);
 assert.deepEqual(db.get('dm/ub')??{},{},'shown messages leave the inbox');
 tick(1);await runChat(b,'/r on my way');await settle();
 assert.deepEqual(lines(a).slice(-1),['from Kestrel: on my way']);
 await assert.rejects(runChat(a,'/msg Stranger hi'),/not on your friends list/);
 await assert.rejects(runChat(c,'/msg Reedling hi'),/not on your friends list/);
 // Kestrel signs out; the message waits and arrives when they are back.
 await b.setUser(null);tick(1);await runChat(a,'/w Kestrel are you there?');await settle();
 assert.equal(Object.keys(db.get('dm/ub')).length,1,'waiting in the inbox');
 await b.setUser({uid:'ub'});await settle();
 assert.equal(b.log.at(-1).text,'are you there?');
});

test('chat commands manage friends, names, AFK and muting',async()=>{
 const {a,b,c,tick}=await pair();
 await runChat(a,'/list');assert.match(a.log.at(-1).text,/1 friend online: Kestrel \(/);
 await runChat(c,'/friend add Reedling');await settle();
 assert.match(c.log.at(-1).text,/Friend request sent to Reedling/);
 await runChat(a,'/friend accept stranger');await settle();
 assert.equal(a.friends.has('uc'),true);
 await runChat(a,'/friend list');assert.match(a.log.at(-1).text,/Friends: .*Kestrel.*Stranger/);
 await runChat(a,'/friend remove Stranger');await settle();assert.equal(c.friends.size,0);
 await runChat(a,'/afk');assert.equal(a.afk,true);await runChat(a,'/afk');assert.equal(a.afk,false);
 let saved=null;await runChat(a,'/mute Kestrel',{setMuted:list=>{saved=list;}});
 assert.deepEqual(saved,['ub']);
 await runChat(b,'can you hear me');await settle();
 assert.equal(a.log.some(l=>l.text==='can you hear me'),false,'muted friend is hidden');
 await runChat(a,'/unmute Kestrel');tick(1);await runChat(b,'now?');await settle();
 assert.equal(a.log.at(-1).text,'now?');
 tick(1);await runChat(a,'/nick Reed_2');assert.equal(a.nick,'Reed_2');
 await assert.rejects(runChat(a,'/dance'),/Unknown command \/dance/);
 await assert.rejects(runChat(a,'/msg Kestrel'),/Usage/);
 await runChat(a,'/offline');assert.equal(a.state,'offline');
 await assert.rejects(runChat(a,'anyone?'),/Go online/);
});
