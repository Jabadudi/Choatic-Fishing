import {SKILLS,SKILL_IDS,STATS,skillXpToNext,LEVEL_GROWTH} from './skills.js';
import {FAMILIARS,describeBonus} from './familiars.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const SKILL_ICONS={
 fishing:'<path d="M5 20L17 4M17 4v9M17 13a2 2 0 1 1-2 2"/>',
 hunting:'<path d="M6 4c6 2 9 8 6 16M6 4v16M6 12h14M17 9l3 3-3 3"/>',
 cooking:'<path d="M4 11h16v3a6 6 0 0 1-6 6h-4a6 6 0 0 1-6-6zM9 4c-1 2 1 3 0 5M14 4c-1 2 1 3 0 5"/>'
};
// The character sheet reads progression only; every number on it comes from the simulation.
export function mountSkills({getWorld,onOpen,onClose}){
 const button=document.createElement('button');button.id='open-skills';button.hidden=true;
 button.setAttribute('aria-label','Open skills');button.setAttribute('aria-haspopup','dialog');button.setAttribute('aria-expanded','false');
 button.innerHTML=`${svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',22)}<span>Skills</span>`;
 document.querySelector('.playfield').append(button);
 const dialog=document.createElement('dialog');dialog.id='skills-sheet';dialog.setAttribute('aria-labelledby','skills-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg('<path d="M12 3l2.5 5.5L20 9l-4 4 1 6-5-3-5 3 1-6-4-4 5.5-.5z"/>',40)}</span><h2 id="skills-title">Skills</h2><p class="backpack-capacity">Skills grow only from success. Every skill point also feeds your level.</p><button class="backpack-close" aria-label="Close skills">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div><div class="skills-body"><section class="skills-character" aria-label="Character"></section><section class="skills-list" aria-label="Skills"></section></div></div>`;
 document.body.append(dialog);
 const character=dialog.querySelector('.skills-character'),list=dialog.querySelector('.skills-list');let lastKey='';
 const bar=(value,max,label)=>{const track=document.createElement('div');track.className='skills-track';track.setAttribute('role','progressbar');track.setAttribute('aria-label',label);track.setAttribute('aria-valuemin','0');track.setAttribute('aria-valuemax',max);track.setAttribute('aria-valuenow',value);const fill=document.createElement('i');fill.style.width=`${Math.min(100,value/max*100)}%`;track.append(fill);return track;};
 const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
 function refresh(){
  const world=getWorld(),p=world.progression,key=JSON.stringify([p.level,p.xp,p.skills,Math.ceil(world.player.health),p.familiar]);if(key===lastKey)return;lastKey=key;
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
   const skill=p.skills[id],card=el('article','skills-card'),icon=el('span','skills-icon');icon.innerHTML=svg(SKILL_ICONS[id],30);
   const head=el('div','skills-card-head');head.append(el('h4',null,SKILLS[id].name),el('strong',null,`Lv ${skill.level}`));
   card.append(icon,head,bar(skill.xp,skillXpToNext(skill.level),`${SKILLS[id].name} experience`),el('small',null,`${skill.xp} / ${skillXpToNext(skill.level)} XP · ${SKILLS[id].description}`));return card;
  }));
 }
 function open(){const world=getWorld();if(!world.adventure||world.player.health<=0||dialog.open)return;onOpen();lastKey='';refresh();dialog.showModal();button.setAttribute('aria-expanded','true');}
 dialog.querySelector('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{button.setAttribute('aria-expanded','false');onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 button.onclick=open;
 return {get open(){return dialog.open;},toggle(){dialog.open?dialog.close():open();},close(){if(dialog.open)dialog.close();},update(visible){button.hidden=!visible;if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
