import {currentScene,SCENES,chapterHeading} from './story.js';
import {STORY_ART,STORY_VIDEO} from './sprite-definitions.js';
import {createCutscenePlayer} from './cutscene-video.js';
import {spriteAssetUrl,drawEntitySprite} from './sprites.js';
import {dialogueMarkup,setDialogueText,drawDialoguePortrait} from './dialogue-view.js';
import {cutscenePresentation} from './cutscene-presentation.js';
import {NARRATOR,VOICE} from './scene-script.js';
import {CORE,OCELOT} from './chapter6.js';
import {playSfx} from './sfx.js';
import {storyActionElapsed,NIGHT_ATTACK} from './story-action.js';
// Eli learns the chief's name at the end of Chapter 4; every title shares her portrait.
const EMILIA_NAMES=['The old woman','The chief','Emilia'];
export function mountStory({getWorld,onAdvance=()=>{},onSettings=()=>{},isSettingsOpen=()=>false}){
 const dialog=document.createElement('dialog');dialog.id='story-scene';dialog.setAttribute('aria-labelledby','story-title');
 dialog.innerHTML=`<div class="cutscene-picture" hidden><img id="story-image" alt=""><canvas id="story-creature" width="1000" height="500" hidden></canvas></div><div class="cutscene-veil"></div>${dialogueMarkup('story')}<div class="scene-toolbar"><button id="story-skip" hidden>Show dialogue</button><button id="story-admire" hidden>Admire art</button><button id="story-skip-scene" hidden>Skip scene ⏭</button><button id="story-settings">⚙ Settings</button></div><span class="scene-loading" hidden>Loading artwork…</span><div class="cutscene-video" hidden><button id="story-video-skip">Skip video ›</button></div>`;
 document.body.append(dialog);const q=id=>dialog.querySelector('#'+id),picture=dialog.querySelector('.cutscene-picture'),veil=dialog.querySelector('.cutscene-veil'),box=dialog.querySelector('.dialogue-box'),img=q('story-image'),canvas=q('story-creature');
 let skipArmed=0,key='',artId='',lastWorld=null,lastDialogue=null,historyPage=null,visualKey='',elapsed=0,ready=true,failed=false,loadingAt=0,lastTick=performance.now(),generation=0,canAdvance=true;
 // Each artwork plays as a cutscene the first time only; later pages open straight on the dialogue, and Admire art brings it back.
 const seenArt=new WeakMap(),seenFor=w=>{let s=seenArt.get(w);if(!s)seenArt.set(w,s=new Set());return s;};
 function model(){
  const w=getWorld();if(!w)return null;
  if(currentScene(w)){
   const page=historyPage??w.story.page,scene=SCENES[w.story.scene][page],name=scene.speaker||'Eli';
   const speaker=['The girl','Mara'].includes(name)?w.npcs.find(n=>n.id==='mara')||{id:'mara',name}:EMILIA_NAMES.includes(name)?{id:'emilia',name}:name===NARRATOR?{id:'narrator',name}:name===VOICE?{id:'voice',name}:name===CORE?{id:'core',name}:name==='Drayfus'?w.npcs.find(n=>n.id==='drayfus')||{id:'drayfus',name,npc:true,spriteId:'drayfus-story'}:name===OCELOT?{id:'ocelot',name,npc:true,creature:true,spriteId:'ocelot'}:w.player;
   return {w,scene,speaker:{...speaker,name},page,count:SCENES[w.story.scene].length,story:true};
  }
  if(w.dialogue){const speaker=w.npcs.find(n=>n.id===w.dialogue.npcId);if(speaker)return {w,scene:{title:`A conversation with ${speaker.name}`,text:w.dialogue.text},speaker:{...speaker,npc:true},page:0,count:1,story:false};}
  return null;
 }
 function closeConversation(){const m=model();if(!m||m.scene.action)return;if(m.story)m.w.storySuspended=true;else m.w.dialogue=null;historyPage=null;onAdvance();update();}
 function next(force=false){
  const m=model();if(!m||m.scene.action||!(canAdvance||force)||isSettingsOpen())return;
  if(m.story&&historyPage!==null&&historyPage<m.w.story.page){historyPage++;if(historyPage===m.w.story.page)historyPage=null;}
  else if(m.story){historyPage=null;m.w.advanceStory();}else m.w.dialogue=null;
  playSfx('page');onAdvance();update();
 }
 // Skip runs the rest of the scene at once. The first press asks, so a stray tap never throws away a story.
 function skipScene(){
  const m=model();if(!m||!m.story||m.scene.action||isSettingsOpen())return;
  if(!skipArmed||performance.now()-skipArmed>3000){skipArmed=performance.now();q('story-skip-scene').textContent='Skip whole scene? Tap again';return;}
  skipArmed=0;q('story-skip-scene').textContent='Skip scene ⏭';historyPage=null;m.w.skipStory();playSfx('page');onAdvance();update();
 }
 function previous(){const m=model();if(!m||!m.story||m.page===0||!canAdvance)return;historyPage=m.page-1;playSfx('page');update();}
 q('story-next').onclick=next;q('story-previous').onclick=previous;q('story-close').onclick=q('story-end').onclick=closeConversation;
 // A video page turns itself when the video ends; Skip does the same at once. A video that cannot play falls back to its text page.
 const cutscene=createCutscenePlayer(dialog.querySelector('.cutscene-video'),{onEnd:()=>next(true),onFail:()=>update()});
 q('story-video-skip').onclick=()=>next(true);
 q('story-settings').onclick=onSettings;q('story-skip-scene').onclick=skipScene;q('story-skip').onclick=()=>{elapsed=1e6;update();};
 q('story-admire').onclick=()=>{const m=model();if(!m||!artId)return;visualKey='';setupVisual(m,true);update();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeConversation();});
 dialog.addEventListener('keydown',e=>{
  if(isSettingsOpen())return;
  if(['Enter','Space','ArrowRight'].includes(e.code)&&!e.repeat&&(!e.target.closest('button')||e.target.closest('#story-next'))){e.preventDefault();next();}
  if(e.code==='ArrowLeft'&&!e.repeat){e.preventDefault();previous();}e.stopPropagation();
 });
 function setupVisual(m,admire=false){
  const art=STORY_ART[m.scene.art],id=art?.asset||m.scene.creature||'',seen=seenFor(m.w),moment=m.scene.artMoment||id;artId=id;
  // Artwork already on screen stays behind the dialogue for the following pages.
  if(id&&id===visualKey)return;
  const show=id&&(admire||!seen.has(moment))?id:'';if(show)seen.add(moment);
  if(show===visualKey)return;visualKey=show;elapsed=0;ready=!show;failed=false;loadingAt=performance.now();const token=++generation;
  picture.hidden=!show;img.hidden=!(art&&show);canvas.hidden=!(m.scene.creature&&show);
  if(art&&show){img.alt=art.alt;img.src=spriteAssetUrl(art.asset);img.decode().then(()=>{if(token===generation)ready=true;}).catch(()=>{if(token===generation){ready=true;failed=true;}});}
  else img.removeAttribute('src');
 }
 const videoId=m=>`${m.w.story.scene}:${m.page}`;
 function update(){
  const now=performance.now(),dt=Math.min(100,Math.max(0,now-lastTick));lastTick=now;
  let m=model();if(cutscene.id&&!(m?.scene.video&&cutscene.id===videoId(m)))cutscene.stop();
  if(m?.scene.action&&!(m.scene.action==='rescue'&&storyActionElapsed(m.w)>=NIGHT_ATTACK.fight)){if(dialog.open)dialog.close();key='';visualKey='';historyPage=null;generation++;return;}if(!m){if(dialog.open)dialog.close();key='';visualKey='';historyPage=null;lastWorld=null;lastDialogue=null;generation++;return;}
  if(m.w!==lastWorld||(!m.story&&m.w.dialogue!==lastDialogue)){historyPage=null;m=model();}
  const nextKey=m.story?`${m.w.story.scene}:${m.page}`:`npc:${m.w.dialogue.npcId}:${m.w.dialogue.text}`;
  if(nextKey!==key||m.w!==lastWorld||m.w.dialogue!==lastDialogue){
   key=nextKey;lastWorld=m.w;lastDialogue=m.w.dialogue;setupVisual(m);
   q('story-name').textContent=m.speaker.name;q('story-title').textContent=m.scene.title;
   q('story-chapter').textContent=m.story?chapterHeading(m.w.story.scene):'THE WILDS';setDialogueText(q('story-text'),m.scene.text);box.dataset.voice=m.speaker.id==='narrator'?'narration':m.scene.thought?'thought':m.speaker.id==='voice'?'voice':m.speaker.id==='core'?'core':'speech';
   // The Region Core's writing floats in the world: replay its fade-in on every new line.
   box.classList.remove('core-in');if(box.dataset.voice==='core'){void box.offsetWidth;box.classList.add('core-in');}
   q('story-page').textContent=`${m.page+1} / ${m.count}`;q('story-previous').disabled=!m.story||m.page===0;
   q('story-next').firstChild.textContent=m.story?'Next › ':'Done ';if(!dialog.open)dialog.showModal();q('story-next').focus();
  }
  if(m.scene.video&&cutscene.play(videoId(m),STORY_VIDEO[m.scene.video],isSettingsOpen()||document.hidden)){
   canAdvance=false;dialog.dataset.phase='video';picture.style.opacity='0';veil.style.opacity='0';box.style.visibility='hidden';q('story-skip').hidden=q('story-admire').hidden=true;q('story-skip-scene').hidden=false;dialog.querySelector('.scene-loading').hidden=true;return;
  }
  if(m.scene.creature&&visualKey){
   const c=canvas.getContext('2d');c.clearRect(0,0,1000,500);
   if(drawEntitySprite(c,m.scene.creature,{x:500,y:465,time:now/1000}))ready=true;
   else if(now-loadingAt>2500){ready=true;failed=true;}
  }
  if(ready&&!isSettingsOpen()&&!document.hidden)elapsed+=dt;
  const p=cutscenePresentation(elapsed,!!visualKey&&!failed);canAdvance=p.ready&&ready;
  dialog.dataset.phase=ready?p.phase:'loading';picture.style.opacity=String(failed?0:p.art);veil.style.opacity=String(p.darkness);box.style.opacity=String(p.dialogue);
  box.style.visibility=p.dialogue>0&&ready&&!m.scene.action?'visible':'hidden';q('story-next').disabled=!canAdvance;q('story-previous').disabled=!canAdvance||!m.story||m.page===0;
  q('story-skip').hidden=!!m.scene.action||!visualKey||p.ready||!ready;dialog.querySelector('.scene-loading').hidden=ready;
  q('story-admire').hidden=!!m.scene.action||!artId||!ready||!p.ready;
  if(skipArmed&&now-skipArmed>3000){skipArmed=0;q('story-skip-scene').textContent='Skip scene ⏭';}
  q('story-skip-scene').hidden=!m.story||!!m.scene.action;
  drawDialoguePortrait(q('story-portrait'),m.speaker);
 }
 // While a video fills the screen the world underneath is hidden, so the game can skip drawing it.
 return {update,get open(){return dialog.open;},get covering(){return dialog.open&&cutscene.playing;}};
}


