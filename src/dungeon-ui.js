// The dungeon's two screens (Netanel's pick, 8 Nov 2026: option B entry + option C results):
// - the entry card, shown beside the portal in Wilds Camp while Eli stands by it: the dungeon, its monsters, best rank
//   and runs, with ENTER and Leave;
// - the results panel after the run's last map: run rank, time, damage, best combo and kills, with Run again and
//   Back to camp.
// Gameplay is in src/dungeon.js; this only shows it and calls it.
import {DUNGEONS,dungeonById,recordOf,nearPortal,startRun,backToCamp} from './dungeon.js';
import {fieldMap} from './field-maps.js';
import {ANIMAL_TYPES} from './entities.js';
import {spriteAssetUrl} from './sprites.js';
// The monsters shown on each dungeon's card, boss last.
const FACES={
 'reedwater-wilds':[['slime','slime/slime-0'],['stump','stump/stump-walk-0'],['shore-crab','crab/crab-walk-0'],['boss-crab','mudshell/mudshell-walk-0']],
 'thornberry-vale':[['berry-sprite','sprite/sprite-walk-0'],['mushroom-imp','imp/imp-walk-0'],['thistle-hog','thistle/thistle-walk-0'],['reed-frog','frog/frog-walk-0'],['boss-frog','frogking/frogking-walk-0']],
 'lanternlight-wilds':[['lantern-moth','moth/moth-walk-0'],['ember-beetle','beetle/beetle-walk-0'],['pebble-hermit','hermit/hermit-walk-0'],['boss-mushroom','capstomper/capstomper-walk-0']]
};
const clock=s=>`${Math.floor(s/60)}:${String(Math.floor(s%60)).padStart(2,'0')}`;
export function mountDungeon({getWorld,onChange=()=>{}}){
 const card=document.createElement('section');card.className='dungeon-card';card.hidden=true;card.setAttribute('aria-label','Dungeon entrance');
 card.innerHTML=`<h2></h2><p class="dungeon-row dungeon-info"></p><div class="dungeon-faces"></div>
<p class="dungeon-row dungeon-best"></p>
<div class="dungeon-buttons"><button type="button" class="dungeon-go">ENTER</button><button type="button" class="dungeon-leave">Leave</button></div><small class="dungeon-hint">Enter starts a fresh run with every monster back.</small>`;
 const results=document.createElement('section');results.className='dungeon-results';results.hidden=true;results.setAttribute('aria-label','Dungeon results');
 results.innerHTML=`<h2><span class="dungeon-title"></span><b class="dungeon-rank"></b></h2><div class="dungeon-grid"></div><p class="dungeon-note"></p>
<div class="dungeon-buttons"><button type="button" class="dungeon-again">Run again</button><button type="button" class="dungeon-camp">Back to camp</button></div>`;
 document.body.append(card,results);
 let dismissed=false,lastKey='',shown=null;
 // Fills the card for the dungeon whose portal Eli stands by.
 function fill(id){
  const g=dungeonById(id);shown=id;
  const levels=g.maps.flatMap(m=>fieldMap(m).levels),top=Math.max(...levels,...g.maps.flatMap(m=>fieldMap(m).bunches.map(b=>b[4]?.level||0)));
  card.querySelector('h2').textContent=g.name;
  card.querySelector('.dungeon-info').innerHTML=`<span>Dungeon · ${fieldMap(g.maps[0]).code} to ${fieldMap(g.maps.at(-1)).code} · boss: ${g.boss}</span><span>Lv ${Math.min(...levels)}–${top}</span>`;
  card.querySelector('.dungeon-faces').innerHTML=FACES[id].map(([s,src])=>`<img alt="${ANIMAL_TYPES[s]?.name||s}" title="${ANIMAL_TYPES[s]?.name||s}" src="${spriteAssetUrl(`creatures/${src}.webp`)}">`).join('');
 }
 const act=fn=>()=>{const w=getWorld();if(!w?.regions)return;fn(w);dismissed=false;update();onChange();};
 card.querySelector('.dungeon-go').addEventListener('click',act(w=>startRun(w,shown)));
 card.querySelector('.dungeon-leave').addEventListener('click',()=>{dismissed=true;update();onChange();});
 results.querySelector('.dungeon-again').addEventListener('click',act(w=>startRun(w,w.dungeon?.result?.id)));
 results.querySelector('.dungeon-camp').addEventListener('click',act(w=>backToCamp(w)));
 function update(active=true){
  const w=getWorld(),d=w?.dungeon,near=active&&!!w&&nearPortal(w);
  // Stepping away from the portal and back brings the card up again after Leave.
  if(!near)dismissed=false;else if(near!==shown){fill(near);dismissed=false;lastKey='';}
  card.hidden=!near||dismissed;results.hidden=!(active&&w?.regions&&d?.result);
  const rec=d&&recordOf(w,d.result?.id||shown||DUNGEONS[0].id);
  const key=JSON.stringify([shown,rec,d?.result]);if(key===lastKey)return;lastKey=key;
  if(rec&&shown)card.querySelector('.dungeon-best').innerHTML=rec.best?`<span>Best <b class="rank-${rec.best.rank}">${rec.best.rank}</b> · ${clock(rec.best.seconds)} · combo ${rec.best.combo}</span><span>Runs ${rec.runs} · Clears ${rec.clears}</span>`:`<span>Not cleared yet</span><span>Runs ${rec.runs}</span>`;
  const r=d?.result;if(!r)return;
  results.querySelector('.dungeon-title').textContent=`${dungeonById(r.id)?.name||''} · Run ${r.run} · Cleared`;
  const rank=results.querySelector('.dungeon-rank');rank.textContent=r.rank;rank.className=`dungeon-rank rank-${r.rank}`;
  results.querySelector('.dungeon-grid').innerHTML=[['Time',clock(r.seconds)],['Damage taken',r.damage],['Best combo',r.combo],['Kills',r.kills]].map(([k,v])=>`<span><small>${k}</small>${v}</span>`).join('');
  results.querySelector('.dungeon-note').textContent=r.best?'New best run!':`Best run: Rank ${rec.best.rank} · ${clock(rec.best.seconds)}`;
 }
 return {update,
  get open(){return !results.hidden;},
  // Enter on the keyboard presses the main button of whichever screen is up.
  key(code){if(code!=='Enter'&&code!=='NumpadEnter')return false;if(!results.hidden){results.querySelector('.dungeon-again').click();return true;}if(!card.hidden){card.querySelector('.dungeon-go').click();return true;}return false;}};
}
