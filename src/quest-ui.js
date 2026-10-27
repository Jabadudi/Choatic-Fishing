import {questFor,questLog,objectiveProgress,acceptQuest,turnInQuest} from './side-quests.js';
import {MERCHANTS} from './trade.js';
import {markIcon} from './trade-ui.js';
import {setItemIcon} from './item-icons.js';
import {bindingLabel} from './keybinds.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// A rolled notice with a wax seal.
const SCROLL='<path d="M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7M7 4a2 2 0 0 1 2 2v12M11 9h4M11 12h4M11 15h2"/>';
const BADGES={offer:'New mission',active:'Under way',ready:'Ready to hand in',complete:'Complete'};
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
// The quest sheet only reads missions; Accept and Hand over go through side-quests.js, which checks the giver is close by.
export function mountQuests({getWorld,onOpen,onClose,onTrade}){
 const button=document.createElement('button');button.id='open-quests';button.hidden=true;
 button.setAttribute('aria-label','Open quest log');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML=`${svg(SCROLL,22)}<span>Quests</span><b class="quest-count" hidden></b>`;
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='quest-sheet';dialog.setAttribute('aria-labelledby','quest-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(SCROLL,40)}</span><h2 id="quest-title">Quest log</h2><p class="backpack-capacity quest-summary"></p><button class="backpack-close" aria-label="Close quests">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div><div class="quest-body"></div><p class="trade-note quest-note" role="status"></p></div>`;
 document.body.append(dialog);
 const body=dialog.querySelector('.quest-body'),summary=dialog.querySelector('.quest-summary'),note=dialog.querySelector('.quest-note'),title=dialog.querySelector('#quest-title');
 // talkTo is the villager being spoken to; null shows the whole log.
 let talkTo=null,talkName='',lastKey='',done=null;
 function rewards(quest){
  const row=el('div','quest-rewards');row.append(el('span','quest-rewards-label','Reward'));
  const chip=(icon,text)=>{const c=el('span','quest-chip');c.append(icon,el('span',null,text));row.append(c);};
  if(quest.rewards.marks){const icon=el('span','quest-chip-icon');icon.innerHTML=markIcon(16);chip(icon,`${quest.rewards.marks} marks`);}
  if(quest.rewards.xp)chip(el('span','quest-chip-icon quest-xp','XP'),`${quest.rewards.xp}`);
  for(const item of quest.rewards.items||[]){const icon=el('span','quest-chip-icon');setItemIcon(icon,item.name);chip(icon,item.count>1?`${item.name} ×${item.count}`:item.name);}
  return row;
 }
 function card(world,quest,state,{talk=false}={}){
  const article=el('article','quest-card');article.dataset.state=state;
  const head=el('div','quest-card-head'),names=el('div');
  names.append(el('small','quest-kicker',`Side mission · ${quest.giverName}`),el('h3',null,quest.title));head.append(names,el('span','quest-badge',BADGES[state]));article.append(head);
  if(state!=='complete'){
   article.append(el('blockquote','quest-quote',`“${talk&&state==='ready'?'You’re back! Did you manage it?':talk&&state==='active'?quest.reminder:quest.offer}”`));
   if(state==='offer')article.append(el('p','quest-thought',quest.thought));
   const list=el('ul','quest-objectives');
   for(const o of objectiveProgress(world,quest)){
    const li=el('li','quest-objective');li.dataset.done=o.done;
    const mark=el('span','quest-check',o.done?'✓':o.type==='kill'?'⚔':'');if(o.type==='collect'&&!o.done)setItemIcon(mark,o.item);
    const text=el('span','quest-objective-text');text.append(el('strong',null,o.type==='collect'?`Bring ${o.count} ${o.item}`:`${o.label}`));
    const track=el('span','quest-track');track.setAttribute('role','progressbar');track.setAttribute('aria-label',o.label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',String(o.count));track.setAttribute('aria-valuenow',String(o.have));
    const fill=el('i');fill.style.width=`${o.have/o.count*100}%`;track.append(fill);text.append(track);
    li.append(mark,text,el('span','quest-tally',`${o.have} / ${o.count}`));list.append(li);
   }
   article.append(list,el('p','quest-where',quest.where));
  }
  article.append(rewards(quest));
  return article;
 }
 const act=(label,action,primary=false)=>{const b=el('button',`quest-action${primary?' primary':''}`,label);b.onclick=action;return b;};
 function refresh(){
  const world=getWorld(),log=questLog(world),work=talkTo?questFor(world,talkTo):null;
  const key=JSON.stringify([talkTo,done?.id,work?.quest.id,work?.state,log.active.map(e=>[e.quest.id,e.progress.map(o=>o.have)]),log.complete.length]);if(key===lastKey)return;lastKey=key;
  button.querySelector('.quest-count').hidden=!log.active.length;button.querySelector('.quest-count').textContent=String(log.active.length);
  summary.textContent=talkTo?'Willowback · Work for hire':`${log.active.length} under way · ${log.complete.length} complete`;
  const nodes=[];
  if(talkTo){
   title.textContent=talkName;
   if(done){const thanks=el('article','quest-card quest-thanks');thanks.dataset.state='complete';thanks.append(el('small','quest-kicker',`${done.title} · Complete`),el('blockquote','quest-quote',`“${done.done}”`));nodes.push(thanks);}
   if(work){
    const c=card(world,work.quest,work.state,{talk:true}),row=el('div','quest-actions');
    if(work.state==='offer')row.append(act('Accept',()=>{acceptQuest(world,work.quest.id);note.textContent=world.message;lastKey='';refresh();},true),act('Not now',()=>dialog.close()));
    if(work.state==='ready'){const hands=work.quest.objectives.some(o=>o.type==='collect');row.append(act(hands?'Hand over':'Claim reward',()=>{if(turnInQuest(world,work.quest.id))done=work.quest;note.textContent=world.message;lastKey='';refresh();},true));}
    if(work.state==='active')row.append(act('Close',()=>dialog.close()));
    if(MERCHANTS[talkTo])row.append(act('Browse stall',()=>{const id=MERCHANTS[talkTo];dialog.close();onTrade(id);}));
    c.append(row);nodes.push(c);
   }else{
    const row=el('div','quest-actions');row.append(act('Close',()=>dialog.close(),true));
    if(MERCHANTS[talkTo])row.append(act('Browse stall',()=>{const id=MERCHANTS[talkTo];dialog.close();onTrade(id);}));
    nodes.push(row);
   }
  }else{
   title.textContent='Quest log';
   nodes.push(el('h3','quest-section',`Under way · ${log.active.length}`));
   if(!log.active.length)nodes.push(el('p','quest-empty','No missions yet. Villagers in Willowback with work for Eli have a gold ! over their heads.'));
   for(const entry of log.active)nodes.push(card(world,entry.quest,entry.ready?'ready':'active'));
   if(log.complete.length){
    nodes.push(el('h3','quest-section',`Complete · ${log.complete.length}`));
    const list=el('ul','quest-done-list');
    for(const entry of log.complete){const li=el('li');li.append(el('span','quest-check','✓'),el('strong',null,entry.quest.title),el('small',null,entry.quest.giverName));list.append(li);}
    nodes.push(list);
   }
  }
  body.replaceChildren(...nodes);
 }
 function show(npcId=null){
  const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;
  talkTo=npcId;done=null;lastKey='';
  talkName=npcId?world.npcs.find(n=>n.id===npcId)?.name||'Villager':'';
  onOpen();note.textContent=npcId?'':`Talk to a villager with a gold ! to take on work. ${bindingLabel('quests')} opens this log.`;
  refresh();dialog.showModal();button.setAttribute('aria-expanded','true');(dialog.querySelector('.quest-action.primary')||dialog.querySelector('.backpack-close')).focus();
 }
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{talkTo=null;done=null;button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=()=>show();
 return {get open(){return dialog.open;},show,toggle(){dialog.open?dialog.close():show();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open){refresh();return;}if(!visible)return;
  // The badge on the button keeps count of missions under way.
  const count=questLog(getWorld()).active.length,badge=button.querySelector('.quest-count');badge.hidden=!count;if(badge.textContent!==String(count))badge.textContent=String(count);}};
}
