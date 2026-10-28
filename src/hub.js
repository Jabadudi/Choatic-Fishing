import {AREAS,INTERIOR_AREAS} from './wilds.js';
// The shared world: signed-in players see their friends walking in whatever area they share.
// Friendship is mutual and asked for by nickname. Strangers never see each other; the database rules enforce that.
// Only presence is shared. Each player's story, animals, drops and progress stay in their own game.
export const HUB_SEND_INTERVAL=.25;
export const HUB_SMOOTHING=.3;
export const AFK_AFTER=300;
export const MAX_FRIENDS=50;
export const NICK_RULES='3 to 16 letters, numbers or _, starting with a letter.';
const NICK_PATTERN=/^[A-Za-z][A-Za-z0-9_]{2,15}$/;
// Names a player could use to pass as staff or as a story character.
const RESERVED=new Set(['admin','moderator','mod','server','system','eli','mara','grandpa','claude']);
const FACINGS={up:'u',down:'d',left:'l',right:'r'},FACING_NAMES={u:'up',d:'down',l:'left',r:'right'};

export function nicknameProblem(name){
 const value=String(name??'').trim();
 if(!NICK_PATTERN.test(value))return `Nicknames are ${NICK_RULES}`;
 if(RESERVED.has(value.toLowerCase()))return 'That name is reserved. Pick another.';
 return '';
}
export const areaLabel=id=>AREAS[id]?.name||'Somewhere in the Wilds';
const validNick=n=>NICK_PATTERN.test(String(n));
// Other players' entries are read as untrusted data: unknown areas, bad numbers and odd names are dropped.
export function readPresence(raw){
 if(!raw||typeof raw!=='object'||!validNick(raw.n)||!AREAS[raw.a])return null;
 return {nick:String(raw.n),areaId:raw.a,afk:raw.afk===true};
}
export function readPosition(raw){
 const area=AREAS[raw?.a];
 if(!area||!Number.isFinite(raw.x)||!Number.isFinite(raw.y))return null;
 return {areaId:raw.a,x:Math.max(0,Math.min(area.width,raw.x)),y:Math.max(0,Math.min(area.height,raw.y)),facing:FACING_NAMES[raw.f]||'down',walking:raw.w===true};
}
const shared=areaId=>!!AREAS[areaId]&&!INTERIOR_AREAS.includes(areaId);
const denied=error=>error?.code==='PERMISSION_DENIED'||/permission/i.test(error?.message||'');

export class Hub{
 constructor({backend,now=()=>performance.now()/1000,onChange=()=>{}}={}){
  this.backendPromise=backend;this.now=now;this.onChange=onChange;
  this.user=null;this.nick='';this.wantOnline=false;this.state='signed-out';this.error='';
  // friends: uid → {nick, presence, stopPresence, stopPosition}; remote: uid → smoothed position of a friend in this area.
  this.friends=new Map();this.requests=new Map();this.remote=new Map();this.afk=false;
  this.areaId=null;this.sent=null;this.sentAt=-Infinity;this.stillSince=this.now();this.stops=[];this.generation=0;
 }
 set(state,error=''){this.state=state;this.error=error;this.onChange(this);}
 async backend(){if(!this.realtime)this.realtime=await this.backendPromise;return this.realtime;}
 // Called whenever Google sign-in changes. Signing out takes the player offline and forgets their friends here.
 async setUser(user){
  if(user?.uid===this.user?.uid)return;
  await this.goOffline(false);this.unwatchFriends();this.user=user||null;this.nick='';
  if(!user){this.set('signed-out');return;}
  this.set('loading');const generation=++this.generation;
  try{const profile=await(await this.backend()).profile(user.uid);if(generation!==this.generation)return;this.nick=profile?.nick||'';}
  catch(error){this.set('error',`Could not reach the shared world: ${error.message||error}`);return;}
  if(this.nick)this.watchFriends();
  if(this.wantOnline&&this.nick)await this.goOnline();else this.set(this.nick?'offline':'needs-nick');
 }
 async setNick(name){
  const nick=String(name??'').trim(),problem=nicknameProblem(nick);
  if(!this.user)throw Error('Sign in with Google first.');
  if(problem)throw Error(problem);
  if(nick===this.nick)return;
  const backend=await this.backend();
  try{await backend.claimNick(this.user.uid,nick,this.nick,this.state==='online');}
  catch(error){throw Error(denied(error)?'That name is taken. Pick another.':`Could not change your name: ${error.message||error}`);}
  const first=!this.nick;this.nick=nick;if(first)this.watchFriends();
  if(this.state==='needs-nick')this.set('offline');else this.onChange(this);
 }
 // Friend lists and requests are followed whenever the player is signed in with a nickname, online or not.
 watchFriends(){
  const uid=this.user.uid,realtime=this.realtime,generation=this.generation;
  this.stops.push(realtime.watchFriends(uid,(id,present)=>{if(generation!==this.generation)return;if(present)this.addFriend(id);else this.dropFriend(id);}));
  this.stops.push(realtime.watchRequests(uid,(id,raw)=>{if(generation!==this.generation)return;if(raw&&validNick(raw.n))this.requests.set(id,{uid:id,nick:String(raw.n)});else this.requests.delete(id);this.onChange(this);}));
 }
 unwatchFriends(){this.stops.forEach(stop=>stop());this.stops=[];for(const id of [...this.friends.keys()])this.dropFriend(id);this.requests.clear();}
 addFriend(id){
  if(this.friends.has(id))return;
  const friend={uid:id,nick:'',presence:null,stopPresence:null,stopPosition:null};this.friends.set(id,friend);
  this.realtime.profile(id).then(p=>{if(validNick(p?.nick)&&!friend.nick)friend.nick=p.nick;this.onChange(this);}).catch(()=>{});
  if(this.state==='online')this.follow(friend);
  this.onChange(this);
 }
 dropFriend(id){const friend=this.friends.get(id);if(!friend)return;this.unfollow(friend);this.friends.delete(id);this.onChange(this);}
 // While online, a friend's presence is followed; their position only while they are in the same outdoor area.
 follow(friend){
  if(friend.stopPresence)return;
  friend.stopPresence=this.realtime.watchPresence(friend.uid,raw=>{
   friend.presence=readPresence(raw);if(friend.presence)friend.nick=friend.presence.nick;
   this.followPosition(friend);this.onChange(this);
  });
 }
 followPosition(friend){
  const near=this.state==='online'&&friend.presence&&friend.presence.areaId===this.areaId&&shared(this.areaId);
  if(near&&!friend.stopPosition)friend.stopPosition=this.realtime.watchPosition(friend.uid,raw=>this.heard(friend.uid,readPosition(raw)));
  else if(!near&&friend.stopPosition){friend.stopPosition();friend.stopPosition=null;this.remote.delete(friend.uid);}
 }
 unfollow(friend){friend.stopPresence?.();friend.stopPosition?.();friend.stopPresence=friend.stopPosition=null;friend.presence=null;this.remote.delete(friend.uid);}
 heard(uid,pos){
  if(!pos){this.remote.delete(uid);return;}
  const now=this.now(),known=this.remote.get(uid),at=known&&known.to.areaId===pos.areaId?this.position(known,now):pos;
  this.remote.set(uid,{uid,from:{x:at.x,y:at.y},to:pos,at:now,heard:now});
 }
 position(r,now=this.now()){const k=Math.min(1,(now-r.at)/HUB_SMOOTHING);if(k>=1)return {x:r.to.x,y:r.to.y};return {x:r.from.x+(r.to.x-r.from.x)*k,y:r.from.y+(r.to.y-r.from.y)*k};}
 async goOnline(){
  this.wantOnline=true;
  if(!this.user){this.set('signed-out');return;}
  if(!this.nick){this.set('needs-nick');return;}
  if(this.state==='online'||this.state==='connecting')return;
  this.set('connecting');const generation=this.generation;
  try{
   const backend=await this.backend();
   await backend.join(this.user.uid,{n:this.nick,a:this.areaId||'landing',afk:this.afk});
   if(generation!==this.generation)return;
   // The next sync shares Eli's area and position.
   this.sent=null;this.set('online');
   for(const friend of this.friends.values())this.follow(friend);
  }catch(error){if(generation===this.generation){this.wantOnline=false;this.set('error',`Could not go online: ${error.message||error}`);}}
 }
 async goOffline(remember=true){
  if(remember)this.wantOnline=false;
  for(const friend of this.friends.values())this.unfollow(friend);this.remote.clear();
  const was=this.state;this.sent=null;
  if(was==='online'||was==='connecting'){this.state='offline';try{await(await this.backend()).leave(this.user.uid);}catch{}}
  if(this.user&&this.state!=='signed-out'&&this.state!=='loading')this.set(this.nick?'offline':'needs-nick');
 }
 async addByName(name){
  const nick=String(name??'').trim();
  if(!this.nick)throw Error('Pick your own nickname first.');
  if(!validNick(nick))throw Error('Type your friend’s nickname exactly.');
  if(nick.toLowerCase()===this.nick.toLowerCase())throw Error('That’s you.');
  if(this.friends.size>=MAX_FRIENDS)throw Error(`You can have up to ${MAX_FRIENDS} friends.`);
  const backend=await this.backend(),uid=await backend.lookupNick(nick);
  if(!uid)throw Error(`Nobody is called ${nick}. Check the spelling with your friend.`);
  if(this.friends.has(uid))throw Error(`${this.friends.get(uid).nick||nick} is already your friend.`);
  // They already asked: saying yes is enough.
  if(this.requests.has(uid)){await this.answer(uid,true);return 'accepted';}
  try{await backend.request(this.user.uid,uid,this.nick);}catch(error){throw Error(denied(error)?'That request could not be sent.':`Could not send the request: ${error.message||error}`);}
  return 'sent';
 }
 async answer(uid,accept){await(await this.backend()).answer(this.user.uid,uid,accept);this.requests.delete(uid);this.onChange(this);}
 async unfriend(uid){await(await this.backend()).unfriend(this.user.uid,uid);this.dropFriend(uid);}
 setAfk(afk){this.applyAfk(afk);}
 applyAfk(afk){if(afk===this.afk)return;this.afk=afk;if(this.state==='online')this.realtime?.updatePresence(this.user.uid,{afk}).catch(()=>{});this.onChange(this);}
 // Runs every frame with the local journey (null on the title screen). Sends Eli's position a few times a second while he moves.
 sync(world){
  const areaId=world?.adventure?world.areaId:null;
  if(!areaId){if(this.state==='online'&&this.areaId!==null){this.realtime.sendPosition(this.user.uid,null).catch(()=>{});this.areaId=null;this.refollow();}return;}
  const now=this.now(),p=world.player;
  const moved=!this.sent||this.sent.areaId!==areaId||Math.abs(this.sent.x-p.x)>1||Math.abs(this.sent.y-p.y)>1;
  if(moved){this.stillSince=now;if(this.afk&&this.sent)this.applyAfk(false);}
  else if(!this.afk&&now-this.stillSince>=AFK_AFTER)this.applyAfk(true);
  if(this.state!=='online'){this.areaId=areaId;return;}
  if(areaId!==this.areaId||!this.sent){
   this.areaId=areaId;this.sent={areaId,x:p.x,y:p.y,walking:false};this.sentAt=now;
   this.realtime.updatePresence(this.user.uid,{a:areaId}).catch(()=>{});
   this.realtime.sendPosition(this.user.uid,shared(areaId)?this.pose(areaId,p,false):null).catch(()=>{});
   this.refollow();return;
  }
  if(!shared(areaId))return;
  if((moved||this.sent.walking)&&now-this.sentAt>=HUB_SEND_INTERVAL){
   this.sent={areaId,x:p.x,y:p.y,walking:moved};this.sentAt=now;
   this.realtime.sendPosition(this.user.uid,this.pose(areaId,p,moved)).catch(()=>{});
  }
 }
 refollow(){for(const friend of this.friends.values())this.followPosition(friend);}
 pose(areaId,p,walking){return {a:areaId,x:Math.round(p.x),y:Math.round(p.y),f:FACINGS[p.facing]||'d',w:walking};}
 // Friends to draw in the local area, at their smoothed positions.
 others(world){
  if(this.state!=='online'||!world?.adventure||world.areaId!==this.areaId)return [];
  const now=this.now(),list=[];
  for(const r of this.remote.values()){
   const who=this.friends.get(r.uid)?.presence;
   if(!who||who.areaId!==world.areaId||r.to.areaId!==world.areaId)continue;
   const at=this.position(r,now),walking=r.to.walking&&now-r.heard<.6;
   list.push({remote:true,spriteId:'eli',uid:r.uid,name:who.nick,afk:who.afk,x:at.x,y:at.y,facing:r.to.facing,steppedAt:walking?world.elapsed:undefined,angle:0});
  }
  return list;
 }
 // The player, then friends online (same area first), then friends offline.
 roster(){
  if(!this.user||!this.nick)return [];
  const online=this.state==='online';
  const list=[...this.friends.values()].map(f=>{const p=online?f.presence:null;return {uid:f.uid,nick:f.presence?.nick||f.nick||'…',online:!!p,areaId:p?.areaId||null,area:p?areaLabel(p.areaId):'',afk:!!p?.afk,me:false};});
  const rank=p=>p.online?(p.areaId===this.areaId?0:1):2;
  list.sort((a,b)=>rank(a)-rank(b)||a.area.localeCompare(b.area)||a.nick.localeCompare(b.nick));
  return [{uid:this.user.uid,nick:this.nick,online,areaId:this.areaId,area:online?areaLabel(this.areaId):'',afk:this.afk,me:true},...list];
 }
 get friendsOnline(){return this.state==='online'?[...this.friends.values()].filter(f=>f.presence).length:0;}
}
