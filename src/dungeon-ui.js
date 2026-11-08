// The dungeon's two screens (Netanel's pick, 8 Nov 2026: option B entry + option C results):
// - the entry card, shown beside the portal in Wilds Camp while Eli stands by it: the dungeon, its monsters, best rank
//   and runs, with ENTER and Leave;
// - the results panel after the run's last map: run rank, time, damage, best combo and kills, with Run again and
//   Back to camp.
// Gameplay is in src/dungeon.js; this only shows it and calls it.
import {DUNGEON,nearPortal,startRun,backToCamp} from './dungeon.js';
import {fieldMap} from './field-maps.js';
import {ANIMAL_TYPES} from './entities.js';
import {spriteAssetUrl} from './sprites.js';
const FACES=[['slime','creatures/slime/slime-0.webp'],['stump','creatures/stump/stump-walk-0.webp'],['shore-crab','creatures/crab/crab-walk-0.webp'],['boss-crab','creatures/mudshell/mudshell-walk-0.webp']];
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export function mountDungeon({getWorld,onChange=()=>{}}){
 const card=document.createElement('section');card.className='dungeon-card';card.hidden=true;card.setAttribute('aria-label','Dungeon entrance');
 const levels=DUNGEON.maps.map(id=>fieldMap(id).levels).flat(),top=Math.max(...levels,...DUNGEON.maps.flatMap(id=>fieldMap(id).bunches.map(b=>b[4]?.level||0)));
 card.innerHTML=`<h2>${DUNGEON.name}</h2><p class="dungeon-row"><span>Dungeon · ${DUNGEON.maps.length} maps · boss: ${DUNGEON.boss}</span><span>Lv ${Math.min(...levels)}–${top}</span></p>
<div class="dungeon-faces">${FACES.map(([id,src])=>`<img alt="${ANIMAL_TYPES[id]?.name||id}" title="${ANIMAL_TYPES[id]?.name||id}" src="${spriteAssetUrl(src)}">`).join('')}</div>
<p class="dungeon-row dungeon-best"></p>
<div class="dungeon-buttons"><button type="button" class="dungeon-go">ENTER</button><button type="button" class="dungeon-leave">Leave</button></div><small class="dungeon-hint">Enter starts a fresh run on 1.1 with every monster back.</small>`;
 const results=document.createElement('section');results.className='dungeon-results';results.hidden=true;results.setAttribute('aria-label','Dungeon results');
 results.innerHTML=`<h2><span class="dungeon-title"></span><b class="dungeon-rank"></b></h2><div class="dungeon-grid"></div><p class="dungeon-note"></p>
<div class="dungeon-buttons"><button type="button" class="dungeon-again">Run again</button><button type="button" class="dungeon-camp">Back to camp</button></div>`;
 document.body.append(card,results);
 let dismissed=false,lastKey='';
 const act=fn=>()=>{const w=getWorld();if(!w?.regions)return;fn(w);dismissed=false;update();onChange();};
 card.querySelector('.dungeon-go').addEventListener('click',act(startRun));
 card.querySelector('.dungeon-leave').addEventListener('click',()=>{dismissed=true;update();onChange();});
 results.querySelector('.dungeon-again').addEventListener('click',act(startRun));
 results.querySelector('.dungeon-camp').addEventListener('click',act(w=>backToCamp(w)));
 function update(active=true){
  const w=getWorld(),d=w?.dungeon,near=active&&!!w&&nearPortal(w);
  // Stepping away from the portal and back brings the card up again after Leave.
  if(!near)dismissed=false;
  card.hidden=!near||dismissed;results.hidden=!(active&&w?.regions&&d?.result);
  const key=JSON.stringify([d?.best,d?.runs,d?.result]);if(key===lastKey)return;lastKey=key;
  if(d)card.querySelector('.dungeon-best').innerHTML=d.best?`<span>Best <b class="rank-${d.best.rank}">${d.best.rank}</b> · ${clock(d.best.seconds)} · combo ${d.best.combo}</span><span>Runs ${d.runs} · Clears ${d.clears}</span>`:`<span>Not cleared yet</span><span>Runs ${d.runs}</span>`;
  const r=d?.result;if(!r)return;
  results.querySelector('.dungeon-title').textContent=`Run ${r.run} · Cleared`;
  const rank=results.querySelector('.dungeon-rank');rank.textContent=r.rank;rank.className=`dungeon-rank rank-${r.rank}`;
  results.querySelector('.dungeon-grid').innerHTML=[['Time',clock(r.seconds)],['Damage taken',r.damage],['Best combo',r.combo],['Kills',r.kills]].map(([k,v])=>`<span><small>${k}</small>${v}</span>`).join('');
  results.querySelector('.dungeon-note').textContent=r.best?'New best run!':`Best run: Rank ${d.best.rank} · ${clock(d.best.seconds)}`;
 }
 return {update,
  get open(){return !results.hidden;},
  // Enter on the keyboard presses the main button of whichever screen is up.
  key(code){if(code!=='Enter'&&code!=='NumpadEnter')return false;if(!results.hidden){results.querySelector('.dungeon-again').click();return true;}if(!card.hidden){card.querySelector('.dungeon-go').click();return true;}return false;}};
}
