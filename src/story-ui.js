import {currentScene,SCENES,chapterHeading} from './story.js';
import {STORY_ART} from './sprite-definitions.js';
import {spriteAssetUrl,drawEntitySprite} from './sprites.js';
import {dialogueMarkup,setDialogueText,drawDialoguePortrait} from './dialogue-view.js';
import {cutscenePresentation} from './cutscene-presentation.js';
import {playSfx} from './sfx.js';
import {storyActionElapsed,NIGHT_ATTACK} from './story-action.js';
// Eli learns the chief's name at the end of Chapter 4; every title shares her portrait.
const EMILIA_NAMES=['The old woman','The chief','Emilia'];
export function mountStory({getWorld,onAdvance=()=>{},onSettings=()=>{},isSettingsOpen=()=>false}){
 const dialog=document.createElement('dialog');dialog.id='story-scene';dialog.setAttribute('aria-labelledby','story-title');
 dialog.innerHTML=`<div class="cutscene-picture" hidden><img id="story-image" alt=""><canvas id="story-creature" width="1000" height="500" hidden></canvas></div><div class="cutscene-veil"></div>${dialogueMarkup('story')}<div class="scene-toolbar"><button id="story-skip" hidden>Show dialogue</button><button id="story-settings">⚙ Settings</button></div><span class="scene-loading" hidden>Loading artwork…</span>`;
 document.body.append(dialog);const q=id=>dialog.querySelector('#'+id),picture=dialog.querySelector('.cutscene-picture'),veil=dialog.querySelector('.cutscene-veil'),box=dialog.querySelector('.dialogue-box'),img=q('story-image'),canvas=q('story-creature');
 let key='',lastWorld=null,lastDialogue=null,historyPage=null,visualKey='',elapsed=0,ready=true,failed=false,loadingAt=0,lastTick=performance.now(),generation=0,canAdvance=true;
 function model(){
  const w=getWorld();if(!w)return null;
  if(currentScene(w)){
   const page=historyPage??w.story.page,scene=SCENES[w.story.scene][page],name=scene.speaker||'Eli';
   const speaker=['The girl','Mara'].includes(name)?w.npcs.find(n=>n.id==='mara')||{id:'mara',name}:EMILIA_NAMES.includes(name)?{id:'emilia',name}:w.player;
   return {w,scene,speaker:{...speaker,name},page,count:SCENES[w.story.scene].length,story:true};
  }
  if(w.dialogue){const speaker=w.npcs.find(n=>n.id===w.dialogue.npcId);if(speaker)return {w,scene:{title:`A conversation with ${speaker.name}`,text:w.dialogue.text},speaker:{...speaker,npc:true},page:0,count:1,story:false};}
  return null;
 }
 function closeConversation(){const m=model();if(!m||m.scene.action)return;if(m.story)m.w.storySuspended=true;else m.w.dialogue=null;historyPage=null;onAdvance();update();}
 function next(){
  const m=model();if(!m||m.scene.action||!canAdvance||isSettingsOpen())return;
  if(m.story&&historyPage!==null&&historyPage<m.w.story.page){historyPage++;if(historyPage===m.w.story.page)historyPage=null;}
  else if(m.story){historyPage=null;m.w.advanceStory();}else m.w.dialogue=null;
  playSfx('page');onAdvance();update();
 }
 function previous(){const m=model();if(!m||!m.story||m.page===0||!canAdvance)return;historyPage=m.page-1;playSfx('page');update();}
 q('story-next').onclick=next;q('story-previous').onclick=previous;q('story-close').onclick=q('story-end').onclick=closeConversation;
 q('story-settings').onclick=onSettings;q('story-skip').onclick=()=>{elapsed=1e6;update();};
 dialog.addEventListener('cancel',e=>{e.preventDefault();closeConversation();});
 dialog.addEventListener('keydown',e=>{
  if(isSettingsOpen())return;
  if(['Enter','Space','ArrowRight'].includes(e.code)&&!e.repeat&&(!e.target.closest('button')||e.target.closest('#story-next'))){e.preventDefault();next();}
  if(e.code==='ArrowLeft'&&!e.repeat){e.preventDefault();previous();}e.stopPropagation();
 });
 function setupVisual(m){
  const art=STORY_ART[m.scene.art],id=art?.asset||m.scene.creature||'';
  if(id===visualKey)return;visualKey=id;elapsed=0;ready=!id;failed=false;loadingAt=performance.now();const token=++generation;
  picture.hidden=!id;img.hidden=!art;canvas.hidden=!m.scene.creature;
  if(art){img.alt=art.alt;img.src=spriteAssetUrl(art.asset);img.decode().then(()=>{if(token===generation)ready=true;}).catch(()=>{if(token===generation){ready=true;failed=true;}});}
  else img.removeAttribute('src');
 }
 function update(){
  const now=performance.now(),dt=Math.min(100,Math.max(0,now-lastTick));lastTick=now;
  let m=model();if(m?.scene.action&&!(m.scene.action==='rescue'&&storyActionElapsed(m.w)>=NIGHT_ATTACK.fight)){if(dialog.open)dialog.close();key='';visualKey='';historyPage=null;generation++;return;}if(!m){if(dialog.open)dialog.close();key='';visualKey='';historyPage=null;lastWorld=null;lastDialogue=null;generation++;return;}
  if(m.w!==lastWorld||(!m.story&&m.w.dialogue!==lastDialogue)){historyPage=null;m=model();}
  const nextKey=m.story?`${m.w.story.scene}:${m.page}`:`npc:${m.w.dialogue.npcId}:${m.w.dialogue.text}`;
  if(nextKey!==key||m.w!==lastWorld||m.w.dialogue!==lastDialogue){
   key=nextKey;lastWorld=m.w;lastDialogue=m.w.dialogue;setupVisual(m);
   q('story-name').textContent=m.speaker.name;q('story-title').textContent=m.scene.title;
   q('story-chapter').textContent=m.story?chapterHeading(m.w.story.scene):'THE WILDS';setDialogueText(q('story-text'),m.scene.text);
   q('story-page').textContent=`${m.page+1} / ${m.count}`;q('story-previous').disabled=!m.story||m.page===0;
   q('story-next').firstChild.textContent=m.story?'Next › ':'Done ';if(!dialog.open)dialog.showModal();q('story-next').focus();
  }
  if(m.scene.creature){
   const c=canvas.getContext('2d');c.clearRect(0,0,1000,500);
   if(drawEntitySprite(c,m.scene.creature,{x:500,y:465,time:now/1000}))ready=true;
   else if(now-loadingAt>2500){ready=true;failed=true;}
  }
  if(ready&&!isSettingsOpen()&&!document.hidden)elapsed+=dt;
  const p=cutscenePresentation(elapsed,!!visualKey&&!failed);canAdvance=p.ready&&ready;
  dialog.dataset.phase=ready?p.phase:'loading';picture.style.opacity=String(failed?0:p.art);veil.style.opacity=String(p.darkness);box.style.opacity=String(p.dialogue);
  box.style.visibility=p.dialogue>0&&ready&&!m.scene.action?'visible':'hidden';q('story-next').disabled=!canAdvance;q('story-previous').disabled=!canAdvance||!m.story||m.page===0;
  q('story-skip').hidden=!!m.scene.action||!visualKey||p.ready||!ready;dialog.querySelector('.scene-loading').hidden=ready;
  drawDialoguePortrait(q('story-portrait'),m.speaker);
 }
 return {update,get open(){return dialog.open;}};
}


