import {storyAction,updateStoryAction} from './story-action.js';
import {matchesBinding,bindingLabel} from './keybinds.js';
import {preferences} from './preferences.js';
import {mountSettings} from './settings-ui.js';
import {observeGameSounds,playSfx} from './sfx.js';
import {mountStory} from './story-ui.js';
import {currentScene,storyPrompt,cabinDamaged,rodReady} from './story.js';
import {amountLabel} from './inventory.js';
import {paintStoryMap} from './story-map.js';
import {drawStoryWeather} from './story-weather.js';
import {mountSaveUI} from './save-ui.js';
import {nearbyDrop} from './drops.js';
import {itemLabel} from './artifacts.js';
import {mountBackpack} from './backpack.js';
import {mountTrade,markIcon} from './trade-ui.js';
import {mountWell} from './well-ui.js';
import {nearWell} from './wishing-well.js';
import {marksLabel} from './trade.js';
import {mountSkills} from './skills-ui.js';
import {mountCodex} from './codex-ui.js';
import {mountQuests} from './quest-ui.js';
import {mountRadio} from './radio-ui.js';
import {setItemIcon} from './item-icons.js';
import {TouchInput,mountMobileControls,gameScale} from './mobile.js';
import {mountScreenControls} from './fullscreen.js';
import {nearbyNpc} from './npcs.js';
import {World} from './world.js';
import {render} from './renderer.js';
import {preloadProps} from './sprites.js';
import './music.js';
import {Lobby} from './lobby.js';
import {areaFor,placesFor,regionAt,nearestLandmark,paintAtlas,INTERIOR_AREAS} from './wilds.js';
import {explorationHud} from './hud.js';
import {mountHudShell} from './hud-shell.js';
let world=new World(Math.random,{botCount:0});
const canvas=document.querySelector('#arena'),ctx=canvas.getContext('2d',{alpha:false});
const touchState=new TouchInput(),touchMedia=matchMedia('(any-pointer: coarse), (max-width: 700px)');
let hudUI=null,radioUI=null,tradeUI=null,wellUI=null,questUI=null,backpackUI=null,skillsUI=null,codexUI=null,saveUI=null,storyUI=null,settingsUI=null;
let touchMode=touchMedia.matches,touchUI=null;document.body.classList.toggle('touch-mode',touchMode);
// Keep the explorer readable on a narrow portrait viewport.
let view={scale:1,x:0,y:0,width:960,height:720,dpr:1};
function resize(){
  const r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio||1,1.5,Math.sqrt(1920*1080/(r.width*r.height)));
  view.width=r.width;view.height=r.height;view.dpr=dpr;
  canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);
  view.scale=gameScale(r.width,r.height,touchMode);
  view.x=(r.width-960*view.scale)/2;view.y=(r.height-720*view.scale)/2;
}
new ResizeObserver(resize).observe(canvas);resize();
const elements=new Map();
const $=id=>{if(!elements.has(id))elements.set(id,document.getElementById(id));return elements.get(id);};const keys=new Set();let mouseHeld=false,spaceHeld=false,aim={x:480,y:0};
const currentInput=()=>{camera();if(touchMode&&touchState.enabled){pointer=null;aim=touchState.aim(world.player);}const stick=touchMode&&touchState.movePointer!==null;return ({left:keys.has(preferences.value.keybinds.left)||(stick&&touchState.x<-.1),right:keys.has(preferences.value.keybinds.right)||(stick&&touchState.x>.1),up:keys.has(preferences.value.keybinds.up)||(stick&&touchState.y<-.1),down:keys.has(preferences.value.keybinds.down)||(stick&&touchState.y>.1),...(stick?{moveX:touchState.x,moveY:touchState.y}:{}),aim,held:mouseHeld||spaceHeld||touchState.held});};
const act=action=>{if(!currentScene(world)&&!hudUI?.open&&!settingsUI?.open&&!storyUI?.open&&!backpackUI?.open&&!tradeUI?.open&&!wellUI?.open&&!radioUI?.open&&!skillsUI?.open&&!codexUI?.open&&!questUI?.open&&!saveUI?.open)lobby.action(action,currentInput());};
const equip=slot=>act(`slot-${slot}`);
addEventListener('keydown',e=>{
  if(settingsUI?.open||storyUI?.open||saveUI?.open||currentScene(world))return;
  if((e.ctrlKey||e.metaKey)&&e.code==='KeyS'&&lobby.world?.adventure){e.preventDefault();saveUI.manager.request('manual',true).catch(()=>{});return;}
  if(tradeUI?.open||wellUI?.open)return;
  if(radioUI?.open){if((e.code==='Escape'||matchesBinding('radio',e.code)&&!e.target.closest('input'))&&!e.repeat){e.preventDefault();radioUI.close();}return;}
  if(backpackUI?.open){if(matchesBinding('backpack',e.code)&&!e.repeat){e.preventDefault();backpackUI.toggle();}return;}
  if(skillsUI?.open){if(matchesBinding('skills',e.code)&&!e.repeat){e.preventDefault();skillsUI.toggle();}return;}
  if(codexUI?.open){if(matchesBinding('codex',e.code)&&!e.repeat){e.preventDefault();codexUI.toggle();}return;}
  if(questUI?.open){if(matchesBinding('quests',e.code)&&!e.repeat){e.preventDefault();questUI.toggle();}return;}
  if(matchesBinding('skills',e.code)&&lobby.world?.adventure&&!e.repeat){e.preventDefault();skillsUI.toggle();return;}
  if(matchesBinding('codex',e.code)&&lobby.world?.adventure&&!e.repeat){e.preventDefault();codexUI.toggle();return;}
  if(matchesBinding('quests',e.code)&&lobby.world?.adventure&&!e.repeat){e.preventDefault();questUI.toggle();return;}
  if(matchesBinding('backpack',e.code)&&lobby.world?.adventure&&!e.repeat){e.preventDefault();backpackUI.toggle();return;}
  if(matchesBinding('map',e.code)&&lobby.world?.adventure&&!e.repeat){e.preventDefault();toggleAtlas();return;}
  if(matchesBinding('radio',e.code)&&lobby.world?.adventure&&!e.repeat){e.preventDefault();radioUI.toggle();return;}
  if(atlasOpen){if(e.code==='Escape'){e.preventDefault();toggleAtlas(false);}return;}
  if(e.target.closest('.music-hud, #lobby-screen')||!lobby.world)return;
  if(Object.values(preferences.value.keybinds).includes(e.code))e.preventDefault();
  keys.add(e.code);if(matchesBinding('reel',e.code))spaceHeld=true;
  if(!e.repeat){
    if(matchesBinding('inspect',e.code)&&world.adventure)world.inspect();
    if(matchesBinding('dash',e.code))act('dash');
    if(matchesBinding('fish',e.code)){
      act('toggle');
    }
    for(let slot=1;slot<=7;slot++)if(matchesBinding('slot'+slot,e.code))equip(slot);
    if(matchesBinding('use',e.code))act('use');
    if(matchesBinding('tidal',e.code))act('tidal');
    if(matchesBinding('whirlpool',e.code))act('whirlpool');
    if(e.code==='Enter'&&['won','lost','finished'].includes(world.matchState))restart();
    if((e.code==='Escape'||matchesBinding('cancel',e.code)))act('cancel');
  }
});
addEventListener('keyup',e=>{keys.delete(e.code);if(matchesBinding('reel',e.code))spaceHeld=false;});
let pointer=null;
function camera(player=world.player){view.x=view.width/2-player.x*view.scale;view.y=view.height/2-player.y*view.scale;if(world.adventure){const a=areaFor(world.areaId);view.x=a.width*view.scale<view.width?(view.width-a.width*view.scale)/2:Math.max(view.width-a.width*view.scale,Math.min(0,view.x));view.y=a.height*view.scale<view.height?(view.height-a.height*view.scale)/2:Math.max(view.height-a.height*view.scale,Math.min(0,view.y));}if(pointer)aim={x:(pointer.x-view.x)/view.scale,y:(pointer.y-view.y)/view.scale};}
function point(e){const r=canvas.getBoundingClientRect();if(e.pointerType==='touch'){pointer=null;camera();touchState.manualAim={x:(e.clientX-r.left-view.x)/view.scale,y:(e.clientY-r.top-view.y)/view.scale};aim=touchState.manualAim;return;}pointer={x:e.clientX-r.left,y:e.clientY-r.top};camera();world.player.angle=Math.atan2(aim.y-world.player.y,aim.x-world.player.x);}
canvas.addEventListener('pointermove',e=>{if(e.pointerType!=='touch'||e.buttons)point(e);});
canvas.addEventListener('pointerdown',e=>{if(e.button!==0||!lobby.world||atlasOpen||settingsUI?.open||storyUI?.open||currentScene(world))return;point(e);if(e.pointerType==='touch'){e.preventDefault();return;}mouseHeld=true;canvas.focus();act('click');});
addEventListener('pointerup',()=>mouseHeld=false);
function release(){keys.clear();mouseHeld=false;spaceHeld=false;touchUI?.reset();}
touchMedia.addEventListener('change',e=>{touchMode=e.matches;document.body.classList.toggle('touch-mode',touchMode);release();resize();});
addEventListener('resize',()=>release());
addEventListener('blur',release);document.addEventListener('visibilitychange',release);
for(let slot=3;slot<=7;slot++){const button=document.createElement('button');button.id=`slot-${slot}`;button.className='slot backpack-slot';button.innerHTML=`<kbd>${slot}</kbd><span class="slot-icon">—</span><strong>Empty</strong><small>Fish to fill</small>`;button.onclick=()=>{equip(slot);canvas.focus();};$('slot-item').after(button);}
setItemIcon($('slot-rod').querySelector('.slot-icon'),'Fishing Rod');$('slot-rod').onclick=()=>equip(1);$('slot-item').onclick=()=>equip(2);$('cancel').onclick=()=>act('cancel');
$('choose-whirlpool').onclick=()=>chooseReward('whirlpool');$('choose-special').onclick=()=>chooseReward('tidal');
$('fire-tidal').onclick=()=>act('tidal');$('fire-whirlpool').onclick=()=>act('whirlpool');
$('restart').onclick=restart;
for(const kind of ['hermes','dash','health'])$('upgrade-'+kind).onclick=()=>{act('upgrade-'+kind);canvas.focus();};
function restart(){if(world.adventure){saveUI.newGame();return;}backpackUI?.close();release();lobby.rematch();progressionKey='';canvas.focus();}
function chooseReward(reward){act('choose-'+reward);}
let progressionKey='';
function updateProgression(){
 const p=world.progression,key=[p.level,p.xp,p.pendingChoices,...Object.values(p.ranks),...Object.values(p.upgrades),...Object.values(p.specials),world.matchState].join(':');if(key===progressionKey)return;progressionKey=key;
 $('level').textContent=`LEVEL ${p.level}`;$('xp-text').textContent=`${p.xp} / ${p.xpToNextLevel} XP`;$('xp-fill').style.width=`${p.xp/p.xpToNextLevel*100}%`;
 $('xp-track').setAttribute('aria-valuenow',p.xp);$('xp-track').setAttribute('aria-valuemax',p.xpToNextLevel);
 $('build-summary').textContent=`Speed +${Math.round((p.speedMultiplier-1)*100)}% · Damage +${p.ranks.power*8}% · Max HP ${p.maxHealth} · Armor ${Math.round(p.damageReduction*100)}%`;
 $('buff-text').textContent=p.lastBuff?`Catch buff: ${p.lastBuff.name} — ${p.lastBuff.description}`:'Every catch grants a random passive buff';
 $('fire-tidal').textContent=`${bindingLabel('tidal')} · Tidal Cannon ×${p.specials.tidal}`;$('fire-whirlpool').textContent=`${bindingLabel('whirlpool')} · Whirlpool ×${p.specials.whirlpool}`;
 $('reward-choice').hidden=!!world.story||p.pendingChoices===0||world.matchState!=='playing';$('reward-heading').textContent=`Level up · Choose a special (${p.pendingChoices})`;
}
let lastAtlasDraw=0;
// The HUD refreshes 30 times a second; unchanged text and bar widths are left alone so the page does not restyle for nothing.
const setText=(element,value)=>{value=String(value);if(element.textContent!==value)element.textContent=value;};
const written=new WeakMap();
function setStyle(element,property,value){let last=written.get(element);if(!last)written.set(element,last={});if(last[property]===value)return;last[property]=value;element.style[property]=value;}
const setWidth=(element,value)=>setStyle(element,'width',value),setHeight=(element,value)=>setStyle(element,'height',value),setBottom=(element,value)=>setStyle(element,'bottom',value);
function updateUI(){
 storyUI?.update();
 saveUI?.update();
 backpackUI?.update(!!lobby.world?.adventure&&!atlasOpen&&world.player.health>0);
 if(world.tradeRequest){const merchant=world.tradeRequest;world.tradeRequest=null;tradeUI?.show(merchant);}
 if(world.wellRequest){world.wellRequest=false;wellUI?.show();}
 if(world.questRequest){const npc=world.questRequest;world.questRequest=null;questUI?.show(npc);}
 tradeUI?.update(!!lobby.world?.adventure&&!atlasOpen&&world.player.health>0);
 wellUI?.update(!!lobby.world?.adventure&&!atlasOpen&&world.player.health>0);
 radioUI?.update(!!lobby.world?.adventure&&!atlasOpen&&!currentScene(world));world.radioPlaying=!!radioUI?.playing;
 skillsUI?.update(!!lobby.world?.adventure&&!atlasOpen&&world.player.health>0);
 codexUI?.update(!!lobby.world?.adventure&&!atlasOpen&&world.player.health>0);
 questUI?.update(!!lobby.world?.adventure&&!atlasOpen&&world.player.health>0);
 setText($('close-atlas'),touchMode?'Close':`Close · ${bindingLabel('map')} / Esc`);
 setText($('cancel'),touchMode?'Abandon':`Abandon · ${bindingLabel('fish')} / Esc`);
 touchUI?.update(world,!touchMode||!lobby.world||atlasOpen||saveUI?.open||settingsUI?.open||storyUI?.open||world.player.health<=0);
 if(touchMode){const npc=nearbyNpc(world);$('touch-examine').disabled=!world.adventure||(!storyPrompt(world)&&!npc&&!nearbyDrop(world)&&!nearWell(world)&&!nearestLandmark(world.player.x,world.player.y,world.areaId));setText($('touch-examine').querySelector('strong'),nearbyDrop(world)?'Pick up':npc?'Talk':'Examine');$('touch-examine').setAttribute('aria-label',nearbyDrop(world)?`Pick up ${itemLabel(nearbyDrop(world).item)}`:npc?`Talk to ${npc.name}`:'Examine nearby landmark');}
 const f=world.fishing,active=f.state==='reeling',busy=f.state!=='idle',inventory=world.inventory;
 $('line-panel').hidden=!active;
 setText($('health-text'),`${Math.ceil(world.player.health)} / ${world.progression.maxHealth} HP`);
 setText($('upgrade-timer'),world.story?'ELI’S JOURNEY':`Next upgrade · ${Math.ceil(world.progression.upgradeRemaining)}s`);
 $('upgrade-bar').hidden=!!world.story;
 $('upgrade-options').hidden=!!world.story||world.progression.pendingUpgrades===0||world.matchState!=='playing'||world.player.health<=0;
 setText($('upgrade-heading'),`Choose an upgrade (${world.progression.pendingUpgrades} available)`);
 const stacks=world.progression.upgrades;setText($('upgrade-stacks'),`Boots ×${stacks.hermes} · Dash ×${stacks.dash} · Health ×${stacks.health}`);
 setText($('dash-status'),`${bindingLabel('dash')} · ${world.player.dashCharges}/${world.progression.maxDashes} DASHES`+(world.dashCooldown>0?` · +1 in ${world.dashCooldown.toFixed(1)}s`:''));
 setWidth($('dash-fill'),`${world.dashRemaining>0?0:(1-world.dashCooldown/2)*100}%`);
 setWidth($('health-fill'),`${world.player.health/world.progression.maxHealth*100}%`);
 setText($('alive-text'),`${world.actors.filter(actor=>actor.health>0).length} / ${world.actors.length} ALIVE`);
 $('countdown').hidden=world.matchState!=='countdown';setText($('countdown-number'),Math.ceil(world.countdownRemaining));
 $('match-end').hidden=!['won','lost','finished'].includes(world.matchState);setText($('match-title'),world.matchState==='won'||(world.matchState==='finished'&&world.player.health>0)?'Last angler standing!':'You were eliminated');
 $('restart').disabled=lobby.mode==='guest';setText($('restart'),lobby.mode==='guest'?'Waiting for host to return to lobby':lobby.mode==='host'?'Return to lobby':'Play again · Enter');
 setText($('match-summary'),`${world.player.catchCount??world.catches.length} catches · ${world.progression.eliminations.size} eliminations · Level ${world.progression.level}`);
 for(const kind of ['tidal','whirlpool'])$('fire-'+kind).disabled=busy||world.player.cooldown>0||world.progression.specials[kind]===0||world.matchState!=='playing';
 setText($('world-state'),world.matchState==='countdown'?'GET READY':active?'REELING':busy?'WAITING FOR A BITE':'EXPLORING');
 setBottom($('catch-bar'),`${(f.bar||0)*100}%`);setBottom($('target'),`${(f.target||0)*100}%`);setHeight($('progress-fill'),active?`${f.progress*100}%`:'0%');setText($('percent'),active?`${Math.floor(f.progress*100)}%`:'0%');
 for(let slot=3;slot<=7;slot++){const button=$(`slot-${slot}`),item=inventory.slots[slot-2];setItemIcon(button.querySelector('.slot-icon'),item?.name);setText(button.querySelector('strong'),item?.name||'Empty');setText(button.querySelector('small'),item?(touchMode?amountLabel(item):`${amountLabel(item)} · ${bindingLabel('use')}`):'Assign from backpack');button.setAttribute('aria-label',`Slot ${slot}: ${item?.name||'empty'}${item?', '+amountLabel(item):''}`);button.classList.toggle('selected',inventory.selected===slot);button.setAttribute('aria-pressed',inventory.selected===slot);button.title=item?.description||'Open backpack to assign an item';}
 for(const slot of [1,2]){const button=$(slot===1?'slot-rod':'slot-item');button.classList.toggle('selected',inventory.selected===slot);button.setAttribute('aria-pressed',inventory.selected===slot);}
 setText($('item-name'),inventory.slots[0]?.name||'Empty slot');setItemIcon($('item-icon'),inventory.slots[0]?.name);setText($('slot-rod').querySelector('small'),rodReady(world.story)?'Permanent':'On the rack');setText($('item-uses'),inventory.slots[0]?(touchMode?amountLabel(inventory.slots[0]):`${amountLabel(inventory.slots[0])} · Click or ${bindingLabel('use')}`):'Assign from backpack');
 let status=active?`Move along shore · Hold ${bindingLabel('reel')} / mouse to reel · ${bindingLabel('fish')} to abandon.`:busy?`Waiting for a bite… ${bindingLabel('fish')} / Esc to abandon.`:world.message||`Walk to shore, aim into water, press ${bindingLabel('fish')}.`;
 if(touchMode){status=status.replace('M opens the area map.','Tap the map to explore.');if(active)status='Hold Reel to raise the bar · Release to lower it';else if(busy)status='Waiting for a bite… Tap Cancel to abandon.';else if(!world.message)status='Drag the left stick to move · Tap water to aim · Use to cast';}
 setText($('status'),status);
 if(world.adventure){
  const places=placesFor(world.areaId),place=nearestLandmark(world.player.x,world.player.y,world.areaId);
  setText($('region-name'),regionAt(world.player.x,world.player.y,world.areaId));
  const purse=marksLabel(world.inventory.marks||0),purseText=$('purse-hud').lastChild;if(purseText.textContent!==purse)purseText.textContent=purse;
  setText($('discovery-count'),`${places.filter(p=>world.discovered.has(p.id)).length} / ${places.length} places found here`);
  setText(document.querySelector('.atlas-heading h2'),areaFor(world.areaId).name);
  const hud=explorationHud(world,(performance.now()-exploreStart)/1000);
  setText($('area-kicker'),areaFor(world.areaId).name.toUpperCase());document.title=`The Wilds · ${areaFor(world.areaId).name}`;
  $('inspect-place').hidden=!hud.prompt;setText($('inspect-place'),hud.prompt||'');$('inspect-place').dataset.key=touchMode?'⌕':bindingLabel('inspect');
  $('explore-hint').hidden=!hud.hintVisible;
  $('quest-objective').hidden=!hud.quest;setText($('quest-objective'),hud.quest||'');$('side-objective').hidden=!hud.sideQuest;setText($('side-objective'),hud.sideQuest||'');document.body.classList.toggle('has-quest',!!hud.quest);
  const key=hud.dots.join();if(key!==dotsKey){dotsKey=key;$('discovery-dots').replaceChildren(...hud.dots.map(found=>{const dot=document.createElement('i');if(found)dot.className='found';return dot;}));}
  setWidth($('upgrade-fill'),`${hud.upgradeFraction*100}%`);
  const hp=hud.health,hpKey=`${hp.current}/${hp.max}`;if(hpKey!==hpShown){
   const bar=$('player-hp');if(hp.fraction<hpFraction){bar.classList.remove('hurt');void bar.offsetWidth;bar.classList.add('hurt');}hpShown=hpKey;hpFraction=hp.fraction;
   setText($('player-hp-text'),`${hp.current} / ${hp.max}`);const hpWidth=`${hp.fraction*100}%`;setWidth($('player-hp-fill'),hpWidth);setWidth($('player-hp-trail'),hpWidth);
   bar.classList.toggle('low',hp.low);bar.setAttribute('aria-valuenow',hp.current);bar.setAttribute('aria-valuemax',hp.max);
  }
  const pips=$('dash-pips');if(pips.childElementCount!==world.progression.maxDashes)pips.replaceChildren(...Array.from({length:world.progression.maxDashes},()=>document.createElement('i')));
  [...pips.children].forEach((pip,i)=>pip.classList.toggle('spent',i>=world.player.dashCharges));
  const message=$('status').textContent;if(message!==lastMessage){lastMessage=message;messageSince=performance.now();}
  document.querySelector('.status').classList.toggle('quiet',!busy&&performance.now()-messageSince>8000);
  drawMinimap($('mini-atlas'));if(atlasOpen&&performance.now()-lastAtlasDraw>250){lastAtlasDraw=performance.now();drawMap($('atlas-canvas'));}
  hudUI?.update(world,hud,{visible:true,blocked:!!currentScene(world)||!!storyUI?.open||atlasOpen||sheetOpen()});
 }
 else hudUI?.update(world,null,{visible:false});
}
const sheetOpen=()=>!!(backpackUI?.open||tradeUI?.open||wellUI?.open||radioUI?.open||skillsUI?.open||codexUI?.open||questUI?.open||saveUI?.open||settingsUI?.open||hudUI?.open);
// The adventure is the main player flow; legacy arena code remains an internal fixture.
document.title='The Wilds · Reedwater Landing';
document.querySelector('.lobby-eyebrow').textContent='THE WILDS';
document.querySelector('.lobby-card h1').textContent='Grandpa left you a map.';
document.querySelector('.lobby-note').textContent='WASD explore · Mouse aim · E fish · G examine · M atlas';
document.querySelector('header h1').textContent='THE WILDS';
document.querySelector('.controls').textContent='WASD MOVE · E FISH · G EXAMINE · M ATLAS · L-SHIFT DASH';
document.querySelector('.lobby-actions').insertAdjacentHTML('afterbegin','<button id="explore-world">Enter the Wilds</button>');
document.querySelector('.playfield').insertAdjacentHTML('beforeend',`<section id="exploration-hud" hidden><span class="exploration-kicker" id="area-kicker">YOUR JOURNEY</span><h2 id="region-name">Reedwater Delta</h2><div id="player-hp" role="progressbar" aria-label="Health" aria-valuemin="0" aria-valuemax="100" aria-valuenow="100"><div class="hp-row"><span class="hp-label">HP</span><span id="player-hp-text">100 / 100</span></div><div class="hp-track"><i id="player-hp-trail"></i><i id="player-hp-fill"></i></div></div><p id="discovery-count">0 / 10 places found</p><div class="discovery-dots" id="discovery-dots"></div><p id="purse-hud" title="Reed marks">${markIcon(14)}<span></span></p></section><button id="inspect-place" hidden>G · Examine</button><div id="explore-hint" hidden><kbd>WASD</kbd> walk · <kbd>E</kbd> fish · <kbd>G</kbd> examine · <kbd>M</kbd> map · <kbd>Shift</kbd> dash</div><button id="music-icon" aria-label="Music settings" aria-expanded="false">♪</button><button id="open-atlas" hidden aria-label="Open world atlas"><canvas id="mini-atlas" width="176" height="176"></canvas><span>M · WORLD ATLAS</span></button><section id="world-atlas" hidden role="dialog" aria-modal="true" aria-label="World atlas"><div class="atlas-card"><div class="atlas-heading"><div><small>THE WILDS</small><h2>World Atlas</h2></div><button id="close-atlas">Close · M / Esc</button></div><canvas id="atlas-canvas" width="800" height="600"></canvas><p>Follow the old trails and bridges. Gold marks the places you have found. Your position is the bright marker.</p></div></section>`);
touchUI=mountMobileControls({state:touchState,active:()=>touchMode&&!!lobby.world&&!atlasOpen&&!hudUI?.open&&!saveUI?.open&&!backpackUI?.open&&!tradeUI?.open&&!wellUI?.open&&!radioUI?.open&&!skillsUI?.open&&!codexUI?.open&&!questUI?.open&&!settingsUI?.open&&!storyUI?.open&&!currentScene(world),action:()=>{pointer=null;const f=world.fishing;if(f.state==='waiting')act('cancel');else if(f.state==='idle')act('click');},examine:()=>{world.inspect();canvas.focus();}});
let atlasOpen=false,exploreStart=performance.now(),lastMessage='',messageSince=0,dotsKey='',hpShown='',hpFraction=1;
$('upgrade-timer').insertAdjacentHTML('afterend','<div id="upgrade-bar"><i id="upgrade-fill"></i></div><p id="quest-objective" hidden aria-live="polite"></p><p id="side-objective" hidden aria-live="polite"></p>');
document.querySelector('.hotbar').insertAdjacentHTML('beforeend','<div class="dash-mini"><div id="dash-pips"></div><span>DASH</span></div>');
$('music-icon').onclick=()=>{const open=document.querySelector('.music-hud').classList.toggle('open');$('music-icon').setAttribute('aria-expanded',open);canvas.focus();};
$('open-atlas').setAttribute('aria-label','Open area map');$('open-atlas').querySelector('span').textContent='M · AREA MAP';
$('world-atlas').setAttribute('aria-label','Area map');document.querySelector('.atlas-card p').textContent='Walk through the marked map edge to reach the connecting path. Gold marks places you have found; the bright marker shows your position.';
canvas.setAttribute('aria-label','Reedwater exploration. WASD move, E fish, G examine, M area map, Left Shift dash.');
const atlasImages=new Map();
function drawMap(target){
 const area=areaFor(world.areaId),key=`${area.id}:${target.width}:${target.height}`;let base=atlasImages.get(key);
 if(!base){base=document.createElement('canvas');base.width=target.width;base.height=target.height;paintAtlas(base.getContext('2d'),base.width,base.height,null,new Set(),area.id);atlasImages.set(key,base);}
 const c=target.getContext('2d');c.imageSmoothingEnabled=false;c.drawImage(base,0,0);
 const sx=target.width/area.width,sy=target.height/area.height;
 if(area.id==='landing'){paintStoryMap(c,sx,sy,world.story);if(target.width>400&&world.story){c.font='bold 12px monospace';c.textAlign='center';c.fillStyle='#fff0c9';c.fillText(cabinDamaged(world.story)?'Damaged Cabin':'Grandpa’s Cabin',1630*sx,1300*sy);}}
 const guide=world.story?.guide;if(guide&&(guide.areaId||'landing')===area.id){c.fillStyle='#99e4df';c.beginPath();c.arc(guide.x*sx,guide.y*sy,4,0,Math.PI*2);c.fill();if(target.width>400){c.font='bold 12px monospace';c.textAlign='center';c.fillText('Your guide',guide.x*sx,guide.y*sy-10);}}
 for(const p of placesFor(area.id))if(world.discovered.has(p.id)){c.fillStyle='#e8be65';c.fillRect(p.x*sx-3,p.y*sy-3,6,6);}
 c.fillStyle='#fff4c1';c.strokeStyle='#20383d';c.lineWidth=2;c.beginPath();c.arc(world.player.x*sx,world.player.y*sy,4,0,Math.PI*2);c.fill();c.stroke();
}
// The minimap follows Eli: a close crop of the area atlas, centred on him.
function drawMinimap(target){
 const area=areaFor(world.areaId),key=`${area.id}:800:600`;let base=atlasImages.get(key);
 if(!base){base=document.createElement('canvas');base.width=800;base.height=600;paintAtlas(base.getContext('2d'),800,600,null,new Set(),area.id);atlasImages.set(key,base);}
 const c=target.getContext('2d'),span=Math.min(area.width,area.height,900),zoom=target.width/span,sx=zoom,sy=zoom;
 c.setTransform(1,0,0,1,0,0);c.fillStyle='#24413a';c.fillRect(0,0,target.width,target.height);c.imageSmoothingEnabled=false;
 c.setTransform(1,0,0,1,target.width/2-world.player.x*zoom,target.height/2-world.player.y*zoom);
 c.drawImage(base,0,0,area.width*zoom,area.height*zoom);
 if(area.id==='landing')paintStoryMap(c,sx,sy,world.story);
 const guide=world.story?.guide;if(guide&&(guide.areaId||'landing')===area.id){c.fillStyle='#e8c46a';c.save();c.translate(guide.x*sx,guide.y*sy);c.rotate(Math.PI/4);c.fillRect(-4,-4,8,8);c.restore();}
 for(const p of placesFor(area.id))if(world.discovered.has(p.id)){c.fillStyle='#e8be65';c.fillRect(p.x*sx-2,p.y*sy-2,4,4);}
 c.setTransform(1,0,0,1,target.width/2,target.height/2);c.rotate(world.player.angle+Math.PI/2);
 c.fillStyle='#fff4c1';c.strokeStyle='#20383d';c.lineWidth=2;c.beginPath();c.moveTo(0,-9);c.lineTo(7,7);c.lineTo(0,3);c.lineTo(-7,7);c.closePath();c.stroke();c.fill();c.setTransform(1,0,0,1,0,0);
}
function toggleAtlas(open=!atlasOpen){if(open){backpackUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();}atlasOpen=open;release();if(open&&touchUI)touchUI.update(world,true);$('world-atlas').hidden=!open;if(open)drawMap($('atlas-canvas'));else canvas.focus();}
$('open-atlas').onclick=()=>toggleAtlas(true);$('close-atlas').onclick=()=>toggleAtlas(false);$('inspect-place').onclick=()=>{world.inspect();canvas.focus();};
const lobby=new Lobby(updateLobby);
skillsUI=mountSkills({getWorld:()=>world,onOpen:()=>{toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();}});
codexUI=mountCodex({getWorld:()=>world,onOpen:()=>{backpackUI?.close();skillsUI?.close();questUI?.close();toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();},onFamiliar:(id,action)=>world.familiarAction(id,action)});
tradeUI=mountTrade({getWorld:()=>world,onOpen:()=>{backpackUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();}});
radioUI=mountRadio({onOpen:()=>{backpackUI?.close();tradeUI?.close();wellUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();}});
radioUI.mountChip(document.querySelector('.playfield'));
wellUI=mountWell({getWorld:()=>world,onOpen:()=>{backpackUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();}});
questUI=mountQuests({getWorld:()=>world,onOpen:()=>{backpackUI?.close();skillsUI?.close();codexUI?.close();toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();},onTrade:id=>tradeUI?.show(id)});
backpackUI=mountBackpack({getWorld:()=>world,onOpen:()=>{toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();},onAction:(id,action,slot)=>world.backpackAction(id,action,slot)});
saveUI=mountSaveUI({getWorld:()=>lobby.world,
 onLoad:restored=>{lobby.stop();lobby.mode='solo';lobby.world=restored;lobby.notify();progressionKey='';exploreStart=performance.now();release();canvas.focus();},
 onNew:()=>{lobby.explore();progressionKey='';exploreStart=performance.now();release();canvas.focus();return lobby.world;},
 onTitle:()=>{lobby.stop();lobby.notify();},onOpen:()=>{backpackUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();toggleAtlas(false);release();},onClose:()=>{release();canvas.focus();}
});
document.addEventListener('visibilitychange',()=>{if(document.visibilityState==='hidden')saveUI.flush();});
addEventListener('pagehide',()=>saveUI.flush());
function updateLobby(){
 saveUI?.update();
 backpackUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();
 document.body.classList.toggle('exploring',!!lobby.world?.adventure);
 $('exploration-hud').hidden=!lobby.world?.adventure;$('open-atlas').hidden=!lobby.world?.adventure;
 if(!lobby.world)toggleAtlas(false);
 document.querySelector('.lobby-note').textContent=touchMode?'Drag the left stick to move · Tap water to aim · Use · Examine':'WASD explore · Mouse aim · E fish · G examine · M atlas';
 $('lobby-screen').hidden=!!lobby.world;if(touchUI)touchUI.update(world,!touchMode||!lobby.world);
 $('leave-lobby').hidden=lobby.mode==='menu';
 $('lobby-status').textContent=lobby.mode==='menu'?'Chapter 1 · The Old Fishing Hut. Follow Eli from the dock to a night that changes everything.':lobby.status;
 const inRoom=['host','guest'].includes(lobby.mode),connecting=['creating','joining'].includes(lobby.mode);
 $('lobby-menu').hidden=inRoom;$('room-panel').hidden=!inRoom;
 $('create-room').disabled=connecting;$('join-room').disabled=connecting;
 $('room-code').value=lobby.code||'';
 $('room-members').replaceChildren(...lobby.members.map(member=>{const li=document.createElement('li');li.textContent=`${member.name}${member.id===lobby.id?' (you)':''} — ${member.ready?'Ready':'Not ready'}`;return li;}));
 $('ready-up').textContent=lobby.members.find(m=>m.id===lobby.id)?.ready?'Not ready':'Ready up';
 $('start-match').hidden=lobby.mode!=='host';$('start-match').disabled=lobby.members.length<2||!lobby.members.every(m=>m.ready);
 if(lobby.world)world=lobby.world;
 else {release();for(const id of ['countdown','match-end','reward-choice','line-panel'])$(id).hidden=true;}
}
$('practice').onclick=()=>{lobby.practice();progressionKey='';canvas.focus();};
$('explore-world').textContent='New game';
$('explore-world').onclick=()=>saveUI.newGame();
$('create-room').onclick=()=>lobby.connect($('player-name').value);
$('join-room').onclick=()=>{let code=$('join-code').value.trim();try{if(code.includes('://'))code=new URL(code).searchParams.get('room')||'';}catch{}if(!/^fish-[a-f0-9]{12}$/.test(code)){lobby.status='Paste a valid invite link or room code.';updateLobby();return;}lobby.connect($('player-name').value,code);};
$('ready-up').onclick=()=>lobby.toggleReady();$('start-match').onclick=()=>{if(lobby.start()){release();canvas.focus();}};
$('leave-lobby').onclick=()=>lobby.leave();
$('copy-invite').onclick=async()=>{const url=new URL(location.href);url.search='';url.searchParams.set('room',lobby.code);try{await navigator.clipboard.writeText(url.href);lobby.status='Invite link copied. Send it to your friends.';}catch{lobby.status='Copy this room code and share the game URL.';$('room-code').select();}updateLobby();};
const invitation=new URL(location.href).searchParams.get('room');if(invitation)$('join-code').value=invitation;
preferences.subscribe(()=>{release();progressionKey='';refreshKeyHints();});
function refreshKeyHints(){
 const move=['up','left','down','right'].map(bindingLabel).join('/');
 document.querySelector('.controls').textContent=move+' MOVE · '+bindingLabel('fish')+' FISH · '+bindingLabel('inspect')+' EXAMINE · '+bindingLabel('map')+' ATLAS · '+bindingLabel('dash')+' DASH';
 document.querySelector('.lobby-note').textContent=document.querySelector('.controls').textContent;
 $('explore-hint').textContent=document.querySelector('.controls').textContent;
 $('open-atlas').querySelector('span').textContent=bindingLabel('map')+' · WORLD ATLAS';
 for(let slot=1;slot<=7;slot++)$(slot===1?'slot-rod':slot===2?'slot-item':'slot-'+slot).querySelector('kbd').textContent=bindingLabel('slot'+slot);
}
refreshKeyHints();
mountScreenControls({onChange:()=>release()});
settingsUI=mountSettings({onOpen:()=>{release();backpackUI?.close();skillsUI?.close();codexUI?.close();questUI?.close();toggleAtlas(false);},onClose:()=>{release();if(!storyUI?.open)canvas.focus();}});
hudUI=mountHudShell({act,examine:()=>{world.inspect();canvas.focus();},openAtlas:()=>toggleAtlas(true),openQuests:()=>questUI.show(),openWell:()=>wellUI.show(),openRadio:()=>radioUI.show(),isTouch:()=>touchMode});
storyUI=mountStory({getWorld:()=>lobby.world,onAdvance:()=>{release();lastAtlasDraw=0;canvas.focus();},onSettings:()=>settingsUI.show(),isSettingsOpen:()=>settingsUI.open});
document.addEventListener('click',e=>{if(e.target.closest('button')&&!e.target.closest('#story-scene,#settings-sfx-test'))playSfx('ui');});
updateLobby();
let accumulator=0,last=performance.now(),lastUI=0,lastRender=0;
function frame(now){accumulator+=Math.min((now-last)/1000,.1);last=now;while(accumulator>=1/120){if(!hudUI?.open&&!backpackUI?.open&&!tradeUI?.open&&!wellUI?.open&&!radioUI?.open&&!skillsUI?.open&&!codexUI?.open&&!questUI?.open&&!saveUI?.open&&!settingsUI?.open&&!document.hidden){if(storyAction(lobby.world))updateStoryAction(lobby.world,1/120);else if(!storyUI?.open){lobby.tick(1/120,currentInput());observeGameSounds(lobby.world);}}accumulator-=1/120;}
 if(lobby.world)world=lobby.world;
 if(now-lastRender<1000/60){requestAnimationFrame(frame);return;}lastRender=now-((now-lastRender)%(1000/60));
 const display=lobby.presentation();camera(display?.player||world.player);const dpr=view.dpr;
 ctx.setTransform(1,0,0,1,0,0);ctx.fillStyle=INTERIOR_AREAS.includes(world.areaId)?'#101d20':'#1c4754';ctx.fillRect(0,0,canvas.width,canvas.height);
 ctx.setTransform(dpr*view.scale,0,0,dpr*view.scale,dpr*view.x,dpr*view.y);
 render(ctx,display||world,{left:-view.x/view.scale,top:-view.y/view.scale,right:(view.width-view.x)/view.scale,bottom:(view.height-view.y)/view.scale});drawStoryWeather(ctx,world,{left:-view.x/view.scale,top:-view.y/view.scale,right:(view.width-view.x)/view.scale,bottom:(view.height-view.y)/view.scale},now/1000);if(touchMode&&touchState.manualAim&&lobby.world&&!atlasOpen){const a=touchState.manualAim;ctx.strokeStyle='#fff1bc';ctx.lineWidth=1.5/view.scale;ctx.beginPath();ctx.arc(a.x,a.y,9/view.scale,0,Math.PI*2);ctx.moveTo(a.x-14/view.scale,a.y);ctx.lineTo(a.x+14/view.scale,a.y);ctx.moveTo(a.x,a.y-14/view.scale);ctx.lineTo(a.x,a.y+14/view.scale);ctx.stroke();}if(lobby.world&&now-lastUI>=1000/30){lastUI=now;updateProgression();updateUI();}requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
(window.requestIdleCallback||setTimeout)(()=>preloadProps());
