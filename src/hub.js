import {AREAS,INTERIOR_AREAS} from './wilds.js';
// The shared world: signed-in players who go online see each other walking in whatever area they share.
// Only presence is shared. Each player's story, animals, drops and progress stay in their own game.
// A player only ever writes their own entries; database.rules.json enforces that on the server.
export const HUB_SEND_INTERVAL=.25;
export const HUB_SMOOTHING=.3;
export const AFK_AFTER=300;
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
// Other players' entries are read as untrusted data: unknown areas, bad numbers and long names are dropped.
export function readPresence(raw){
 if(!raw||typeof raw!=='object'||!NICK_PATTERN.test(String(raw.n))||!AREAS[raw.a])return null;
 return {nick:String(raw.n),areaId:raw.a,afk:raw.afk===true};
}
export function readPosition(raw,areaId){
 const area=AREAS[areaId];
 if(!area||!raw||typeof raw!=='object'||!Number.isFinite(raw.x)||!Number.isFinite(raw.y))return null;
 return {x:Math.max(0,Math.min(area.width,raw.x)),y:Math.max(0,Math.min(area.height,raw.y)),facing:FACING_NAMES[raw.f]||'down',walking:raw.w===true};
}
const shared=areaId=>!!AREAS[areaId]&&!INTERIOR_AREAS.includes(areaId);

export class Hub{
 constructor({backend,now=()=>performance.now()/1000,onChange=()=>{}}={}){
  this.backendPromise=backend;this.now=now;this.onChange=onChange;
  this.user=null;this.nick='';this.wantOnline=false;this.state='signed-out';this.error='';
  this.presence=new Map();this.remote=new Map();this.afk=false;this.manualAfk=false;
  this.areaId=null;this.sent=null;this.sentAt=-Infinity;this.stillSince=this.now();this.unwatchArea=null;this.unwatchPresence=null;this.generation=0;
 }
 set(state,error=''){this.state=state;this.error=error;this.onChange(this);}
 async backend(){if(!this.realtime)this.realtime=await this.backendPromise;return this.realtime;}
 // Called whenever Google sign-in changes. Signing out always takes the player offline.
 async setUser(user){
  if(user?.uid===this.user?.uid)return;
  await this.goOffline(false);this.user=user||null;this.nick='';
  if(!user){this.set('signed-out');return;}
  this.set('loading');const generation=this.generation;
  try{const profile=await(await this.backend()).profile(user.uid);if(generation!==this.generation||this.user?.uid!==user.uid)return;this.nick=profile?.nick||'';}
  catch(error){this.set('error',`Could not reach the shared world: ${error.message||error}`);return;}
  if(this.wantOnline&&this.nick)await this.goOnline();else this.set(this.nick?'offline':'needs-nick');
 }
 async setNick(name){
  const nick=String(name??'').trim(),problem=nicknameProblem(nick);
  if(!this.user)throw Error('Sign in with Google first.');
  if(problem)throw Error(problem);
  if(nick===this.nick)return;
  const backend=await this.backend();
  try{await backend.claimNick(this.user.uid,nick,this.nick,this.state==='online');}
  catch(error){throw Error(error?.code==='PERMISSION_DENIED'||/permission/i.test(error?.message||'')?'That name is taken. Pick another.':`Could not change your name: ${error.message||error}`);}
  this.nick=nick;if(this.state==='needs-nick')this.set('offline');else this.onChange(this);
 }
 async goOnline(){
  this.wantOnline=true;
  if(!this.user){this.set('signed-out');return;}
  if(!this.nick){this.set('needs-nick');return;}
  if(this.state==='online'||this.state==='connecting')return;
  this.set('connecting');const generation=++this.generation;
  try{
   const backend=await this.backend();
   await backend.join(this.user.uid,{n:this.nick,a:this.areaId||'landing',afk:this.afk});
   if(generation!==this.generation)return;
   this.unwatchPresence=backend.watchPresence((uid,raw)=>{const p=uid===this.user?.uid?null:readPresence(raw);if(p)this.presence.set(uid,p);else{this.presence.delete(uid);this.remote.delete(uid);}this.onChange(this);});
   // The next sync places Eli in his current area, which also arms removal of that entry on disconnect.
   this.areaId=null;this.sent=null;this.set('online');
  }catch(error){if(generation===this.generation){this.wantOnline=false;this.set('error',`Could not go online: ${error.message||error}`);}}
 }
 async goOffline(remember=true){
  if(remember)this.wantOnline=false;
  this.generation++;this.unwatchPresence?.();this.unwatchPresence=null;this.unwatchArea?.();this.unwatchArea=null;
  this.presence.clear();this.remote.clear();
  const was=this.state;this.sent=null;
  if(was==='online'&&this.user){this.state='offline';try{await(await this.backend()).leave(this.user.uid,this.areaId);}catch{}}
  if(this.user&&this.state!=='signed-out')this.set(this.nick?'offline':'needs-nick');
 }
 setAfk(afk){this.manualAfk=afk;this.applyAfk(afk);}
 applyAfk(afk){if(afk===this.afk)return;this.afk=afk;if(this.state==='online')this.realtime?.updatePresence(this.user.uid,{afk}).catch(()=>{});this.onChange(this);}
 watch(areaId){
  this.unwatchArea?.();this.unwatchArea=null;
  this.remote.clear();
  if(this.state!=='online'||!shared(areaId))return;
  const generation=this.generation;
  this.unwatchArea=this.realtime.watchArea(areaId,(uid,raw)=>{
   if(generation!==this.generation||uid===this.user?.uid)return;
   const pos=readPosition(raw,areaId);if(!pos){this.remote.delete(uid);return;}
   const now=this.now(),known=this.remote.get(uid),at=known?this.position(known,now):pos;
   this.remote.set(uid,{uid,from:{x:at.x,y:at.y},to:pos,at:now,facing:pos.facing,walking:pos.walking,heard:now});
  });
 }
 position(r,now=this.now()){const k=Math.min(1,(now-r.at)/HUB_SMOOTHING);if(k>=1)return {x:r.to.x,y:r.to.y};return {x:r.from.x+(r.to.x-r.from.x)*k,y:r.from.y+(r.to.y-r.from.y)*k};}
 // Runs every frame with the local journey (null on the title screen). Sends Eli's position a few times a second while he moves.
 sync(world){
  if(!world?.adventure){if(this.state==='online'&&this.areaId!==null){this.realtime.leaveArea(this.user.uid,this.areaId).catch(()=>{});this.areaId=null;this.watch(null);}return;}
  const now=this.now(),p=world.player,areaId=world.areaId;
  const moved=!this.sent||this.sent.areaId!==areaId||Math.abs(this.sent.x-p.x)>1||Math.abs(this.sent.y-p.y)>1;
  if(moved){this.stillSince=now;if(this.afk){this.manualAfk=false;this.applyAfk(false);}}
  else if(!this.afk&&now-this.stillSince>=AFK_AFTER)this.applyAfk(true);
  if(this.state!=='online'){this.areaId=areaId;return;}
  if(areaId!==this.areaId){
   const previous=this.areaId;this.areaId=areaId;this.sent=null;
   this.realtime.changeArea(this.user.uid,previous,areaId,shared(areaId)?this.pose(p,false):null).catch(()=>{});
   this.watch(areaId);this.sent={areaId,x:p.x,y:p.y,walking:false};this.sentAt=now;return;
  }
  if(!shared(areaId))return;
  const walking=moved;
  if((moved||this.sent.walking!==walking)&&now-this.sentAt>=HUB_SEND_INTERVAL){
   this.sent={areaId,x:p.x,y:p.y,walking};this.sentAt=now;
   this.realtime.sendPosition(this.user.uid,areaId,this.pose(p,walking)).catch(()=>{});
  }
 }
 pose(p,walking){return {x:Math.round(p.x),y:Math.round(p.y),f:FACINGS[p.facing]||'d',w:walking};}
 // Players to draw in the local area, at their smoothed positions.
 others(world){
  if(this.state!=='online'||!world?.adventure||world.areaId!==this.areaId)return [];
  const now=this.now(),list=[];
  for(const r of this.remote.values()){
   const who=this.presence.get(r.uid);if(!who||who.areaId!==world.areaId)continue;
   const at=this.position(r,now),walking=r.walking&&now-r.heard<.6;
   list.push({remote:true,spriteId:'eli',uid:r.uid,name:who.nick,afk:who.afk,x:at.x,y:at.y,facing:r.facing,steppedAt:walking?world.elapsed:undefined,angle:0});
  }
  return list;
 }
 // Everyone online, the player first, then by area and name.
 roster(){
  if(this.state!=='online')return [];
  const list=[...this.presence.entries()].map(([uid,p])=>({uid,nick:p.nick,areaId:p.areaId,area:areaLabel(p.areaId),afk:p.afk,me:false}));
  list.sort((a,b)=>(a.areaId===this.areaId?0:1)-(b.areaId===this.areaId?0:1)||a.area.localeCompare(b.area)||a.nick.localeCompare(b.nick));
  return [{uid:this.user.uid,nick:this.nick,areaId:this.areaId,area:areaLabel(this.areaId),afk:this.afk,me:true},...list];
 }
}
