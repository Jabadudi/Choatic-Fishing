// The collection book (replaces the Creature Index in the Regions game). An open book with four bookmarks:
// Monsters (cards, stars, drops, where they live), Familiars (bond, summon, passives), Sets (one per area) and Explore
// (three goals per map). The left page lists, the right page shows what is picked. It reads the world and changes it
// only through onFamiliar and collectionAction.
import {BOOK_REGIONS,BOOK_CARDS,AREA_SETS,EXPLORATION,STAR_KILLS,cardState,bookScore,setState,exploreState,collectionAction} from './collection.js';
import {FAMILIARS,FAMILIAR_TIERS,familiarPassives,familiarStatus,familiarBonus,describeBonus} from './familiars.js';
import {ANIMAL_TYPES} from './entities.js';
import {LOOT_TABLES,SHARD_CHANCES} from './loot.js';
import {fieldMap} from './field-maps.js';
import {areaFor} from './wilds.js';
import {chanceLabel} from './codex.js';
import {setItemIcon} from './item-icons.js';
import {spriteAssetUrl} from './sprites.js';
const ART={slime:'creatures/slime/slime-0.webp',stump:'creatures/stump/stump-walk-0.webp','shore-crab':'creatures/crab/crab-walk-0.webp','boss-crab':'creatures/mudshell/mudshell-walk-0.webp'};
const LORE={
 slime:'A chibi jelly that hops in bunches of three or four. Weak alone, a nuisance together.',
 stump:'A walking tree stump with a sprout on top. Slower than a slime and tougher, it plods up and swings a root-arm.',
 'shore-crab':'Scuttles across the wet sand of Saltspray Shore in bunches and pinches fast.',
 'boss-crab':'The boss crab of Reedwater Wilds. It guards the east gate of 1.3, shrugs off half of every hit and is never knocked down.'
};
const MAP_LOOK={'dewdrop-meadow':'meadow','mossroot-trail':'trail','saltspray-shore':'shore'};
const SLOTS=15;
const BOOK='<svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M4 5.5C4 4.7 4.7 4 5.5 4H11v16H5.5A1.5 1.5 0 0 1 4 18.5zM20 5.5c0-.8-.7-1.5-1.5-1.5H13v16h5.5c.8 0 1.5-.7 1.5-1.5zM6.5 8h2.5M6.5 11h2.5M15 8h2.5M15 11h2.5"/></svg>';
const esc=s=>String(s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
const stars=n=>`<span class="book-stars" aria-label="${n} of 3 stars">${'★'.repeat(n)}<i>${'★'.repeat(3-n)}</i></span>`;
const img=(species,alt='')=>`<img src="${spriteAssetUrl(ART[species])}" alt="${esc(alt)}" draggable="false">`;
// Level band of a card: the boss's own level, otherwise its map's.
function levelOf(card){
 const f=fieldMap(card.map);if(card.boss){const b=f.bunches.find(b=>b[3]===card.species);return String(b?.[4]?.level??'?');}
 const [lo,hi]=f.levels;return lo===hi?String(lo):`${lo}–${hi}`;
}
export function mountCollection({getWorld,onOpen,onClose,onFamiliar=()=>false}){
 const button=document.createElement('button');button.id='open-codex';button.hidden=true;
 button.setAttribute('aria-label','Open collection book');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML=`${BOOK}<span>Book</span>`;
 document.querySelector('.playfield')?.append(button);
 const dialog=document.createElement('dialog');dialog.id='book-sheet';dialog.setAttribute('aria-label','Collection book');
 dialog.innerHTML=`<div class="book"><div class="book-tabs" role="tablist" aria-label="Book chapters"></div><section class="book-page book-left"></section><section class="book-page book-right"></section><button type="button" class="book-close" aria-label="Close collection book">×</button></div>`;
 document.body.append(dialog);
 const tabs=dialog.querySelector('.book-tabs'),left=dialog.querySelector('.book-left'),right=dialog.querySelector('.book-right');
 const pick={monsters:BOOK_CARDS[0].species,familiars:BOOK_CARDS[0].species,sets:AREA_SETS[0].id,explore:BOOK_REGIONS[0].maps[0]};
 let tab='monsters',sub='info',lastKey='';
 const TABS=[['monsters','Monsters'],['familiars','Familiars'],['sets','Sets'],['explore','Explore']];
 function counts(w){
  return {monsters:`${BOOK_CARDS.filter(c=>cardState(w,c.species).registered).length}/${BOOK_CARDS.length}`,
   familiars:`${BOOK_CARDS.filter(c=>familiarStatus(w,c.species).bonded).length}/${BOOK_CARDS.length}`,
   sets:`${AREA_SETS.filter(s=>setState(w,s.id).done).length}/${AREA_SETS.length}`,
   explore:`${BOOK_REGIONS[0].maps.flatMap(id=>exploreState(w,id).goals).filter(g=>g.done).length}/${BOOK_REGIONS[0].maps.length*3}`};
 }
 function grid(items){
  let h='<div class="book-grid">';
  for(const it of items)h+=`<button type="button" class="book-card ${it.cls||''}" data-pick="${it.id}" aria-current="${it.current}" aria-label="${esc(it.label)}"><span class="book-band">${esc(it.band)}</span>${it.img}${it.foot||''}</button>`;
  for(let i=items.length;i<SLOTS;i++)h+='<span class="book-card book-empty" aria-hidden="true"></span>';
  return h+'</div>';
 }
 function strip(map,boss){
  const f=fieldMap(map),a=areaFor(map);let h=`<div class="book-strip book-${MAP_LOOK[map]||'meadow'}" role="img" aria-label="Where they stand in ${esc(f.code)} ${esc(a.name)}">`;
  for(const [x,y,n,species] of f.bunches){const isBoss=species==='boss-crab';if(isBoss!==!!boss)continue;h+=`<span class="book-dot${isBoss?' boss':''}" style="left:${x/a.width*100}%;top:${y/a.height*100}%">${isBoss?'☠':n}</span>`;}
  return h+'</div>';
 }
 // ---- Monsters
 function monsters(w){
  left.innerHTML=`<div class="book-head"><h2>Monster Cards</h2><span class="book-score">Book score ${bookScore(w)}</span></div>
   <div class="book-chips"><span class="book-chip on">Region 1 · ${esc(BOOK_REGIONS[0].name)}</span></div>
   ${grid(BOOK_CARDS.map(c=>{const s=cardState(w,c.species);return {id:c.species,current:c.species===pick.monsters,label:s.registered?ANIMAL_TYPES[c.species].name:'Undiscovered monster',band:`Lv ${levelOf(c)}`,img:img(c.species),cls:`${s.registered?'':'locked'} ${c.boss?'boss':''}`,foot:s.registered?stars(s.stars):''};}))}
   <p class="book-legend">Defeat a monster once to register its card. Stars at ${STAR_KILLS.join(', ')} kills. Empty slots fill as new maps open.</p>`;
  const card=BOOK_CARDS.find(c=>c.species===pick.monsters),spec=ANIMAL_TYPES[card.species],s=cardState(w,card.species),f=fieldMap(card.map),a=areaFor(card.map);
  let panel='';
  if(sub==='info')panel=`<div class="book-stats"><span><small>Level</small><b>${levelOf(card)}</b></span><span><small>HP</small><b>${spec.maxHealth}</b></span><span><small>Attack</small><b>${spec.attackDamage}</b></span><span><small>XP</small><b>${spec.huntXp}</b></span></div>
   <p>${s.registered?esc(LORE[card.species]):'Defeat this monster once to read its page.'}</p>
   <p class="book-meta">Defeated <b>${s.kills}</b> · ${s.next?`${s.next-s.kills} more for the next star`:'All stars earned'}</p>`;
  if(sub==='drops')panel=`<ul class="book-drops">${LOOT_TABLES[spec.loot].map(e=>`<li><span class="book-icon" data-item="${esc(e.item)}"></span><span><b>${s.registered?esc(e.item):'???'}</b><em>${FAMILIARS[spec.loot]?.shard===e.item?'Familiar shard':'Drop'}</em></span><span class="book-pct">${chanceLabel(e.chance)}</span></li>`).join('')}</ul>
   <p class="book-note">Drop names show once the card is registered. Luck raises the chances below Always.</p>`;
  if(sub==='found'){const n=f.bunches.filter(b=>b[3]===card.species||(!b[3]&&!card.boss)).reduce((t,b)=>t+b[2],0);
   panel=`<p class="book-meta"><b>${esc(f.code)} ${esc(a.name)}</b> · Lv ${f.levels[0]}–${f.levels[1]}</p>${strip(card.map,card.boss)}
   <p>${card.boss?`${esc(spec.name)} waits alone in front of the east gate.`:`${n} of them in ${f.bunches.filter(b=>!b[3]).length} bunches. Each dot is a bunch; the number is how many stand in it.`}</p>`;}
  right.innerHTML=`<div class="book-hero"><div class="book-portrait ${s.registered?'':'locked'}">${img(card.species,spec.name)}</div><div><small class="book-kicker">${card.boss?'Boss · ':''}Region 1 · ${esc(f.code)}</small><h3>${s.registered?esc(spec.name):'???'}</h3>${stars(s.stars)}</div></div>
   <div class="book-subtabs" role="tablist">${[['info','Info'],['drops','Drops'],['found','Found in']].map(([id,l])=>`<button type="button" role="tab" data-sub="${id}" aria-selected="${sub===id}">${l}</button>`).join('')}</div>
   <div class="book-panel">${panel}</div>`;
  for(const icon of right.querySelectorAll('.book-icon'))setItemIcon(icon,icon.dataset.item);
 }
 // ---- Familiars
 function familiars(w){
  const active=w.familiars?.active,on=active&&FAMILIARS[active];
  left.innerHTML=`<div class="book-head"><h2>Familiars</h2><span class="book-score">${BOOK_CARDS.filter(c=>familiarStatus(w,c.species).bonded).length} bonded</span></div>
   <div class="book-summoned"><span class="book-slot">${on&&ART[active]?img(active,on.name):''}</span><div><small class="book-kicker">Summoned</small><b>${on?`${esc(on.name)} · ${esc(on.passive.name)}`:'Nobody'}</b><p class="book-legend">${on?'Follows Eli and gives its passive while summoned.':'Bond a familiar and press Summon.'}</p></div></div>
   ${grid(BOOK_CARDS.map(c=>{const st=familiarStatus(w,c.species);return {id:c.species,current:c.species===pick.familiars,label:FAMILIARS[c.species].name,band:st.bonded?'Bonded':'Shards',img:img(c.species),cls:`${st.bonded?'':'locked'} ${c.boss?'boss':''} ${st.active?'summoned':''}`,foot:`<span class="book-shards"><span>${Math.min(st.shards,FAMILIAR_TIERS[0])}/${FAMILIAR_TIERS[0]}</span><span class="book-bar"><i style="width:${Math.min(100,st.shards/FAMILIAR_TIERS[0]*100)}%"></i></span></span>`};}))}
   <p class="book-legend">Monsters drop familiar shards. ${FAMILIAR_TIERS[0]} shards bond a familiar; ${FAMILIAR_TIERS[1]} make its passive stronger and ${FAMILIAR_TIERS[2]} wake its last one. One familiar follows Eli at a time.</p>`;
  const id=pick.familiars,f=FAMILIARS[id],st=familiarStatus(w,id),passives=familiarPassives(id);
  const action=st.active?['dismiss','Dismiss']:st.bonded?['summon','Summon']:['combine',st.canCombine?`Bond with ${FAMILIAR_TIERS[0]} shards`:`${FAMILIAR_TIERS[0]-st.shards} more shard${FAMILIAR_TIERS[0]-st.shards===1?'':'s'} to bond`];
  right.innerHTML=`<div class="book-hero"><div class="book-portrait ${st.bonded?'':'locked'}">${img(id,f.name)}</div><div><small class="book-kicker">Familiar</small><h3>${esc(f.name)}</h3><p class="book-meta">Shards <b>${st.shards}</b>${st.next?` · next at <b>${st.next}</b>`:''}</p></div></div>
   <small class="book-kicker">Passive buffs</small>
   <ul class="book-passives">${passives.map(p=>`<li class="${st.tier>=p.tier?'':'off'}"><span class="book-rank">${p.shards} shards</span><span><b>${esc(p.name)}</b><br>${esc(p.description)}</span></li>`).join('')}</ul>
   <div class="book-buttons"><button type="button" class="book-btn" data-familiar="${action[0]}" ${action[0]==='combine'&&!st.canCombine?'disabled':''}>${action[1]}</button></div>
   <p class="book-note">Each ${esc(f.name.toLowerCase())} has a ${chanceLabel(SHARD_CHANCES[id])} chance to drop a shard.${on?` Active now from ${esc(on.name)}: ${esc(describeBonus(familiarBonus(active,familiarStatus(w,active).tier)))}.`:''}</p>`;
 }
 // ---- Sets
 function sets(w){
  left.innerHTML=`<div class="book-head"><h2>Area Sets</h2><span class="book-score">${AREA_SETS.filter(s=>setState(w,s.id).done).length}/${AREA_SETS.length} complete</span></div>
   <div class="book-list">${AREA_SETS.map(set=>{const s=setState(w,set.id);return `<button type="button" class="book-row" data-pick="${set.id}" aria-current="${set.id===pick.sets}"><b>${esc(set.name)}</b>${pill(s.claimed,s.done,`${s.have}/${s.total} cards`)}<span class="book-legend">${esc(set.area)}</span><span></span><span class="book-bar"><i style="width:${s.have/s.total*100}%"></i></span></button>`;}).join('')}
    <div class="book-row off"><b>Next area</b><span class="book-pill">Not built</span><span class="book-legend">Each new area brings its own set.</span></div></div>
   <p class="book-legend">An area set is every monster card from that area. Completing it turns on its set effect for good and pays a one-time reward.</p>`;
  const set=AREA_SETS.find(s=>s.id===pick.sets),s=setState(w,set.id),eff=[set.effect.health?`+${set.effect.health} max HP`:'',set.effect.damage?`+${Math.round(set.effect.damage*100)}% damage`:''].filter(Boolean).join(', ');
  right.innerHTML=`<div class="book-head"><h2>${esc(set.name)}</h2>${pill(s.claimed,s.done,'In progress')}</div>
   <small class="book-kicker">${esc(set.area)} · cards needed</small>
   <div class="book-mini">${set.cards.map(sp=>`<span class="${cardState(w,sp).registered?'':'locked'}" title="${esc(ANIMAL_TYPES[sp].name)}">${img(sp,ANIMAL_TYPES[sp].name)}</span>`).join('')}</div>
   <small class="book-kicker">Set effect</small><div class="book-reward"><span class="book-glyph fx">✦</span><span><b>${eff}</b><br><span class="book-legend">${s.done?'Active for good.':'Turns on when the set is complete.'}</span></span></div>
   <small class="book-kicker">Completion reward</small><div class="book-reward"><span class="book-glyph">◆</span><span><b>Wishstone ×${set.reward.wishstones}</b><br><span class="book-legend">Paid once.</span></span></div>
   <div class="book-buttons"><button type="button" class="book-btn" data-claim="claim-set" ${s.done&&!s.claimed?'':'disabled'}>${s.claimed?'Claimed':'Claim reward'}</button></div>
   ${s.done?'':'<p class="book-note">Defeat the grey monsters once to register their cards and finish this set.</p>'}`;
 }
 // ---- Explore
 function explore(w){
  const maps=BOOK_REGIONS[0].maps;
  left.innerHTML=`<div class="book-head"><h2>Exploration</h2><span class="book-score">${counts(w).explore} goals</span></div>
   <div class="book-list">${maps.map(id=>{const e=exploreState(w,id),n=e.goals.filter(g=>g.done).length,f=fieldMap(id);return `<button type="button" class="book-row ex" data-pick="${id}" aria-current="${id===pick.explore}"><b>${esc(f.code)} ${esc(areaFor(id).name)}</b>${pill(e.claimed,e.done,`${n}/3`)}<span class="book-legend">Lv ${f.levels[0]}–${f.levels[1]} · ${esc(rewardText(EXPLORATION[id].reward))}</span><span></span><span class="book-bar"><i style="width:${n/3*100}%"></i></span></button>`;}).join('')}
    <div class="book-row off"><b>1.4 and on</b><span class="book-pill">Not built</span><span class="book-legend">New maps bring their own goals.</span></div></div>
   <p class="book-legend">Every map has three goals. Finishing all three pays the map's reward once.</p>`;
  const id=pick.explore,e=exploreState(w,id),f=fieldMap(id);
  right.innerHTML=`<div class="book-head"><h2>${esc(f.code)} ${esc(areaFor(id).name)}</h2><small class="book-kicker">Lv ${f.levels[0]}–${f.levels[1]}</small></div>
   ${strip(id,false)}
   <ul class="book-goals">${e.goals.map(g=>`<li><span class="book-tick ${g.done?'on':''}">${g.done?'✓':''}</span><span>${esc(g.label)}</span><span class="book-pill ${g.done?'done':''}">${g.done?'Done':'Open'}</span></li>`).join('')}</ul>
   <div class="book-reward"><span class="book-glyph">◆</span><span><b>${esc(rewardText(EXPLORATION[id].reward))}</b><br><span class="book-legend">For finishing all three goals.</span></span></div>
   <div class="book-buttons"><button type="button" class="book-btn" data-claim="claim-explore" ${e.done&&!e.claimed?'':'disabled'}>${e.claimed?'Claimed':'Claim reward'}</button></div>`;
 }
 const pill=(claimed,done,open)=>`<span class="book-pill ${claimed?'done':done?'ready':''}">${claimed?'Claimed':done?'Ready':esc(open)}</span>`;
 const rewardText=r=>[r.marks?`${r.marks} reed marks`:'',r.wishstones?`Wishstone ×${r.wishstones}`:'',r.shard?FAMILIARS[r.shard].shard:''].filter(Boolean).join(' + ');
 function refresh(force=false){
  const w=getWorld();if(!w)return;
  const key=JSON.stringify([tab,sub,pick,w.hunting?.bySpecies,w.familiars,w.collection,w.fieldMaps&&Object.values(w.fieldMaps).map(s=>[s.clears,s.best])]);
  if(!force&&key===lastKey)return;lastKey=key;
  const c=counts(w);
  tabs.innerHTML=TABS.map(([id,l])=>`<button type="button" role="tab" class="book-tab book-tab-${id}" data-tab="${id}" aria-selected="${tab===id}"><span>${l}</span><b>${c[id]}</b></button>`).join('');
  ({monsters,familiars,sets,explore})[tab](w);
 }
 dialog.addEventListener('click',event=>{
  const t=event.target.closest('[data-tab],[data-pick],[data-sub],[data-familiar],[data-claim],.book-close');
  if(!t){if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}return;}
  if(t.disabled)return;
  if(t.classList.contains('book-close')){dialog.close();return;}
  if(t.dataset.tab)tab=t.dataset.tab;
  else if(t.dataset.sub)sub=t.dataset.sub;
  else if(t.dataset.pick)pick[tab]=t.dataset.pick;
  else if(t.dataset.familiar)onFamiliar(pick.familiars,t.dataset.familiar);
  else if(t.dataset.claim)collectionAction(getWorld(),t.dataset.claim,tab==='sets'?pick.sets:pick.explore);
  refresh(true);
 });
 function open(){const w=getWorld();if(!w?.adventure||w.player.health<=0||dialog.open)return;onOpen();refresh(true);dialog.showModal();button.setAttribute('aria-expanded','true');tabs.querySelector('[aria-selected="true"]')?.focus();}
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},
  select(id){if(BOOK_CARDS.some(c=>c.species===id)){tab='monsters';pick.monsters=id;if(dialog.open)refresh(true);}},
  update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
