import {Hub,NICK_RULES} from './hub.js';
import {realtimeBackend} from './hub-backend.js';
import {FIREBASE_CONFIG} from './cloud-save.js';
import {preferences} from './preferences.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// Two figures side by side.
const PEOPLE='<circle cx="8.5" cy="8" r="3"/><circle cx="16.5" cy="9" r="2.5"/><path d="M3 20c0-3.4 2.5-6 5.5-6s5.5 2.6 5.5 6M14 14.6c.8-.4 1.6-.6 2.5-.6 2.5 0 4.5 2.2 4.5 5"/>';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const button=(text,className,onclick)=>{const b=el('button',className,text);b.type='button';b.onclick=onclick;return b;};
// The Friends sheet: sign in, pick a nickname, add friends, go online, and see where friends are.
export function mountHub({cloud,onOpen,onClose}){
 const backend=cloud.backendPromise.then(b=>realtimeBackend(b.fb,b.app,FIREBASE_CONFIG.databaseURL));backend.catch(()=>{});
 const hub=new Hub({backend,onChange:()=>{dirty=true;}});
 hub.wantOnline=preferences.value.hubOnline;
 const open=el('button');open.id='open-players';open.hidden=true;
 open.setAttribute('aria-label','Friends');open.setAttribute('aria-haspopup','dialog');
 open.innerHTML=`${svg(PEOPLE,22)}<span>Friends</span><b class="quest-count players-count" hidden></b>`;
 document.querySelector('.playfield').append(open);
 const dialog=el('dialog');dialog.id='players-sheet';dialog.setAttribute('aria-labelledby','players-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(PEOPLE,40)}</span><h2 id="players-title">Friends</h2><p class="backpack-capacity players-summary"></p><button class="backpack-close" aria-label="Close friends">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div>
<div class="players-body">
 <section class="players-me">
  <div class="players-signin" hidden><p>Sign in with Google to play alongside your friends. You only ever see friends you have both agreed to, and they only see your nickname and where you walk. Your story and items stay your own.</p><button type="button" class="players-signin-button">Sign in with Google</button></div>
  <form class="players-nick" hidden><label for="players-nick-input">Your nickname</label><div class="players-nick-row"><input id="players-nick-input" maxlength="16" autocomplete="off" spellcheck="false"><button type="submit">Save name</button></div><small>${NICK_RULES} Friends find you by this name and never see your Google name.</small></form>
  <div class="players-toggles"><button type="button" class="players-online" aria-pressed="false"></button><button type="button" class="players-afk" aria-pressed="false">Away (AFK)</button><button type="button" class="players-rename">Change name</button></div>
 </section>
 <form class="players-add" hidden><label for="players-add-input">Add a friend</label><div class="players-nick-row"><input id="players-add-input" maxlength="16" autocomplete="off" spellcheck="false" placeholder="Their nickname"><button type="submit">Send request</button></div></form>
 <section class="players-requests" hidden><h3>Friend requests</h3><ul class="players-list"></ul></section>
 <section class="players-friends" hidden><h3>Your friends</h3><ul class="players-list" aria-label="Friends"></ul></section>
</div>
<p class="trade-note players-note" role="status"></p></div>`;
 document.body.append(dialog);
 const q=selector=>dialog.querySelector(selector),note=q('.players-note'),input=q('#players-nick-input'),addInput=q('#players-add-input');
 let dirty=true,lastUid,editing=false,removing=null;
 const say=text=>{note.textContent=text;};
 const attempt=async action=>{try{await action();}catch(error){say(error.message||String(error));}dirty=true;};
 q('.backpack-close').onclick=()=>close();
 dialog.addEventListener('close',()=>{onClose?.();});
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 q('.players-signin-button').onclick=()=>attempt(()=>cloud.signIn());
 q('.players-nick').addEventListener('submit',e=>{e.preventDefault();attempt(async()=>{await hub.setNick(input.value);editing=false;say(`Your friends now see you as ${hub.nick}.`);if(hub.wantOnline)await hub.goOnline();});});
 q('.players-add').addEventListener('submit',e=>{e.preventDefault();attempt(async()=>{const name=addInput.value.trim(),result=await hub.addByName(name);addInput.value='';say(result==='accepted'?`You and ${name} are now friends.`:`Request sent. ${name} will see it next time they open Friends.`);});});
 q('.players-online').onclick=()=>attempt(async()=>{if(hub.state==='online'){await hub.goOffline();preferences.set({hubOnline:false});say('You are offline. Your friends cannot see you.');}else{await hub.goOnline();if(hub.state==='online'){preferences.set({hubOnline:true});say('You are online. Friends in the same area can see you.');}}});
 q('.players-rename').onclick=()=>{editing=true;input.value=hub.nick;dirty=true;render();input.focus();};
 q('.players-afk').onclick=()=>{hub.setAfk(!hub.afk);dirty=true;};
 const SUMMARY={'signed-out':'Not signed in',loading:'Checking your account…','needs-nick':'Pick a nickname',offline:'You are offline',connecting:'Connecting…',online:'You are online',error:'You are offline'};
 function row(p){
  const li=el('li','players-row');li.classList.toggle('me',p.me);li.classList.toggle('afk',p.afk);li.classList.toggle('offline',!p.online);
  const dot=el('i','players-dot');dot.setAttribute('aria-hidden','true');
  const who=el('span','players-who');who.append(el('b',null,p.nick+(p.me?' (you)':'')),el('small',null,p.online?p.area+(p.afk?' · Away':''):'Offline'));
  li.append(dot,who);return li;
 }
 function render(){
  dirty=false;const state=hub.state,online=state==='online',ready=!!hub.user&&!!hub.nick&&state!=='loading';
  const count=open.querySelector('.players-count'),waiting=hub.requests.size,friendsOnline=hub.friendsOnline;
  count.hidden=!waiting&&!friendsOnline;count.textContent=String(waiting||friendsOnline);count.classList.toggle('players-asking',waiting>0);
  open.setAttribute('aria-label',waiting?`Friends, ${waiting} request${waiting>1?'s':''} waiting`:friendsOnline?`Friends, ${friendsOnline} online`:'Friends');
  if(!dialog.open)return;
  q('.players-summary').textContent=SUMMARY[state]||'';
  q('.players-signin').hidden=state!=='signed-out';
  const naming=!!hub.user&&(state==='needs-nick'||editing);q('.players-nick').hidden=!naming;
  q('.players-toggles').hidden=!ready;
  const go=q('.players-online');go.disabled=state==='connecting';go.setAttribute('aria-pressed',String(online));go.textContent=online?'Go offline':state==='connecting'?'Connecting…':'Go online';
  q('.players-rename').hidden=editing;
  const afk=q('.players-afk');afk.hidden=!online;afk.setAttribute('aria-pressed',String(hub.afk));
  q('.players-add').hidden=!ready;
  if(state==='error'&&!note.textContent)say(hub.error);
  const requests=[...hub.requests.values()];q('.players-requests').hidden=!ready||!requests.length;
  q('.players-requests ul').replaceChildren(...requests.map(r=>{const li=el('li','players-row');const who=el('span','players-who');who.append(el('b',null,r.nick),el('small',null,'Wants to be friends'));
   const actions=el('span','players-actions');actions.append(button('Accept','players-accept',()=>attempt(async()=>{await hub.answer(r.uid,true);say(`You and ${r.nick} are now friends.`);})),button('Decline','',()=>attempt(()=>hub.answer(r.uid,false))));
   li.append(el('i','players-dot'),who,actions);return li;}));
  const people=hub.roster();q('.players-friends').hidden=!ready;
  const rows=people.map(p=>{const li=row(p);if(!p.me){const actions=el('span','players-actions');
   if(removing===p.uid)actions.append(button(`Remove ${p.nick}`,'players-remove-confirm',()=>attempt(async()=>{removing=null;await hub.unfriend(p.uid);say(`${p.nick} is no longer your friend.`);})),button('Keep','',()=>{removing=null;render();}));
   else actions.append(button('Remove','players-remove',()=>{removing=p.uid;render();}));li.append(actions);}return li;});
  if(people.length<2)rows.push(el('li','players-empty','No friends yet. Ask a friend for their nickname and send them a request.'));
  else if(!online)rows.push(el('li','players-empty','Go online to see where your friends are.'));
  q('.players-friends ul').replaceChildren(...rows);
 }
 function show(){onOpen?.();say('');editing=false;removing=null;dirty=true;dialog.showModal();render();}
 function close(){if(dialog.open)dialog.close();}
 open.onclick=()=>show();
 addEventListener('pagehide',()=>{if(hub.state==='online')hub.goOffline(false);});
 return {
  hub,show,close,
  get open(){return dialog.open;},
  // Runs every frame: follows Google sign-in and shares Eli's position while online.
  sync(world){if(cloud.user?.uid!==lastUid){lastUid=cloud.user?.uid;hub.setUser(cloud.user);}hub.sync(world);},
  others:world=>hub.others(world),
  update(visible){open.hidden=!visible;if(dirty)render();}
 };
}
