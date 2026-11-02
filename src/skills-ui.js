import {SKILLS,SKILL_IDS,STATS,skillXpToNext,LEVEL_GROWTH} from './skills.js';
import {SKILL_TREES,talentFor,talentState} from './skill-trees.js';
import {FAMILIARS,describeBonus} from './familiars.js';
import {CORE_TIERS,CORE_SKILLS,CORE_SLOTS,TYPE_LABEL,coreSkill,coreSkillLevel,coreSkillState,tierPoints,learnCoreSkill,resetCoreSkills,equipCoreSkill,unequipCoreSkill,equippable,slotOpen,coreSlots,statLines} from './core-skills.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const SKILL_ICONS={
 fishing:'<path d="M5 20L17 4M17 4v9M17 13a2 2 0 1 1-2 2"/>',
 hunting:'<path d="M6 4c6 2 9 8 6 16M6 4v16M6 12h14M17 9l3 3-3 3"/>',
 cooking:'<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM9 4c-1 2 1 3 0 5M14 4c-1 2 1 3 0 5"/>',
 core:'<circle cx="12" cy="12" r="4"/><path d="M12 3v3M12 18v3M3 12h3M18 12h3M5.6 5.6l2.1 2.1M16.3 16.3l2.1 2.1M5.6 18.4l2.1-2.1M16.3 7.7l2.1-2.1"/>'
};
// The character sheet reads progression only; every number on it comes from the simulation.
export function mountSkills({getWorld,onOpen,onClose}){
 const button=document.createElement('button');button.id='open-skills';button.hidden=true;
 button.setAttribute('aria-label','Open skills');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML=`${svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',22)}<span>Skills</span>`;
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='skills-sheet';dialog.setAttribute('aria-labelledby','skills-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',40)}</span><h2 id="skills-title">Skills</h2><p class="backpack-capacity">Skills grow only from success. Each skill level earns a point for that skill’s own tree.</p><button class="backpack-close" aria-label="Close skills">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div><div class="skills-body"><section class="skills-character" aria-label="Character"></section><div class="skills-main"><section class="skills-list" aria-label="Skills"></section><section class="skills-tree" aria-live="polite"></section></div></div></div>`;
 document.body.append(dialog);
 const character=dialog.querySelector('.skills-character'),list=dialog.querySelector('.skills-list'),tree=dialog.querySelector('.skills-tree');let lastKey='',activeSkill=SKILL_IDS[0],selected=null,refocus=null,coreTier=1,coreSelected=null,confirmReset=false;
 const bar=(value,max,label)=>{const track=document.createElement('div');track.className='skills-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',max);track.setAttribute('aria-valuenow',value);const fill=document.createElement('i');fill.style.width=`${Math.min(100,value/max*100)}%`;track.append(fill);return track;};
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 function refresh(){
  const world=getWorld(),p=world.progression,key=JSON.stringify([p.level,p.xp,p.skills,p.skillTrees,p.coreSkills,world.story?.coreIngested,world.story?.callAwakened,Math.ceil(world.player.health),p.familiar,activeSkill,selected,coreTier,coreSelected,confirmReset]);if(key===lastKey)return;lastKey=key;
  const name=el('h3',null,world.player.name==='YOU'?'Explorer':world.player.name),level=el('p','skills-level',`Level ${p.level}`);
  const xp=el('small','skills-xp',`${p.xp} / ${p.xpToNextLevel} XP to level ${p.level+1}`);
  const stats=el('dl','skills-stats');
  const row=(label,value,hint)=>{const term=el('dt',null,label),detail=el('dd',null,String(value));detail.append(el('small',null,hint));stats.append(term,detail);};
  row('Max health',`${Math.ceil(world.player.health)} / ${p.maxHealth}`,`+${LEVEL_GROWTH.health} each level`);
  for(const stat of STATS)row(stat.name,p.stats[stat.id],stat.description);
  // Familiar bonuses are already inside the numbers above; this row says where they come from.
  const active=world.familiars?.active;if(active&&p.familiar)row('Familiar',FAMILIARS[active].name,describeBonus(p.familiar));
  character.replaceChildren(name,level,bar(p.xp,p.xpToNextLevel,'Experience toward next level'),xp,stats);
  list.replaceChildren(...SKILL_IDS.map(id=>{
   const skill=p.skills[id],points=p.skillPoints(id),card=el('button','skills-card'),icon=el('span','skills-icon');icon.innerHTML=svg(SKILL_ICONS[id],30);
   card.type='button';card.dataset.skill=id;card.setAttribute('aria-pressed',String(id===activeSkill));card.onclick=()=>{activeSkill=id;selected=null;refocus=`[data-skill="${id}"]`;refresh();};
   const head=el('div','skills-card-head');head.append(el('h4',null,SKILLS[id].name),el('strong',null,`Lv ${skill.level}`));
   card.append(icon,head,bar(skill.xp,skillXpToNext(skill.level),`${SKILLS[id].name} experience`),el('small',null,`${skill.xp} / ${skillXpToNext(skill.level)} XP`));
   if(points>0)card.append(el('span','skills-points',`${points} point${points>1?'s':''}`));return card;
  }),...(coreAwake(world)?[coreCard(world)]:[]));
  if(activeSkill==='core'&&!coreAwake(world))activeSkill=SKILL_IDS[0];
  if(activeSkill==='core')drawCore(world);else drawTree(p);
  if(refocus){dialog.querySelector(refocus)?.focus();refocus=null;}
 }
 // Talents sit in rows by depth. Roots take their own column, a single-requirement talent sits under its parent
 // and a talent with several requirements spans the columns it joins.
 function layout(talents){
  const place=new Map();let column=0;
  for(const talent of talents){
   if(!talent.requires.length){place.set(talent.id,{row:1,from:++column,to:column});continue;}
   const parents=talent.requires.map(id=>place.get(id));
   place.set(talent.id,{row:1+Math.max(...parents.map(q=>q.row)),from:Math.min(...parents.map(q=>q.from)),to:Math.max(...parents.map(q=>q.to))});
  }
  return {place,columns:column};
 }
 function drawTree(p){
  const id=activeSkill,talents=SKILL_TREES[id],ranks=p.skillTrees[id],points=p.skillPoints(id),{place,columns}=layout(talents);
  const head=el('div','skills-tree-head');head.append(el('h3',null,`${SKILLS[id].name} tree`),el('p','skills-tree-points',points?`${points} ${SKILLS[id].name} point${points>1?'s':''} to spend`:`No ${SKILLS[id].name} points · level ${SKILLS[id].name} to earn more`));
  const grid=el('div','skills-tree-grid');grid.style.setProperty('--tree-columns',columns);
  const feeds=new Set(talents.flatMap(t=>t.requires));
  for(const talent of talents){
   const rank=ranks[talent.id]||0,state=talentState(id,ranks,talent.id),at=place.get(talent.id),node=el('button',`skills-talent is-${state}`);
   node.type='button';node.dataset.talent=talent.id;node.style.gridRow=at.row;node.style.gridColumn=`${at.from} / ${at.to+1}`;
   if(talent.requires.length)node.classList.add('needs');if(talent.requires.length>1)node.classList.add('joins');if(feeds.has(talent.id))node.classList.add('feeds');
   if(talent.requires.every(need=>(ranks[need]||0)>0))node.classList.add('linked');if(rank>0)node.classList.add('learned');
   if(state==='open'&&points>0)node.classList.add('can-learn');
   node.setAttribute('aria-pressed',String(selected===talent.id));node.setAttribute('aria-label',`${talent.name}, rank ${rank} of ${talent.maxRank}${state==='locked'?', locked':''}`);
   const pips=el('span','skills-pips');for(let i=0;i<talent.maxRank;i++)pips.append(el('i',i<rank?'on':null));
   node.append(el('strong',null,talent.name),pips,el('small',null,talent.description));
   node.onclick=()=>{selected=talent.id;refocus=`[data-talent="${talent.id}"]`;refresh();};grid.append(node);
  }
  tree.replaceChildren(head,grid,detail(p,id,ranks,points));
 }
 function detail(p,id,ranks,points){
  const box=el('div','skills-detail'),talent=selected&&talentFor(id,selected);
  if(!talent){box.append(el('p',null,'Choose a talent to see what it does. Points stay in their own skill’s tree.'));return box;}
  const rank=ranks[talent.id]||0,state=talentState(id,ranks,talent.id),learn=el('button','skills-learn');learn.type='button';learn.dataset.learn='';
  const missing=talent.requires.filter(need=>!(ranks[need]>0)).map(need=>talentFor(id,need).name);
  learn.textContent=state==='maxed'?'Mastered':state==='locked'?`Needs ${missing.join(' and ')}`:points?`Learn rank ${rank+1} · 1 point`:`Needs a ${SKILLS[id].name} point`;
  learn.disabled=state!=='open'||!points;
  learn.onclick=()=>{if(getWorld().progression.learn(id,talent.id)){refocus=`[data-learn]:not(:disabled)`;refresh();if(!dialog.contains(document.activeElement))dialog.querySelector(`[data-talent="${talent.id}"]`)?.focus();}};
  const text=el('div');text.append(el('h4',null,talent.name),el('p',null,`${talent.description} · Rank ${rank} / ${talent.maxRank}`));
  box.append(text,learn);return box;
 }
 // Region Core skills: the MapleStory M style menu. Tiers along the top, the tier's skills below, then the chosen
 // skill's numbers with Learn and Equip, then the four wheel slots and SP Reset.
 const coreAwake=world=>!!world.story?.coreIngested;
 const totalCorePoints=world=>CORE_TIERS.reduce((sum,t)=>sum+Math.max(0,tierPoints(world,t.id)),0);
 function coreCard(world){
  const card=el('button','skills-card skills-card-core'),icon=el('span','skills-icon');icon.innerHTML=svg(SKILL_ICONS.core,30);
  card.type='button';card.dataset.skill='core';card.setAttribute('aria-pressed',String(activeSkill==='core'));
  card.onclick=()=>{activeSkill='core';confirmReset=false;refocus='[data-skill="core"]';refresh();};
  const head=el('div','skills-card-head');head.append(el('h4',null,'Region Core'),el('strong',null,`Lv ${world.progression.level}`));
  card.append(icon,head,el('small',null,'Powers of the Reedwater core. Every level gives 1 Core SP for its tier.'));
  const points=totalCorePoints(world);if(points>0)card.append(el('span','skills-points',`${points} SP`));return card;
 }
 const STATE_TEXT={tier:t=>`Opens at Lv ${t.from}`,asleep:()=>'Still asleep in the core',unbuilt:()=>'Not yet awakened',maxed:()=>'Max level',broke:()=>'No SP left in this tier'};
 function drawCore(world){
  const level=world.progression.level;
  const head=el('div','skills-tree-head');head.append(el('h3',null,'Region Core skills'),el('p','skills-tree-points','SP earned in a tier can only be spent in that tier.'));
  const tabs=el('div','core-tiers');tabs.setAttribute('role','tablist');tabs.setAttribute('aria-label','Skill tiers');
  for(const tier of CORE_TIERS){
   const open=level>=tier.from,points=tierPoints(world,tier.id),tab=el('button',`core-tier${open?'':' is-closed'}`);tab.type='button';tab.dataset.coreTier=tier.id;
   tab.setAttribute('role','tab');tab.setAttribute('aria-selected',String(coreTier===tier.id));
   tab.append(el('strong',null,`${tier.id}. ${tier.name}`),el('small',null,`Lv ${tier.from}–${tier.to}`),el('span',null,open?`${points} SP left`:`Opens at Lv ${tier.from}`));
   tab.onclick=()=>{coreTier=tier.id;coreSelected=null;confirmReset=false;refocus=`[data-core-tier="${tier.id}"]`;refresh();};tabs.append(tab);
  }
  const grid=el('div','core-grid');
  for(const skill of CORE_SKILLS.filter(s=>s.tier===coreTier)){
   const lv=coreSkillLevel(world,skill.id),state=coreSkillState(world,skill.id),node=el('button',`skills-talent core-skill is-${state}${lv>0?' learned':''}${state==='open'?' can-learn':''}`);
   node.type='button';node.dataset.coreSkill=skill.id;node.setAttribute('aria-pressed',String(coreSelected===skill.id));
   node.setAttribute('aria-label',`${skill.built?skill.name:'Sealed skill'}, ${TYPE_LABEL[skill.type]}, level ${lv} of ${skill.max}`);
   const top=el('span','core-skill-top');top.append(el('em',`core-type is-${skill.type}`,TYPE_LABEL[skill.type]),el('b',null,`Lv ${lv} / ${skill.max}`));
   node.append(top,el('strong',null,skill.built?skill.name:'???'),el('small',null,skill.built?(STATE_TEXT[state]?.(CORE_TIERS[skill.tier-1])||skill.description):'Not yet awakened'));
   node.onclick=()=>{coreSelected=skill.id;confirmReset=false;refocus=`[data-core-skill="${skill.id}"]`;refresh();};grid.append(node);
  }
  tree.replaceChildren(head,tabs,grid,coreDetail(world),coreSlotsRow(world));
 }
 function coreDetail(world){
  const box=el('div','skills-detail core-detail'),skill=coreSelected&&coreSkill(coreSelected);
  if(!skill){box.append(el('p',null,'Choose a skill to see what it does. Actives and Buffs go in the wheel; Passives are always on.'));return box;}
  const lv=coreSkillLevel(world,skill.id),state=coreSkillState(world,skill.id),text=el('div','core-detail-text');
  if(!skill.built){text.append(el('h4',null,'???'),el('p',null,`${TYPE_LABEL[skill.type]} · Tier ${skill.tier}`),el('p',null,'This power hasn’t awakened yet.'));box.append(text);return box;}
  text.append(el('h4',null,skill.name),el('p',null,`${TYPE_LABEL[skill.type]} · Lv ${lv} / ${skill.max}${skill.requires?.skill?` · Needs ${coreSkill(skill.requires.skill).name} Lv ${skill.requires.level}`:''}`),el('p',null,skill.description));
  const now=statLines(skill.id,Math.max(1,lv)),next=lv<skill.max?statLines(skill.id,lv+1):[];
  if(now.length){
   const list=el('ul','core-stats');
   now.forEach((line,i)=>{const li=el('li',null,lv>0?line:`At Lv 1: ${line}`);if(lv>0&&next[i]&&next[i]!==line)li.append(el('span',null,` → ${next[i].replace(/^[^0-9+−-]*/,'')}`));list.append(li);});
   text.append(list);
  }
  if(skill.maxBonus)text.append(el('p','core-bonus',`At max level: ${skill.maxBonus}`));
  const actions=el('div','core-actions'),learn=el('button','skills-learn');learn.type='button';learn.dataset.coreLearn='';
  learn.textContent=state==='open'?`Learn Lv ${lv+1} · 1 SP`:state==='locked'?`Needs ${coreSkill(skill.requires.skill).name} Lv ${skill.requires.level}`:STATE_TEXT[state]?.(CORE_TIERS[skill.tier-1])||'Learn';
  learn.disabled=state!=='open';
  learn.onclick=()=>{if(learnCoreSkill(getWorld(),skill.id)){refocus='[data-core-learn]:not(:disabled)';refresh();if(!dialog.contains(document.activeElement))dialog.querySelector(`[data-core-skill="${skill.id}"]`)?.focus();}};
  actions.append(learn);
  if(equippable(world,skill.id)){
   const slots=coreSlots(world);
   for(let i=0;i<CORE_SLOTS;i++){if(!slotOpen(world,i))continue;
    const b=el('button','core-equip',slots[i]===skill.id?`In slot ${i+1}`:`Equip to slot ${i+1}`);b.type='button';b.dataset.coreEquip=i;b.disabled=slots[i]===skill.id;
    b.onclick=()=>{if(equipCoreSkill(getWorld(),skill.id,i)){refocus=`[data-core-skill="${skill.id}"]`;refresh();}};actions.append(b);}
  }
  box.append(text,actions);return box;
 }
 function coreSlotsRow(world){
  const row=el('div','core-slots'),slots=coreSlots(world),list=el('div','core-slot-list');
  for(let i=0;i<CORE_SLOTS;i++){
   const open=slotOpen(world,i),id=slots[i],skill=id&&coreSkill(id),cell=el('div',`core-slot${open?'':' is-sealed'}${open&&!skill?' is-empty':''}`);
   cell.append(el('small',null,`Slot ${i+1}`),el('strong',null,!open?'Sealed':skill?(coreSkillLevel(world,id)>0?skill.name:'???'):'Empty'));
   if(open&&skill){const x=el('button','core-slot-remove','×');x.type='button';x.dataset.coreRemove=i;x.setAttribute('aria-label',`Remove ${skill.name} from slot ${i+1}`);x.onclick=()=>{if(unequipCoreSkill(getWorld(),i)){refocus='.core-reset';refresh();}};cell.append(x);}
   list.append(cell);
  }
  const reset=el('button',`core-reset${confirmReset?' is-confirming':''}`,confirmReset?'Tap again to reset all Core SP':'SP Reset');reset.type='button';
  reset.onclick=()=>{if(!confirmReset){confirmReset=true;refocus='.core-reset';refresh();return;}confirmReset=false;resetCoreSkills(getWorld());refocus='.core-reset';refresh();};
  row.append(el('h4',null,'Wheel slots'),list,reset);return row;
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();lastKey='';refresh();dialog.showModal();button.setAttribute('aria-expanded','true');}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
