import {RARITY_NAMES,itemLabel,artifactItem} from './artifacts.js';
import {FAMILIARS} from './familiars.js';
import {WELL_POOLS,POOL_NAMES,PITY,MAX_DRAWS,STONE_PRICE,SHARD_COUNTS,WELL_ODDS,drawWell,buyWishstone,familiarPool,wishstonesLabel,wellOpen} from './wishing-well.js';
import {marksLabel,marksOf} from './trade.js';
import {markIcon} from './trade-ui.js';
import {setItemIcon} from './item-icons.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
// A stone well: rim, posts and a little roof.
const WELL='<path d="M4 9h16M6 9V5.5L12 3l6 2.5V9M5 13h14v7H5zM5 13c0-1.5 3-2.5 7-2.5s7 1 7 2.5M9 16.5h6"/>';
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
export const stoneIcon=(size=18)=>`<span class="wishstone-icon" style="width:${size}px;height:${Math.round(size*.78)}px" aria-hidden="true"></span>`;
const percent=n=>`${Math.round(n*100)}%`;
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
<div class="well-buttons"><button type="button" class="trade-action well-draw" data-count="1">Draw once<small>${wishstonesLabel(1)}</small></button><button type="button" class="trade-action well-draw" data-count="${MAX_DRAWS}">Draw ${MAX_DRAWS}<small>${wishstonesLabel(MAX_DRAWS)}</small></button><button type="button" class="trade-action well-buy">Buy a stone<small>${marksLabel(STONE_PRICE)}</small></button></div></section>
<section class="well-main" aria-label="What the well brought up"><h3 class="trade-column-title">What the well brought up</h3><ul class="well-results"></ul></section></div>
<p class="trade-note well-note" aria-live="polite"></p></div>`;
 document.body.append(dialog);
 const $=selector=>dialog.querySelector(selector),results=$('.well-results'),note=$('.well-note');
 let pool='artifacts',lastKey='',shown={artifacts:[],familiars:[]};
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
 function refresh(){
  const world=getWorld(),well=world.well,pity=well.pity[pool],empty=pool==='familiars'&&!familiarPool(world).length,open=wellOpen(world);
  const key=JSON.stringify([pool,well.stones,marksOf(world),pity,shown[pool].length,empty,open]);if(key===lastKey)return;lastKey=key;
  $('.well-stones .well-count').textContent=wishstonesLabel(well.stones);$('.well-marks .well-count').textContent=marksLabel(marksOf(world));
  for(const tab of dialog.querySelectorAll('.well-tab'))tab.setAttribute('aria-selected',String(tab.dataset.pool===pool));
  $('.well-pool-text').textContent=empty?'No creature in your index can take more shards yet. Meet new creatures in the wild to widen this pool.':POOL_TEXT[pool];
  $('.well-odds').textContent=ODDS_TEXT;
  const rareLeft=PITY.rare-pity.rare,legendaryLeft=PITY.legendary-pity.legendary;
  $('.pity-rare').textContent=`${rareLeft} ${rareLeft===1?'draw':'draws'}`;$('.bar-rare').style.width=`${pity.rare/PITY.rare*100}%`;
  $('.pity-legendary').textContent=`${legendaryLeft} ${legendaryLeft===1?'draw':'draws'}`;$('.bar-legendary').style.width=`${pity.legendary/PITY.legendary*100}%`;
  for(const button of dialog.querySelectorAll('.well-draw')){const n=Number(button.dataset.count);button.disabled=!open||empty||well.stones<n;button.title=well.stones<n?`You need ${wishstonesLabel(n-well.stones)} more`:'';}
  const buy=$('.well-buy');buy.disabled=!open||marksOf(world)<STONE_PRICE;buy.title=marksOf(world)<STONE_PRICE?`You need ${marksLabel(STONE_PRICE-marksOf(world))} more`:'';
  results.replaceChildren(...(shown[pool].length?shown[pool].map(card):[el('li','trade-empty','Drop a Wishstone in and see what comes up.')]));
 }
 for(const tab of dialog.querySelectorAll('.well-tab'))tab.onclick=()=>{pool=tab.dataset.pool;lastKey='';refresh();};
 for(const button of dialog.querySelectorAll('.well-draw'))button.onclick=()=>{
  const world=getWorld(),drawn=drawWell(world,pool,Number(button.dataset.count));
  if(drawn.ok){shown[pool]=drawn.results;const well=$('.well-results');well.classList.remove('well-splash');void well.offsetWidth;well.classList.add('well-splash');}
  note.textContent=world.message;lastKey='';refresh();
 };
 $('.well-buy').onclick=()=>{const world=getWorld();buyWishstone(world);note.textContent=world.message;lastKey='';refresh();};
 function open(){
  const world=getWorld();if(!wellOpen(world)||dialog.open)return;
  lastKey='';onOpen();note.textContent='Eli looks into the well. The water glows the same blue as the Region Core. Choose a pool and drop a stone in.';
  refresh();dialog.showModal();
 }
 $('.backpack-close').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{shown={artifacts:[],familiars:[]};onClose();});
 dialog.addEventListener('click',event=>{if(event.target===dialog){const r=dialog.getBoundingClientRect();if(event.clientX<r.left||event.clientX>r.right||event.clientY<r.top||event.clientY>r.bottom)dialog.close();}});
 return {get open(){return dialog.open;},show:open,close(){if(dialog.open)dialog.close();},update(visible){if(!visible&&dialog.open)dialog.close();if(dialog.open)refresh();}};
}
