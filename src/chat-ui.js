import {runChat,COMMANDS} from './chat.js';
import {MAX_MESSAGE} from './hub.js';
import {preferences} from './preferences.js';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
// A speech bubble.
const BUBBLE='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5h16v11H10l-5 4v-4H4z"/><path d="M8 9.5h8M8 12.5h5"/></svg>';
const SHOW_FOR=15000;
// The chat box: recent lines fade out over the world; Enter (or the Chat button) opens the line to type in.
export function mountChat({hub,onOpen,onClose}){
 const box=el('section');box.id='chat-box';box.hidden=true;box.setAttribute('aria-label','Chat with friends');
 const log=el('ol','chat-log');log.setAttribute('aria-live','polite');
 const form=el('form','chat-form');form.hidden=true;
 const input=el('input');input.id='chat-input';input.maxLength=MAX_MESSAGE;input.autocomplete='off';input.spellcheck=true;input.setAttribute('aria-label','Message your friends, or type / for a command');input.placeholder='Message friends · / for commands';
 const send=el('button','chat-send','Send');send.type='submit';
 const hint=el('p','chat-hint',`Enter sends · Esc closes · ${COMMANDS.slice(0,4).map(([c])=>c.split(' ')[0]).join(' ')} /help`);
 form.append(input,send);box.append(log,form,hint);hint.hidden=true;
 document.querySelector('.playfield').append(box);
 const open=el('button');open.id='open-chat';open.hidden=true;open.setAttribute('aria-label','Chat with friends');
 open.innerHTML=`${BUBBLE}<span>Chat</span><b class="quest-count chat-unread" hidden></b>`;
 document.querySelector('.playfield').append(open);
 let shown=false,unread=0,drawn=-1,history=[],browsing=-1;
 const line=entry=>{
  const li=el('li',`chat-line ${entry.kind}`);li.dataset.at=entry.at;
  if(entry.kind==='chat'){li.append(el('b',entry.me?'chat-me':'chat-who',`${entry.nick}: `),document.createTextNode(entry.text));}
  else if(entry.kind==='from'){li.append(el('b','chat-who',`${entry.nick} whispers: `),document.createTextNode(entry.text));}
  else if(entry.kind==='to'){li.append(el('b','chat-me',`To ${entry.nick}: `),document.createTextNode(entry.text));}
  else li.textContent=entry.text;
  return li;
 };
 function draw(){
  const now=Date.now(),recent=hub.log.slice(shown?-40:-6);
  log.replaceChildren(...recent.filter(e=>shown||now-e.at<SHOW_FOR).map(line));
  drawn=hub.log.length;log.scrollTop=log.scrollHeight;
 }
 hub.onMessage=entry=>{if(!shown&&!entry.me&&entry.kind!=='note'&&entry.kind!=='error')unread++;};
 function show(prefill=''){if(!available())return;onOpen?.();shown=true;unread=0;box.classList.add('open');form.hidden=false;hint.hidden=false;input.value=prefill;browsing=-1;draw();input.focus();}
 function close(){if(!shown)return;shown=false;box.classList.remove('open');form.hidden=true;hint.hidden=true;input.blur();draw();onClose?.();}
 const available=()=>!!hub.user&&!!hub.nick;
 open.onclick=()=>shown?close():show();
 form.addEventListener('submit',async e=>{
  e.preventDefault();const text=input.value.trim();if(!text){close();return;}
  history=[text,...history.filter(h=>h!==text)].slice(0,20);input.value='';
  try{await runChat(hub,text,{setMuted:list=>preferences.set({mutedFriends:list})});
   if(/^\/(online|offline)\b/i.test(text))preferences.set({hubOnline:hub.state==='online'});}
  catch(error){hub.post({kind:'error',text:error.message||String(error)});input.value=input.value||text;}
 });
 input.addEventListener('keydown',e=>{
  e.stopPropagation();
  if(e.key==='Escape'){e.preventDefault();close();}
  else if(e.key==='ArrowUp'&&history.length){e.preventDefault();browsing=Math.min(history.length-1,browsing+1);input.value=history[browsing];}
  else if(e.key==='ArrowDown'&&browsing>=0){e.preventDefault();browsing--;input.value=browsing<0?'':history[browsing];}
 });
 hub.setMuted(preferences.value.mutedFriends);
 return {
  show,close,
  get open(){return shown;},
  get available(){return available();},
  update(visible){
   const on=visible&&available();box.hidden=!on;open.hidden=!on;if(!on&&shown)close();
   const badge=open.querySelector('.chat-unread');badge.hidden=!unread;badge.textContent=String(unread);
   // Lines fade once they are old, so redraw a few times a second even when nothing new arrived.
   if(on&&(drawn!==hub.log.length||!shown&&log.childElementCount&&Date.now()-Number(log.firstChild?.dataset.at)>SHOW_FOR))draw();
  }
 };
}
