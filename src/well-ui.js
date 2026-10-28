import {RARITIES,RARITY_NAMES,itemLabel,artifactItem,artifactEffect} from './artifacts.js';
import {FAMILIARS} from './familiars.js';
import {WELL_POOLS,POOL_NAMES,PITY,MAX_DRAWS,STONE_PRICE,SHARD_COUNTS,SHARD_CAP,WELL_ODDS,LEGENDARY_REFUND,drawWell,buyWishstone,familiarPool,wishstonesLabel,wellOpen,poolRates} from './wishing-well.js';
import {marksLabel,marksOf} from './trade.js';
import {markIcon} from './trade-ui.js';
import {setItemIcon} from './item-icons.js';
import {VIEW,planSummon,drawSummon,summonLabels,loadSummonArt} from './well-summon.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// A stone well: rim, posts and a little roof.
const WELL='<path d="M4 9h16M6 9V5.5L12 3l6 2.5V9M5 13h14v7H5zM5 13c0-1.5 3-2.5 7-2.5s7 1 7 2.5M9 16.5h6"/>';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export const stoneIcon=(size=18)=>`<span class="wishstone-icon" style="width:${size}px;height:${Math.round(size*.78)}px" aria-hidden="true"></span>`;
const percent=n=>`${Math.round(n*100)}%`;
// Finer percentages for the details page: 12%, 13.75%, 0.2%.
const exact=n=>`${+(n*100).toFixed(2)}%`;
const ODDS_TEXT=`Common ${percent(1-Object.values(WELL_ODDS).reduce((a,b)=>a+b,0))} · Uncommon ${percent(WELL_ODDS.uncommon)} · Rare ${percent(WELL_ODDS.rare)} · Epic ${percent(WELL_ODDS.epic)} · Legendary ${percent(WELL_ODDS.legendary)}`;
const POOL_TEXT={
 artifacts:'Every draw is an artifact. The rarity roll decides how strong it is. Three copies of one rarity still combine in the backpack.',
 familiars:`Every draw is familiar shards for one creature in your Creature Index. The rarity decides how many: ${Object.values(SHARD_COUNTS).join(', ')}.`
};
export function mountWell({getWorld,onOpen,onClose}){
 const dialog=document.createElement('dialog');dialog.id='well-sheet';dialog.setAttribute('aria-labelledby','well-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem">${svg(WELL,40)}</span><h2 id="well-title">The Wishing Well</h2><p class="backpack-capacity well-purse"><span class="well-stones">${stoneIcon(20)}<span class="well-count"></span></span><span class="well-marks">${markIcon(18)}<span class="well-count"></span></span></p><button class="backpack-close" aria-label="Close the well">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div>
<div class="well-tabs" role="tablist" aria-label="Pools">${WELL_POOLS.map(pool=>`<button type="button" role="tab" class="well-tab" data-pool="${pool}" aria-selected="false">${POOL_NAMES[pool]}</button>`).join('')}</div>
<div class="well-body"><section class="well-side" aria-label="Draw"><p class="well-pool-text"></p><p class="well-odds"></p>
<div class="well-pity" data-rarity="rare"><div class="well-pity-row"><span>Rare or better within</span><b class="pity-rare"></b></div><div class="well-bar"><i class="bar-rare"></i></div></div>
<div class="well-pity" data-rarity="legendary"><div class="well-pity-row"><span>Legendary within</span><b class="pity-legendary"></b></div><div class="well-bar"><i class="bar-legendary"></i></div></div>
<button type="button" class="well-details-toggle" aria-expanded="false">Rates, prizes and pity</button>
<div class="well-buttons"><button type="button" class="trade-action well-draw" data-count="1">Draw once<small>${wishstonesLabel(1)}</small></button><button type="button" class="trade-action well-draw" data-count="${MAX_DRAWS}">Draw ${MAX_DRAWS}<small>${wishstonesLabel(MAX_DRAWS)}</small></button><button type="button" class="trade-action well-buy">Buy a stone<small>${marksLabel(STONE_PRICE)}</small></button></div></section>
<section class="well-main" aria-label="What the well brought up"><h3 class="trade-column-title">What the well brought up</h3><ul class="well-results"></ul></section><section class="well-main well-details" aria-label="Rates, prizes and pity" hidden></section></div>
<p class="trade-note well-note" aria-live="polite"></p><div class="well-summon" hidden><canvas class="well-summon-canvas" aria-label="Eli throws the Wishstones into the well, and fish come to eat them"></canvas><button type="button" class="trade-action well-skip">Skip</button></div></div>`;
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector),results=$('.well-results'),note=$('.well-note');
 let pool='artifacts',lastKey='',shown={artifacts:[],familiars:[]},details=false;
 function card(result){
  const item=el('li','well-card');item.dataset.rarity=result.rarity;
  if(['epic','legendary'].includes(result.rarity))item.classList.add('well-card-big');
  const icon=el('span','well-card-icon');setItemIcon(icon,result.name);
  const label=result.kind==='shards'?`${FAMILIARS[result.familiar].name} shards ×${result.count}`:result.name;
  item.append(icon,el('strong','well-card-name',label),el('small','well-card-rarity',RARITY_NAMES[result.rarity]));
  if(result.refund)item.append(el('small','well-card-extra',`+${wishstonesLabel(result.refund)}`));
  else if(result.kind==='artifact'&&result.copies>=3)item.append(el('small','well-card-extra','Ready to combine'));
  else if(result.kind==='shards')item.append(el('small','well-card-extra',`${result.shards} ${result.shards===1?'shard':'shards'} now`));
  if(result.isNew){item.append(el('span','well-card-new','NEW'));}
  item.setAttribute('aria-label',result.kind==='shards'?`${RARITY_NAMES[result.rarity]}: ${label}`:`${itemLabel(artifactItem(result.artifact,result.rarity))}${result.refund?`, returned as ${wishstonesLabel(result.refund)}`:''}`);
  return item;
 }
 // The details page: odds per rarity, every prize with its own chance, and how pity works, for the pool on show.
 function table(head,rows){
  const t=el('table','well-table'),tr=el('tr');for(const h of head)tr.append(el('th',null,h));
  const thead=el('thead');thead.append(tr);const body=el('tbody');
  for(const cells of rows){const row=el('tr');for(const cell of cells)row.append(cell instanceof Node?cell:el('td',null,cell));body.append(row);}
  t.append(thead,body);const wrap=el('div','well-table-wrap');wrap.append(t);return wrap;
 }
 const rarityCell=(rarity,tag='td')=>{const cell=el(tag,'well-rarity',RARITY_NAMES[rarity]);cell.dataset.rarity=rarity;return cell;};
 function renderDetails(){
  const world=getWorld(),{rarities,prizes}=poolRates(world,pool),familiars=pool==='familiars',page=$('.well-details');
  const nodes=[el('h3','trade-column-title','Odds on each draw'),
   table(familiars?['Rarity','Chance','Shards']:['Rarity','Chance'],rarities.map(r=>[rarityCell(r.rarity),exact(r.chance),...(familiars?[`×${r.shards}`]:[])])),
   el('h3','trade-column-title',familiars?'Creatures in this pool':'Artifacts in this pool'),
   el('p','well-details-note',familiars?`Every creature in the pool is equally likely. Each column is the chance of that creature's shards at that rarity on one draw.`:'Every artifact is equally likely. Each column is the chance of that artifact at that rarity on one draw.')];
  nodes.push(table(['Prize',...RARITIES.map(r=>RARITY_NAMES[r])],prizes.map(prize=>{
   const name=el('td','well-prize');name.append(el('strong',null,prize.name));
   if(!familiars)name.append(el('small',null,`Common: ${artifactEffect(prize.id,'common')}`),el('small',null,`Legendary: ${artifactEffect(prize.id,'legendary')}`));
   else if(!prize.inPool)name.append(el('small',null,prize.why));
   return [name,...RARITIES.map(r=>{const cell=el('td','well-chance',prize.inPool?exact(prize.chances[r]):'–');cell.dataset.rarity=r;return cell;})];
  })));
  const epicShare=Math.round(WELL_ODDS.epic/(WELL_ODDS.epic+WELL_ODDS.rare)*100),legendaryAt=n=>exact(Math.min(1,WELL_ODDS.legendary+(n-PITY.softLegendary)*PITY.legendaryStep));
  const list=(title,items)=>{const ul=el('ul','well-rules');for(const text of items)ul.append(el('li',null,text));nodes.push(el('h3','trade-column-title',title),ul);};
  list('Pity',[
   `Rare guarantee: if ${PITY.rare-1} draws in a row bring nothing Rare or better, the ${PITY.rare}th draw is Rare or better (an Epic ${epicShare}% of the time).`,
   `Legendary climb: after ${PITY.softLegendary} draws without a Legendary, its chance goes up by ${percent(PITY.legendaryStep)} with every draw: ${legendaryAt(PITY.softLegendary+1)} on draw ${PITY.softLegendary+1}, ${legendaryAt(PITY.softLegendary+10)} on draw ${PITY.softLegendary+10}.`,
   `Legendary guarantee: draw ${PITY.legendary} is always Legendary if none has come up before it.`,
   'Pulling a Rare or better resets the Rare count. Pulling a Legendary resets both counts.',
   'Each pool keeps its own counts, and they carry over between visits and saves. The bars on the left show how close the next guarantee is.']);
  list('Good to know',[
   `Draw ${MAX_DRAWS} rolls ${MAX_DRAWS} separate draws at the same odds for ${wishstonesLabel(MAX_DRAWS)}, and pity counts every one of them.`,
   ...(familiars?[`Only creatures you have met, whose familiar still needs shards, are in the pool. A familiar is full at ${SHARD_CAP} shards and leaves the pool.`]
    :['Three copies of one artifact at one rarity combine into the next rarity in the backpack.',`A Legendary artifact you already own comes back as ${wishstonesLabel(LEGENDARY_REFUND)}.`])]);
  page.replaceChildren(...nodes);
 }
 function refresh(){
  const world=getWorld(),well=world.well,pity=well.pity[pool],empty=pool==='familiars'&&!familiarPool(world).length,open=wellOpen(world);
  const key=JSON.stringify([pool,well.stones,marksOf(world),pity,shown[pool].length,empty,open,details,details&&familiarPool(world)]);if(key===lastKey)return;lastKey=key;
  $('.well-stones .well-count').textContent=wishstonesLabel(well.stones);$('.well-marks .well-count').textContent=marksLabel(marksOf(world));
  for(const tab of dialog.querySelectorAll('.well-tab'))tab.setAttribute('aria-selected',String(tab.dataset.pool===pool));
  $('.well-pool-text').textContent=empty?'No creature in your index can take more shards yet. Meet new creatures in the wild to widen this pool.':POOL_TEXT[pool];
  $('.well-odds').textContent=ODDS_TEXT;
  const rareLeft=PITY.rare-pity.rare,legendaryLeft=PITY.legendary-pity.legendary;
  $('.pity-rare').textContent=`${rareLeft} ${rareLeft===1?'draw':'draws'}`;$('.bar-rare').style.width=`${pity.rare/PITY.rare*100}%`;
  $('.pity-legendary').textContent=`${legendaryLeft} ${legendaryLeft===1?'draw':'draws'}`;$('.bar-legendary').style.width=`${pity.legendary/PITY.legendary*100}%`;
  for(const button of dialog.querySelectorAll('.well-draw')){const n=Number(button.dataset.count);button.disabled=!open||empty||well.stones<n;button.title=well.stones<n?`You need ${wishstonesLabel(n-well.stones)} more`:'';}
  const buy=$('.well-buy');buy.disabled=!open||marksOf(world)<STONE_PRICE;buy.title=marksOf(world)<STONE_PRICE?`You need ${marksLabel(STONE_PRICE-marksOf(world))} more`:'';
  const toggle=$('.well-details-toggle');toggle.textContent=details?'Back to my draws':'Rates, prizes and pity';toggle.setAttribute('aria-expanded',String(details));
  $('.well-main:not(.well-details)').hidden=details;$('.well-details').hidden=!details;if(details)renderDetails();
  results.replaceChildren(...(shown[pool].length?shown[pool].map(card):[el('li','trade-empty','Drop a Wishstone in and see what comes up.')]));
 }
 for(const tab of dialog.querySelectorAll('.well-tab'))tab.onclick=()=>{pool=tab.dataset.pool;lastKey='';refresh();};
 $('.well-details-toggle').onclick=()=>{details=!details;lastKey='';refresh();};
 // The summon animation plays over the window; the cards appear when it ends or is skipped.
 const stage=$('.well-summon'),screen=$('.well-summon-canvas');
 let playing=null;
 function stop(){if(!playing)return;const done=playing.done;cancelAnimationFrame(playing.frame);playing=null;stage.hidden=true;done();}
 function play(results,done){
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){done();return;}
  const plan=planSummon(results.map(r=>r.rarity)),started=performance.now();stage.hidden=false;
  const tick=now=>{
   const t=(now-started)/1000;if(t>=plan.total){stop();return;}
   const ratio=Math.min(2,devicePixelRatio||1),w=Math.round(screen.clientWidth*ratio),h=Math.round(screen.clientHeight*ratio);
   if(screen.width!==w||screen.height!==h){screen.width=w;screen.height=h;}
   // The scene keeps its 16:9 shape inside whatever space the window has, letterboxed in the dark, drawn at full resolution.
   const ctx=screen.getContext('2d'),scale=Math.min(w/VIEW.w,h/VIEW.h),ox=(w-VIEW.w*scale)/2,oy=(h-VIEW.h*scale)/2;
   ctx.setTransform(1,0,0,1,0,0);ctx.clearRect(0,0,w,h);
   ctx.setTransform(scale,0,0,scale,ox,oy);ctx.save();ctx.beginPath();ctx.rect(0,0,VIEW.w,VIEW.h);ctx.clip();drawSummon(ctx,plan,t);ctx.restore();
   ctx.setTransform(1,0,0,1,0,0);ctx.textAlign='center';
   for(const label of summonLabels(plan,t)){ctx.globalAlpha=label.alpha;ctx.font=`700 ${Math.round((label.big?9:6)*scale)}px Georgia,serif`;ctx.lineWidth=Math.max(2,scale);ctx.strokeStyle='#061410';ctx.strokeText(label.text,ox+label.x*scale,oy+label.y*scale);ctx.fillStyle=label.color;ctx.fillText(label.text,ox+label.x*scale,oy+label.y*scale);}
   ctx.globalAlpha=1;playing.frame=requestAnimationFrame(tick);
  };
  playing={done,frame:requestAnimationFrame(tick)};$('.well-skip').focus();
 }
 $('.well-skip').onclick=stop;
 for(const button of dialog.querySelectorAll('.well-draw'))button.onclick=()=>{
  if(playing)return;
  const world=getWorld(),drawn=drawWell(world,pool,Number(button.dataset.count)),message=world.message;
  if(!drawn.ok){note.textContent=message;lastKey='';refresh();return;}
  note.textContent='Eli throws the stones into the well…';lastKey='';refresh();
  play(drawn.results,()=>{shown[pool]=drawn.results;details=false;const well=$('.well-results');well.classList.remove('well-splash');void well.offsetWidth;well.classList.add('well-splash');note.textContent=message;lastKey='';refresh();});
 };
 $('.well-buy').onclick=()=>{const world=getWorld();buyWishstone(world);note.textContent=world.message;lastKey='';refresh();};
 function open(){
  const world=getWorld();if(!wellOpen(world)||dialog.open)return;
  lastKey='';onOpen();loadSummonArt();note.textContent='Eli looks into the well. The water glows a soft blue. Choose a pool and drop a stone in.';
  refresh();dialog.showModal();
 }
 $('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{if(playing){cancelAnimationFrame(playing.frame);playing=null;stage.hidden=true;}shown={artifacts:[],familiars:[]};details=false;onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 return {get open(){return dialog.open;},get summoning(){return !!playing;},skip:stop,show:open,close(){if(dialog.open)dialog.close();},update(visible){if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
