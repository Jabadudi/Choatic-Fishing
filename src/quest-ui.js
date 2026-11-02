import {questFor,questLog,objectiveProgress,acceptQuest,turnInQuest} from './side-quests.js';
import {MERCHANTS} from './trade.js';
import {markIcon} from './trade-ui.js';
import {setItemIcon} from './item-icons.js';
import {bindingLabel} from './keybinds.js';
import {storyJournal,STORY_CHAPTERS,targetHint} from './story-quests.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// A rolled notice with a wax seal.
const SCROLL='<path d="M7 4h11a2 2 0 0 1 2 2v1h-4M7 4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h9a2 2 0 0 0 2-2V7M7 4a2 2 0 0 1 2 2v12M11 9h4M11 12h4M11 15h2"/>';
const ICONS={
 story:'<path d="M4 5c3-1.5 5.5-1.5 8 0v14c-2.5-1.5-5-1.5-8 0zM20 5c-3-1.5-5.5-1.5-8 0v14c2.5-1.5 5-1.5 8 0z"/>',
 side:SCROLL,
 done:'<path d="M5 12.5l4.5 4.5L19 7.5"/>',
 map:'<path d="M3 6l6-2 6 2 6-2v14l-6 2-6-2-6 2zM9 4v14M15 6v14"/>',
 close:'<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',
 next:'<circle cx="12" cy="12" r="8"/><circle cx="12" cy="12" r="3"/>',
 chevron:'<path d="M9 6l6 6-6 6"/>'
};
const BADGES={locked:'Locked',offer:'New mission',active:'Under way',ready:'Ready to hand in',complete:'Complete'};
const TABS=[['story','Story'],['side','Side'],['done','Done']];
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const icon=(name,size=22)=>{const s=el('span','quest-icon');s.innerHTML=svg(ICONS[name],size);return s;};
// The quest log has three faces: what a villager offers when you talk to them, the full log (chapters and side
// missions, J), and the journal drawer that slides in beside the game from the HUD tracker. All of them only read
// the world; Accept and Hand over go through side-quests.js, which checks the giver is close by.
export function mountQuests({getWorld,onOpen,onClose,onTrade,onMap}){
 const button=document.createElement('button');button.id='open-quests';button.hidden=true;
 button.setAttribute('aria-label','Open quest log');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML=`${svg(SCROLL,22)}<span>Quests</span><b class="quest-count" hidden></b>`;
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='quest-sheet';dialog.setAttribute('aria-labelledby','quest-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(SCROLL,40)}</span><h2 id="quest-title">Quest log</h2><p class="backpack-capacity quest-summary"></p><button class="backpack-close" aria-label="Close quests">${svg(ICONS.close,26)}</button></div><div class="quest-body"></div><p class="trade-note quest-note" role="status"></p></div>`;
 document.body.append(dialog);
 const drawer=document.createElement('dialog');drawer.id='quest-drawer';drawer.setAttribute('aria-label','Journal');
 document.body.append(drawer);
 const body=dialog.querySelector('.quest-body'),summary=dialog.querySelector('.quest-summary'),note=dialog.querySelector('.quest-note'),title=dialog.querySelector('#quest-title');
 // talkTo is the villager being spoken to; null shows the whole log. tab and pick choose what the log shows.
 let talkTo=null,talkName='',lastKey='',done=null,tab='story',pick='story',drawerTab='story',drawerKey='';
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
  // The story behind the job, told the way the chapters are. Kept short so the card still fits a phone.
  if(quest.lore){const lore=el('details','quest-lore');lore.open=state==='offer'||state==='complete';lore.append(el('summary',null,'The story'),el('p',null,quest.lore));article.append(lore);}
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
 // The story pieces shared by the log and the drawer.
 function pips(progress){
  const row=el('div','quest-pips');row.setAttribute('role','progressbar');row.setAttribute('aria-valuemin','0');row.setAttribute('aria-valuemax',String(progress.total));row.setAttribute('aria-valuenow',String(progress.have));row.setAttribute('aria-label',`${progress.have} of ${progress.total}${progress.unit?` ${progress.unit}`:''}`);
  // Long counts (a 20-second hold) draw as one bar; short ones as one pip per step.
  if(progress.total>12){const bar=el('span','quest-pip-bar'),fill=el('i');fill.style.width=`${progress.have/progress.total*100}%`;bar.append(fill);row.append(bar);}
  else for(let i=0;i<progress.total;i++)row.append(el('i',i<progress.have?'on':i===progress.have?'next':''));
  row.append(el('b',null,`${progress.have} / ${progress.total}${progress.unit?` ${progress.unit}`:''}`));
  return row;
 }
 function nowCard(journal){
  const box=el('section','quest-now');box.dataset.finished=journal.finished;
  box.append(el('small','quest-now-kicker',journal.finished?'Chapter complete':'Now'),el('h4',null,journal.now.title),el('p','quest-now-body',journal.now.body));
  if(journal.now.progress)box.append(pips(journal.now.progress));
  if(journal.target){const next=el('p','quest-next');next.append(icon('next',16),el('span',null,`Next: ${targetHint(journal.target)}`));box.append(next);}
  return box;
 }
 function stepList(steps,more){
  const list=el('ol','quest-steps');
  steps.forEach((step,i)=>{const li=el('li');li.dataset.state=step.state;li.append(el('span','quest-step-mark',step.state==='done'?'✓':step.state==='current'?String(i+1):''),el('span',null,step.title));list.append(li);});
  if(more){const li=el('li');li.dataset.state='locked';li.append(el('span','quest-step-mark'),el('span',null,'The rest of the chapter unlocks as you go'));list.append(li);}
  return list;
 }
 const mapButton=(journal,primary=true)=>{
  const b=el('button',`quest-action quest-map${primary?' primary':''}`);b.append(icon('map',18),el('span',null,'Show on map'));
  b.disabled=!journal?.target||!onMap;if(b.disabled)b.title='Nothing to find on the map for this step';
  b.onclick=()=>{const target=journal.target;dialog.close();drawer.close();onMap?.(target);};
  return b;
 };
 function chapterDetail(journal){
  const wrap=el('div','quest-detail quest-story');
  const banner=el('header','quest-banner');banner.append(el('small',null,`Chapter ${journal.number} · Main story`),el('h3',null,journal.title));
  const columns=el('div','quest-columns'),left=el('div','quest-col'),right=el('div','quest-col');
  left.append(nowCard(journal));
  right.append(el('h5','quest-label','The story so far'),el('p','quest-recap',journal.recap),el('h5','quest-label','Steps'),stepList(journal.steps,journal.more));
  columns.append(left,right);
  const foot=el('div','quest-foot');foot.append(mapButton(journal),act('Back to the game',()=>dialog.close()));
  wrap.append(banner,columns,foot);return wrap;
 }
 function pastDetail(chapter){
  const wrap=el('div','quest-detail quest-story');
  const banner=el('header','quest-banner');banner.dataset.done='true';banner.append(el('small',null,`Chapter ${chapter.n} · Complete`),el('h3',null,chapter.title));
  const columns=el('div','quest-columns'),left=el('div','quest-col'),right=el('div','quest-col');
  left.append(el('h5','quest-label','The story so far'),el('p','quest-recap',chapter.recap));
  right.append(el('h5','quest-label','Steps'),stepList(chapter.steps.map(([,title])=>({title,state:'done'})),false));
  columns.append(left,right);wrap.append(banner,columns);return wrap;
 }
 // One row in the log's list: a chapter or a side mission.
 function entry({id,heading,sub,state,tag,tally}){
  const b=el('button','quest-entry');b.dataset.state=state;b.dataset.pick=id;b.setAttribute('aria-pressed',String(pick===id));
  const text=el('span','quest-entry-text');text.append(el('strong',null,heading),el('small',null,sub));
  b.append(el('span','quest-entry-mark'),text);
  if(tag)b.append(el('span','quest-entry-tag',tag));else if(tally)b.append(el('span','quest-entry-tally',tally));
  b.onclick=()=>{pick=id;lastKey='';refresh();body.querySelector('.quest-detail')?.focus?.();};
  return b;
 }
 function logEntries(world,journal,log){
  const rows=[];
  if(tab==='story'){
   rows.push(el('h3','quest-section','Main story'));
   if(journal)rows.push(entry({id:'story',heading:`Chapter ${journal.number} · ${journal.title}`,sub:journal.finished?'Complete · the next chapter is coming':`${journal.now.title}${journal.now.progress?` · ${journal.now.progress.have}/${journal.now.progress.total}`:''}`,state:'current',tag:'Now'}));
   else rows.push(el('p','quest-empty','No story in this journey.'));
   for(const past of (journal?.past||[]).slice(0,2))rows.push(entry({id:`chapter-${past.number}`,heading:`Chapter ${past.number} · ${past.title}`,sub:'Complete',state:'done'}));
   if((journal?.past||[]).length>2){const more=el('button','quest-entry quest-more');more.append(el('span','quest-entry-mark'),el('span','quest-entry-text',`Earlier chapters (${journal.past.length-2})`),icon('chevron',16));more.onclick=()=>{tab='done';lastKey='';refresh();};rows.push(more);}
  }
  if(tab==='story'||tab==='side'){
   rows.push(el('h3','quest-section',`Side missions · ${log.active.length}`));
   if(!log.active.length)rows.push(el('p','quest-empty','No missions yet. Villagers with work for Eli have a gold ! over their heads.'));
   for(const e of log.active){const have=e.progress.reduce((n,o)=>n+Math.min(o.have,o.count),0),need=e.progress.reduce((n,o)=>n+o.count,0);rows.push(entry({id:`side-${e.quest.id}`,heading:e.quest.title,sub:e.ready?`${e.quest.giverName} · ready to hand in`:e.quest.giverName,state:e.ready?'ready':'active',tally:`${have} / ${need}`}));}
  }
  if(tab==='done'){
   rows.push(el('h3','quest-section','Chapters'));
   const past=journal?.past||[];if(!past.length)rows.push(el('p','quest-empty','No chapters finished yet.'));
   for(const c of past)rows.push(entry({id:`chapter-${c.number}`,heading:`Chapter ${c.number} · ${c.title}`,sub:'Complete',state:'done'}));
   rows.push(el('h3','quest-section',`Side missions · ${log.complete.length}`));
   if(!log.complete.length)rows.push(el('p','quest-empty','No side missions finished yet.'));
   for(const e of log.complete)rows.push(entry({id:`side-${e.quest.id}`,heading:e.quest.title,sub:e.quest.giverName,state:'done'}));
  }
  return rows;
 }
 function detailFor(world,journal,log){
  if(pick==='story'&&journal)return chapterDetail(journal);
  if(pick.startsWith('chapter-')){const chapter=STORY_CHAPTERS.find(c=>`chapter-${c.n}`===pick);if(chapter)return pastDetail(chapter);}
  if(pick.startsWith('side-')){
   const id=pick.slice(5),active=log.active.find(e=>e.quest.id===id),finished=log.complete.find(e=>e.quest.id===id);
   if(active||finished){const wrap=el('div','quest-detail quest-side');wrap.append(card(world,(active||finished).quest,finished?'complete':active.ready?'ready':'active'));return wrap;}
  }
  const wrap=el('div','quest-detail quest-blank');wrap.append(el('p','quest-empty','Pick a chapter or a mission to read about it.'));return wrap;
 }
 // Keep the picked entry valid for the tab, so the detail never shows something the list doesn't.
 function settlePick(journal,log){
  const ids=new Set([...(journal?['story',...journal.past.map(c=>`chapter-${c.number}`)]:[]),...log.active.map(e=>`side-${e.quest.id}`),...log.complete.map(e=>`side-${e.quest.id}`)]);
  const fits=tab==='story'?true:tab==='side'?pick.startsWith('side-')&&log.active.some(e=>`side-${e.quest.id}`===pick):pick!=='story'&&ids.has(pick);
  if(ids.has(pick)&&fits)return;
  pick=tab==='side'?(log.active[0]?`side-${log.active[0].quest.id}`:'none'):tab==='done'?(journal?.past[0]?`chapter-${journal.past[0].number}`:log.complete[0]?`side-${log.complete[0].quest.id}`:'none'):journal?'story':(log.active[0]?`side-${log.active[0].quest.id}`:'none');
 }
 function fullLog(world){
  const journal=storyJournal(world),log=questLog(world);settlePick(journal,log);
  const key=JSON.stringify(['log',tab,pick,journal&&[journal.number,journal.now,journal.steps.length,journal.target?.label,journal.target?.paces],log.active.map(e=>[e.quest.id,e.progress.map(o=>o.have)]),log.complete.length]);
  if(key===lastKey)return;lastKey=key;
  title.textContent='Quest log';summary.textContent=`${journal?`Chapter ${journal.number}${journal.finished?' complete':' under way'} · `:''}${log.active.length} side mission${log.active.length===1?'':'s'}`;
  const layout=el('div','quest-log'),rail=el('nav','quest-rail'),list=el('div','quest-list');rail.setAttribute('aria-label','Quest log sections');
  for(const [id,label] of TABS){const b=el('button','quest-tab');b.setAttribute('aria-pressed',String(tab===id));b.append(icon(id==='side'?'side':id,22),el('span',null,label));
   if(id==='side'&&log.active.length){const n=el('b','quest-tab-count',String(log.active.length));b.append(n);}
   b.onclick=()=>{tab=id;pick='none';lastKey='';refresh();};rail.append(b);}
  // On phones the list folds into one picker above the detail.
  const picker=el('select','quest-picker');picker.setAttribute('aria-label','Choose a chapter or mission');
  const rows=logEntries(world,journal,log);
  for(const row of rows)if(row.dataset?.pick){const o=el('option',null,row.querySelector('strong').textContent);o.value=row.dataset.pick;o.selected=row.dataset.pick===pick;picker.append(o);}
  picker.hidden=picker.options.length<2;picker.onchange=()=>{pick=picker.value;lastKey='';refresh();};
  list.append(...rows);
  const main=el('div','quest-main');main.append(picker,detailFor(world,journal,log));
  layout.append(rail,list,main);body.replaceChildren(layout);
 }
 function talkView(world){
  const log=questLog(world),work=questFor(world,talkTo);
  const key=JSON.stringify(['talk',talkTo,done?.id,work?.quest.id,work?.state,log.active.map(e=>[e.quest.id,e.progress.map(o=>o.have)])]);if(key===lastKey)return;lastKey=key;
  title.textContent=talkName;summary.textContent='Willowback · Work for hire';
  const nodes=[];
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
  body.replaceChildren(...nodes);
 }
 function refresh(){
  const world=getWorld(),count=questLog(world).active.length,badge=button.querySelector('.quest-count');
  badge.hidden=!count;if(badge.textContent!==String(count))badge.textContent=String(count);
  dialog.dataset.mode=talkTo?'talk':'log';
  if(talkTo)talkView(world);else fullLog(world);
 }
 // The drawer: the chapter's Now card and steps, or the side missions, with the game still in view beside it.
 function refreshDrawer(){
  const world=getWorld(),journal=storyJournal(world),log=questLog(world);
  const key=JSON.stringify([drawerTab,journal&&[journal.number,journal.now,journal.steps.length,journal.target?.label,journal.target?.paces],log.active.map(e=>[e.quest.id,e.progress.map(o=>o.have)])]);
  if(key===drawerKey)return;drawerKey=key;
  const head=el('div','quest-drawer-head');head.append(icon('side',22),el('h2',null,'Journal'));
  const tabs=el('div','quest-drawer-tabs');
  for(const [id,label] of [['story','Story'],['side',`Side · ${log.active.length}`]]){const b=el('button',null,label);b.setAttribute('aria-pressed',String(drawerTab===id));b.onclick=()=>{drawerTab=id;drawerKey='';refreshDrawer();};tabs.append(b);}
  const close=el('button','quest-drawer-close');close.setAttribute('aria-label','Close the journal');close.innerHTML=svg(ICONS.close,18);close.onclick=()=>drawer.close();
  head.append(tabs,close);
  const content=el('div','quest-drawer-body');
  if(drawerTab==='story'){
   if(journal){content.append(el('small','quest-drawer-kicker',`Chapter ${journal.number} · ${journal.title}`),nowCard(journal),stepList(journal.steps,journal.more));const recap=el('p','quest-recap',journal.recap);recap.classList.add('quest-drawer-recap');content.append(recap);}
   else content.append(el('p','quest-empty','No story in this journey.'));
  }else{
   if(!log.active.length)content.append(el('p','quest-empty','No missions yet. Villagers with work for Eli have a gold ! over their heads.'));
   for(const e of log.active){const row=el('button','quest-entry');row.dataset.state=e.ready?'ready':'active';const have=e.progress.reduce((n,o)=>n+Math.min(o.have,o.count),0),need=e.progress.reduce((n,o)=>n+o.count,0);
    const text=el('span','quest-entry-text');text.append(el('strong',null,e.quest.title),el('small',null,e.ready?`${e.quest.giverName} · ready to hand in`:e.quest.where));row.append(el('span','quest-entry-mark'),text,el('span','quest-entry-tally',`${have} / ${need}`));
    row.onclick=()=>{drawer.close();showLog('side',`side-${e.quest.id}`);};content.append(row);}
  }
  const foot=el('div','quest-drawer-foot');
  if(drawerTab==='story'&&journal)foot.append(mapButton(journal));
  const full=el('button','quest-drawer-full');full.append(el('span',null,'Open the full quest log'),icon('chevron',16));full.onclick=()=>{drawer.close();showLog(drawerTab);};
  foot.append(full);
  drawer.replaceChildren(head,content,foot);
 }
 const canShow=()=>{const world=getWorld();return world.adventure&&world.player.health>0&&!dialog.open&&!drawer.open;};
 function show(npcId=null){
  if(!canShow())return;
  const world=getWorld();talkTo=npcId;done=null;lastKey='';
  talkName=npcId?world.npcs.find(n=>n.id===npcId)?.name||'Villager':'';
  onOpen();note.textContent=npcId?'':`${bindingLabel('quests')} opens this log. Tap the quest tracker for a quick look while you play.`;
  refresh();dialog.showModal();button.setAttribute('aria-expanded','true');(dialog.querySelector('.quest-action.primary:not(:disabled)')||dialog.querySelector('.backpack-close')).focus();
 }
 function showLog(nextTab='story',nextPick=null){tab=TABS.some(([id])=>id===nextTab)?nextTab:'story';if(nextPick)pick=nextPick;show();}
 function showDrawer(){
  if(!canShow())return;
  drawerKey='';onOpen();refreshDrawer();drawer.showModal();(drawer.querySelector('.quest-map:not(:disabled)')||drawer.querySelector('.quest-drawer-close')).focus();
 }
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{talkTo=null;done=null;button.setAttribute('aria-expanded','false');if(!drawer.open)onClose();});
 drawer.addEventListener('close',()=>{if(!dialog.open)onClose();});
 for(const sheet of [dialog,drawer])sheet.addEventListener('click',event=>{if(event.target===sheet){const r=sheet.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)sheet.close();}});
 button.onclick=()=>showLog();
 return {get open(){return dialog.open||drawer.open;},show,showLog,showDrawer,toggle(){if(dialog.open||drawer.open){dialog.close();drawer.close();}else showLog();},close(){if(dialog.open)dialog.close();if(drawer.open)drawer.close();},update(visible){button.hidden=!visible;if(!visible){if(dialog.open)dialog.close();if(drawer.open)drawer.close();return;}if(dialog.open)refresh();if(drawer.open)refreshDrawer();if(dialog.open||drawer.open)return;
  // The badge on the button keeps count of missions under way.
  const count=questLog(getWorld()).active.length,badge=button.querySelector('.quest-count');badge.hidden=!count;if(badge.textContent!==String(count))badge.textContent=String(count);}};
}
