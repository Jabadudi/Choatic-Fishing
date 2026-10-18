import {World} from './world.js';
import {render} from './renderer.js';
import './music.js';
import {Lobby} from './lobby.js';
let world=new World(Math.random,{botCount:0});
const canvas=document.querySelector('#arena'),ctx=canvas.getContext('2d',{alpha:false});
// Keep the original zoom while following the local player.
let view={scale:1,x:0,y:0,width:960,height:720,dpr:1};
function resize(){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1920*1080/(r.width*r.height)));
  view.width=r.width;view.height=r.height;view.dpr=dpr;
  canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
  view.scale=Math.min(r.width/960,r.height/720);
  view.x=(r.width-960*view.scale)/2;view.y=(r.height-720*view.scale)/2;
}
new ResizeObserver(resize).observe(canvas);resize();
const elements=new Map();
const $=id=>{if(!elements.has(id))elements.set(id,document.getElementById(id));return elements.get(id);};const keys=new Set();let mouseHeld=false,spaceHeld=false,aim={x:480,y:0};
const currentInput=()=>{camera();return ({left:keys.has('KeyA'),right:keys.has('KeyD'),up:keys.has('KeyW'),down:keys.has('KeyS'),aim,held:mouseHeld||spaceHeld});};
const act=action=>lobby.action(action,currentInput());
const equip=slot=>act(slot===1?'rod':'item');
addEventListener('keydown',e=>{
  if(e.target.closest('.music-hud, #lobby-screen')||!lobby.world)return;
  if(['Space','ArrowUp','ArrowDown'].includes(e.code))e.preventDefault();
  keys.add(e.code);if(e.code==='Space')spaceHeld=true;
  if(!e.repeat){
    if(e.code==='ShiftLeft')act('dash');
    if(e.code==='KeyE'){
      act('toggle');
    }
    if(e.code==='Digit1')equip(1);
    if(e.code==='Digit2')equip(2);
    if(e.code==='KeyF')act('use');
    if(e.code==='KeyR')act('tidal');
    if(e.code==='KeyT')act('whirlpool');
    if(e.code==='Enter'&&['won','lost','finished'].includes(world.matchState))restart();
    if(['Escape','KeyQ'].includes(e.code))act('cancel');
  }
});
addEventListener('keyup',e=>{keys.delete(e.code);if(e.code==='Space')spaceHeld=false;});
let pointer=null;
function camera(player=world.player){view.x=view.width/2-player.x*view.scale;view.y=view.height/2-player.y*view.scale;if(pointer)aim={x:(pointer.x-view.x)/view.scale,y:(pointer.y-view.y)/view.scale};}
function point(e){const r=canvas.getBoundingClientRect();pointer={x:e.clientX-r.left,y:e.clientY-r.top};camera();world.player.angle=Math.atan2(aim.y-world.player.y,aim.x-world.player.x);}
canvas.addEventListener('pointermove',point);
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!lobby.world)return;point(e);mouseHeld=true;canvas.focus();act('click');});
addEventListener('pointerup',()=>mouseHeld=false);
function release(){keys.clear();mouseHeld=false;spaceHeld=false;}
addEventListener('blur',release);document.addEventListener('visibilitychange',release);
$('slot-rod').onclick=()=>equip(1);$('slot-item').onclick=()=>equip(2);$('cancel').onclick=()=>act('cancel');
$('choose-whirlpool').onclick=()=>chooseReward('whirlpool');$('choose-special').onclick=()=>chooseReward('tidal');
$('fire-tidal').onclick=()=>act('tidal');$('fire-whirlpool').onclick=()=>act('whirlpool');
$('restart').onclick=restart;
function restart(){release();lobby.rematch();progressionKey='';canvas.focus();}
function chooseReward(reward){act('choose-'+reward);}
let progressionKey='';
function updateProgression(){
 const p=world.progression,key=[p.level,p.xp,p.pendingChoices,...Object.values(p.ranks),...Object.values(p.specials),world.matchState].join(':');if(key===progressionKey)return;progressionKey=key;
 $('level').textContent=`LEVEL ${p.level}`;$('xp-text').textContent=`${p.xp} / ${p.xpToNextLevel} XP`;$('xp-fill').style.width=`${p.xp/p.xpToNextLevel*100}%`;
 $('xp-track').setAttribute('aria-valuenow',p.xp);$('xp-track').setAttribute('aria-valuemax',p.xpToNextLevel);
 $('build-summary').textContent=`Speed +${p.ranks.speed*5}% · Damage +${p.ranks.power*8}% · Max HP ${p.maxHealth} · Armor ${Math.round(p.damageReduction*100)}%`;
 $('buff-text').textContent=p.lastBuff?`Catch buff: ${p.lastBuff.name} — ${p.lastBuff.description}`:'Every catch grants a random passive buff';
 $('fire-tidal').textContent=`R · Tidal Cannon ×${p.specials.tidal}`;$('fire-whirlpool').textContent=`T · Whirlpool ×${p.specials.whirlpool}`;
 $('reward-choice').hidden=p.pendingChoices===0||world.matchState!=='playing';$('reward-heading').textContent=`Level up · Choose a special (${p.pendingChoices})`;
}
const ICONS={'Treasure Key':'⚿','Frying Pan':'◉','Swordfish':'⚔','Harpoon Gun':'➶','Anchor':'⚓','Pufferfish Bomb':'✹','Grappling Squid':'↗','Sardine':'♢','Old Boot':'♟'};
function updateUI(){
 const f=world.fishing,active=f.state==='reeling',busy=f.state!=='idle',inventory=world.inventory;
 $('line-panel').hidden=!active;
 $('health-text').textContent=`${Math.ceil(world.player.health)} / ${world.progression.maxHealth} HP`;
 $('dash-status').textContent=world.dashRemaining>0?'L-SHIFT · DASHING':world.dashCooldown>0?`L-SHIFT · ${world.dashCooldown.toFixed(1)}s`:'L-SHIFT · DASH READY';
 $('dash-fill').style.width=`${world.dashRemaining>0?0:(1-world.dashCooldown/2)*100}%`;
 $('health-fill').style.width=`${world.player.health/world.progression.maxHealth*100}%`;
 $('alive-text').textContent=`${world.actors.filter(actor=>actor.health>0).length} / ${world.actors.length} ALIVE`;
 $('countdown').hidden=world.matchState!=='countdown';$('countdown-number').textContent=Math.ceil(world.countdownRemaining);
 $('match-end').hidden=!['won','lost','finished'].includes(world.matchState);$('match-title').textContent=world.matchState==='won'||(world.matchState==='finished'&&world.player.health>0)?'Last angler standing!':'You were eliminated';
 $('restart').disabled=lobby.mode==='guest';$('restart').textContent=lobby.mode==='guest'?'Waiting for host to return to lobby':lobby.mode==='host'?'Return to lobby':'Play again · Enter';
 $('match-summary').textContent=`${world.player.catchCount??world.catches.length} catches · ${world.progression.eliminations.size} eliminations · Level ${world.progression.level}`;
 for(const kind of ['tidal','whirlpool'])$('fire-'+kind).disabled=busy||world.player.cooldown>0||world.progression.specials[kind]===0||world.matchState!=='playing';
 $('world-state').textContent=world.matchState==='countdown'?'GET READY':active?'REELING':busy?'WAITING FOR A BITE':'EXPLORING';
 $('catch-bar').style.bottom=`${(f.bar||0)*100}%`;$('target').style.bottom=`${(f.target||0)*100}%`;$('progress-fill').style.height=active?`${f.progress*100}%`:'0%';$('percent').textContent=active?`${Math.floor(f.progress*100)}%`:'0%';
 for(const slot of [1,2]){const button=$(slot===1?'slot-rod':'slot-item');button.classList.toggle('selected',inventory.selected===slot);button.setAttribute('aria-pressed',inventory.selected===slot);}
 $('item-name').textContent=inventory.item?.name||'Empty slot';$('item-icon').textContent=inventory.item?ICONS[inventory.item.name]||'◆':'—';$('item-uses').textContent=inventory.item?`${inventory.item.uses} use${inventory.item.uses===1?'':'s'} · Click or F`:'Reel in your next item';
 $('status').textContent=active?'WASD move along shore · Hold Space / mouse to reel · E to abandon.':busy?'Waiting for a bite… E / Esc to abandon.':world.message||'Walk to shore, aim into water, press E.';
}
const lobby=new Lobby(updateLobby);
function updateLobby(){
 $('lobby-screen').hidden=!!lobby.world;
 $('leave-lobby').hidden=lobby.mode==='menu';
 $('lobby-status').textContent=lobby.status;
 const inRoom=['host','guest'].includes(lobby.mode),connecting=['creating','joining'].includes(lobby.mode);
 $('lobby-menu').hidden=inRoom;$('room-panel').hidden=!inRoom;
 $('create-room').disabled=connecting;$('join-room').disabled=connecting;
 $('room-code').value=lobby.code||'';
 $('room-members').replaceChildren(...lobby.members.map(member=>{const li=document.createElement('li');li.textContent=`${member.name}${member.id===lobby.id?' (you)':''} — ${member.ready?'Ready':'Not ready'}`;return li;}));
 $('ready-up').textContent=lobby.members.find(m=>m.id===lobby.id)?.ready?'Not ready':'Ready up';
 $('start-match').hidden=lobby.mode!=='host';$('start-match').disabled=lobby.members.length<2||!lobby.members.every(m=>m.ready);
 if(lobby.world)world=lobby.world;
 else {release();for(const id of ['countdown','match-end','reward-choice','line-panel'])$(id).hidden=true;}
}
$('practice').onclick=()=>{lobby.practice();progressionKey='';canvas.focus();};
$('create-room').onclick=()=>lobby.connect($('player-name').value);
$('join-room').onclick=()=>{let code=$('join-code').value.trim();try{if(code.includes('://'))code=new URL(code).searchParams.get('room')||'';}catch{}if(!/^fish-[a-f0-9]{12}$/.test(code)){lobby.status='Paste a valid invite link or room code.';updateLobby();return;}lobby.connect($('player-name').value,code);};
$('ready-up').onclick=()=>lobby.toggleReady();$('start-match').onclick=()=>{if(lobby.start()){release();canvas.focus();}};
$('leave-lobby').onclick=()=>lobby.leave();
$('copy-invite').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('room',lobby.code);try{await navigator.clipboard.writeText(url.href);lobby.status='Invite link copied. Send it to your friends.';}catch{lobby.status='Copy this room code and share the game URL.';$('room-code').select();}updateLobby();};
const invitation=new URL(location.href).searchParams.get('room');if(invitation)$('join-code').value=invitation;
updateLobby();
let accumulator=0,last=performance.now(),lastUI=0,lastRender=0;
function frame(now){accumulator+=Math.min((now-last)/1000,.1);last=now;while(accumulator>=1/120){lobby.tick(1/120,currentInput());accumulator-=1/120;}
 if(lobby.world)world=lobby.world;
 if(now-lastRender<1000/60){requestAnimationFrame(frame);return;}lastRender=now-((now-lastRender)%(1000/60));
 const display=lobby.presentation();camera(display?.player||world.player);const dpr=view.dpr;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle='#1c4754';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.setTransform(dpr*view.scale,0,0,dpr*view.scale,dpr*view.x,dpr*view.y);
 render(ctx,display||world);if(lobby.world&&now-lastUI>=1000/30){lastUI=now;updateProgression();updateUI();}requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
