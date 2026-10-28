import {Hub,NICK_RULES} from './hub.js';
import {realtimeBackend} from './hub-backend.js';
import {FIREBASE_CONFIG} from './cloud-save.js';
import {preferences} from './preferences.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// Two figures side by side.
const PEOPLE='<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 20c0-3.4 2.5-6 5.5-6s5.5 2.6 5.5 6M14 14.6c.8-.4 1.6-.6 2.5-.6 2.5 0 4.5 2.2 4.5 5"/>';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
// The Players sheet: sign in, pick a nickname, go online, and see who else is in the Wilds.
export function mountHub({cloud,onOpen,onClose}){
 const backend=cloud.backendPromise.then(b=>realtimeBackend(b.fb,b.app,FIREBASE_CONFIG.databaseURL));backend.catch(()=>{});
 const hub=new Hub({backend,onChange:()=>{dirty=true;}});
 hub.wantOnline=preferences.value.hubOnline;
 const button=el('button');button.id='open-players';button.hidden=true;
 button.setAttribute('aria-label','Players online');button.setAttribute('aria-haspopup','dialog');
 button.innerHTML=`${svg(PEOPLE,22)}<span>Players</span><b class="quest-count players-count" hidden></b>`;
 document.querySelector('.playfield').append(button);
 const dialog=el('dialog');dialog.id='players-sheet';dialog.setAttribute('aria-labelledby','players-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(PEOPLE,40)}</span><h2 id="players-title">Players</h2><p class="backpack-capacity players-summary"></p><button class="backpack-close" aria-label="Close players">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div>
<div class="players-body">
 <section class="players-me">
  <div class="players-signin" hidden><p>Sign in with Google to meet other players. Your story and items stay your own; others only see your nickname and where you walk.</p><button type="button" class="players-signin-button">Sign in with Google</button></div>
  <form class="players-nick" hidden><label for="players-nick-input">Your nickname</label><div class="players-nick-row"><input id="players-nick-input" maxlength="16" autocomplete="off" spellcheck="false"><button type="submit">Save name</button></div><small>${NICK_RULES} Other players see this name, never your Google name.</small></form>
  <div class="players-toggles"><button type="button" class="players-online" aria-pressed="false"></button><button type="button" class="players-afk" aria-pressed="false">Away (AFK)</button><button type="button" class="players-rename">Change name</button></div>
 </section>
 <ul class="players-list" aria-label="Players online"></ul>
</div>
<p class="trade-note players-note" role="status"></p></div>`;
 document.body.append(dialog);
 const q=selector=>dialog.querySelector(selector),list=q('.players-list'),note=q('.players-note'),input=q('#players-nick-input');
 let dirty=true,lastUid,editing=false;
 const say=text=>{note.textContent=text;};
 const attempt=async action=>{try{await action();}catch(error){say(error.message||String(error));}dirty=true;};
 q('.backpack-close').onclick=()=>close();
 dialog.addEventListener('close',()=>{onClose?.();});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 q('.players-signin-button').onclick=()=>attempt(()=>cloud.signIn());
 q('.players-nick').addEventListener('submit',e=>{e.preventDefault();attempt(async()=>{await hub.setNick(input.value);editing=false;say(`Other players now see you as ${hub.nick}.`);if(hub.wantOnline)await hub.goOnline();});});
 q('.players-online').onclick=()=>attempt(async()=>{if(hub.state==='online'){await hub.goOffline();preferences.set({hubOnline:false});say('You are offline. Nobody can see you.');}else{await hub.goOnline();if(hub.state==='online'){preferences.set({hubOnline:true});say('You are online. Players in the same area can see you.');}}});
 q('.players-rename').onclick=()=>{editing=true;input.value=hub.nick;dirty=true;render();input.focus();};
 q('.players-afk').onclick=()=>{hub.setAfk(!hub.afk);dirty=true;};
 const SUMMARY={'signed-out':'Not signed in',loading:'Checking your account…','needs-nick':'Pick a nickname',offline:'Offline',connecting:'Connecting…',online:'',error:'Offline'};
 function render(){
  dirty=false;const state=hub.state,online=state==='online',people=hub.roster();
  const count=button.querySelector('.players-count');count.hidden=!online||people.length<2;count.textContent=String(people.length-1);
  if(!dialog.open)return;
  q('.players-summary').textContent=online?`${people.length} online`:SUMMARY[state]||'';
  q('.players-signin').hidden=state!=='signed-out';
  const naming=state==='needs-nick'||editing;q('.players-nick').hidden=!naming||!hub.user;
  if(naming&&document.activeElement!==input&&!input.value)input.value=hub.nick;
  const toggles=q('.players-toggles');toggles.hidden=!hub.user||state==='needs-nick'||state==='loading';
  const go=q('.players-online');go.disabled=state==='connecting';go.setAttribute('aria-pressed',String(online));go.textContent=online?'Go offline':state==='connecting'?'Connecting…':'Go online';
  q('.players-rename').hidden=editing||!hub.nick;
  const afk=q('.players-afk');afk.hidden=!online;afk.setAttribute('aria-pressed',String(hub.afk));
  if(state==='error'&&!note.textContent)say(hub.error);
  list.replaceChildren(...people.map(p=>{
   const li=el('li','players-row');li.classList.toggle('me',p.me);li.classList.toggle('afk',p.afk);
   const dot=el('i','players-dot');dot.setAttribute('aria-hidden','true');
   const who=el('span','players-who');who.append(el('b',null,p.nick+(p.me?' (you)':'')),el('small',null,p.area+(p.afk?' · Away':'')));
   li.append(dot,who);
   return li;
  }));
  if(!online&&hub.user&&state!=='needs-nick'){const empty=el('li','players-empty',state==='connecting'?'Joining the shared world…':'Go online to see who else is exploring.');list.append(empty);}
 }
 function show(){onOpen?.();say('');editing=false;dirty=true;dialog.showModal();render();}
 function close(){if(dialog.open)dialog.close();}
 button.onclick=()=>show();
 addEventListener('pagehide',()=>{if(hub.state==='online')hub.goOffline(false);});
 return {
  hub,show,close,
  get open(){return dialog.open;},
  // Runs every frame: follows Google sign-in and shares Eli's position while online.
  sync(world){if(cloud.user?.uid!==lastUid){lastUid=cloud.user?.uid;hub.setUser(cloud.user);}hub.sync(world);},
  others:world=>hub.others(world),
  update(visible){button.hidden=!visible;if(dirty)render();}
 };
}
