import {Presentation} from './presentation.js';
import {World} from './world.js';
import {VERSION,neutralInput,cleanInput,applyAction,snapshot,fromSnapshot} from './protocol.js';
const nameOf=value=>String(value||'Angler').trim().slice(0,20)||'Angler';
const roomId=()=>`fish-${Array.from(crypto.getRandomValues(new Uint8Array(6)),n=>n.toString(16).padStart(2,'0')).join('')}`;
export class Lobby {
 constructor(onChange){this.smoothing=new Presentation();this.onChange=onChange;this.mode='menu';this.status='Practice solo or invite friends.';this.members=[];this.connections=new Map();this.inputs={};this.lastSeen={};this.world=null;this.clock=0;this.sendClock=0;this.generation=0;this.lastPacket=0;}
 notify(){this.onChange?.();}
 stop(){this.smoothing=new Presentation();this.lastInputKey='';this.generation++;clearTimeout(this.timeout);this.peer?.destroy();this.peer=null;this.connections.clear();this.mode='menu';this.members=[];this.world=null;this.inputs={};this.lastSeen={};this.id=null;this.code='';this.error='';}
 leave(){this.stop();this.status='Left lobby. Create or join another match.';this.notify();}
 practice(){this.stop();this.mode='solo';this.world=new World();this.notify();}
 async connect(name,code=null){
  this.stop();this.mode=code?'joining':'creating';this.name=nameOf(name);this.status=code?'Connecting to host…':'Creating lobby…';this.notify();
  const generation=this.generation;
  try{
   if(!globalThis.Peer)await new Promise((resolve,reject)=>{const script=document.createElement('script');script.src=new URL('../vendor/peerjs.min.js',import.meta.url);script.onload=resolve;script.onerror=()=>reject(Error('Multiplayer library could not load.'));document.head.append(script);});
   if(generation!==this.generation)return;
   const host=!code;this.peer=new Peer(host?roomId():undefined,{debug:0,secure:true});
   this.timeout=setTimeout(()=>{if(['joining','creating'].includes(this.mode))this.fail('Connection timed out. Check the invite code and network, then try again.');},20000);
   this.peer.on('open',id=>{
    if(generation!==this.generation)return;
    this.id=id;
    if(host){clearTimeout(this.timeout);this.mode='host';this.code=id;this.members=[{id,name:this.name,ready:false}];this.status='Share the invite link. Everyone must ready up.';this.notify();}
    else{this.code=code;const conn=this.peer.connect(code,{reliable:true,serialization:'json',metadata:{version:VERSION,name:this.name}});this.bindGuest(conn,generation);}
   });
   this.peer.on('connection',conn=>this.accept(conn,generation));
   this.peer.on('error',error=>{if(generation!==this.generation)return;this.fail(error.type==='peer-unavailable'?'Lobby not found. Ask the host for a new invite.':`Connection failed (${error.type||'network'}). Try again or use a different network.`);});
   this.peer.on('disconnected',()=>{if(generation!==this.generation)return;this.status='Signaling disconnected. Existing match may continue; new joins are unavailable.';this.notify();});
  }catch(error){this.fail(error.message);}
 }
 fail(message){this.stop();this.status=message;this.notify();}
 accept(conn,generation){
  conn.on('open',()=>{
   if(generation!==this.generation||this.mode!=='host'||this.world||this.members.length>=4||conn.metadata?.version!==VERSION||this.connections.has(conn.peer)){conn.send({type:'rejected',reason:'Lobby is full, in a match, or using a different game version.'});setTimeout(()=>conn.close(),250);return;}
   this.connections.set(conn.peer,conn);this.lastSeen[conn.peer]=performance.now();this.members.push({id:conn.peer,name:nameOf(conn.metadata.name),ready:false});this.broadcastLobby();
   conn.on('data',data=>this.receiveHost(conn,data));
   conn.on('close',()=>{if(generation!==this.generation||!this.connections.has(conn.peer))return;this.connections.delete(conn.peer);this.members=this.members.filter(member=>member.id!==conn.peer);delete this.inputs[conn.peer];if(this.world){this.world=null;this.members.forEach(member=>member.ready=false);this.status='A player disconnected. Match ended; ready up to play again.';}this.broadcastLobby();});
  });
  conn.on('error',()=>conn.close());
 }
 receiveHost(conn,data){
  if(!data||typeof data!=='object')return;
  this.lastSeen[conn.peer]=performance.now();
  if(data.type==='ready'&&!this.world){const member=this.members.find(member=>member.id===conn.peer);if(member)member.ready=data.ready===true;this.broadcastLobby();}
  if(data.type==='input'){const input=cleanInput(data.input);if(input)this.inputs[conn.peer]=input;}
  if(data.type==='action'&&this.world){const input=cleanInput(data.input);if(!input)return;const now=performance.now();conn.actionTimes=(conn.actionTimes||[]).filter(t=>now-t<1000);if(conn.actionTimes.length>=30)return;conn.actionTimes.push(now);applyAction(this.world,conn.peer,data.action,input);}
 }
 bindGuest(conn,generation){
  this.connection=conn;this.lastPacket=performance.now();
  conn.on('data',data=>{
   if(generation!==this.generation||!data)return;this.lastPacket=performance.now();
   if(data.type==='rejected'){this.fail(data.reason);return;}
   if(data.type==='lobby'){clearTimeout(this.timeout);this.mode='guest';this.members=data.members;this.world=null;this.status=data.status;this.notify();}
   if(data.type==='state'){const first=!this.world;if(this.world)this.smoothing.capture(this.world,performance.now());const world=fromSnapshot(data.state,this.id,this.world);if(world){this.mode='guest';this.world=world;if(first)this.notify();}}
  });
  conn.on('close',()=>{if(generation===this.generation)this.fail('Host disconnected. The lobby has closed.');});
  conn.on('error',()=>{if(generation===this.generation)this.fail('Unable to connect to the host. Some networks need a TURN relay. Try another network.');});
 }
 send(conn,data){
  if(!conn?.open)return false;
  // Never queue stale real-time snapshots behind a congested connection.
  if(['state','input'].includes(data.type)&&(conn.bufferSize>0||(conn.dataChannel?.bufferedAmount||0)>32768))return false;
  conn.send(data);return true;
 }
 presentation(){return this.mode==='guest'&&this.world?this.smoothing.view(this.world,performance.now()):this.world;}
 broadcastLobby(){const data={type:'lobby',members:this.members,status:this.status};for(const conn of this.connections.values())this.send(conn,data);this.notify();}
 toggleReady(){if(this.world)return;const member=this.members.find(member=>member.id===this.id);if(!member)return;if(this.mode==='host'){member.ready=!member.ready;this.broadcastLobby();}else this.send(this.connection,{type:'ready',ready:!member.ready});}
 start(){if(this.mode!=='host'||this.world||this.members.length<2||!this.members.every(member=>member.ready))return false;this.world=new World(Math.random,{humans:this.members});this.inputs={};this.lastSeen={};this.broadcastState();this.notify();return true;}
 broadcastState(){if(this.world){const state=snapshot(this.world);for(const conn of this.connections.values())this.send(conn,{type:'state',state});}}
 rematch(){if(this.mode==='solo'){this.world=new World();this.notify();}else if(this.mode==='host'&&this.world?.matchState==='finished'){this.world=null;this.members.forEach(member=>member.ready=false);this.status='Match finished. Ready up for the next one.';this.broadcastLobby();}}
 action(action,input){if(!this.world)return;if(this.mode==='guest')this.send(this.connection,{type:'action',action,input});else applyAction(this.world,this.world.player.id,action,input);}
 tick(dt,input){
  this.sendClock+=dt;
  if(this.mode==='guest'&&this.world){const key=[input.left,input.right,input.up,input.down,input.held].join(':');if(key!==this.lastInputKey&&this.send(this.connection,{type:'input',input})){this.lastInputKey=key;this.sendClock=0;}}
  if(this.mode==='solo'){this.world.update(dt,input);return;}
  if(this.mode==='host'&&this.world){
   for(const id of Object.keys(this.inputs))if(performance.now()-(this.lastSeen[id]||0)>500)this.inputs[id]=neutralInput();
   this.world.update(dt,input,this.inputs);
  }
  if(this.sendClock>=.05){this.sendClock=0;if(this.mode==='guest')this.send(this.connection,{type:'input',input});if(this.mode==='host'){if(this.world)this.broadcastState();else if((this.clock+=.05)>=1){this.clock=0;this.broadcastLobby();}}}
  if(this.mode==='guest'&&performance.now()-this.lastPacket>15000)this.fail('Host stopped responding. Rejoin when their game is active.');
 }
}
