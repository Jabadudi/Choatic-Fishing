import {spriteAssetUrl} from './sprites.js';
import {holdMusic} from './music.js';
import {preferences} from './preferences.js';
// Full-screen story videos. The <video> element exists only while a clip plays: it is built for the clip and removed
// afterwards, so no decoder, buffered frames or listeners outlive the cutscene. Every story video shares this player;
// add a clip to STORY_VIDEO and a `video:` key on its story page.
export function createCutscenePlayer(layer,{onEnd=()=>{},onFail=()=>{}}={}){
 let video=null,playingId='',failedId='',held=false;
 const start=()=>video.play().catch(()=>{if(video)video.controls=true;});
 function release(){
  if(!video)return;
  const v=video;video=null;playingId='';held=false;
  v.pause();v.removeAttribute('src');v.load();v.remove();
  layer.hidden=true;holdMusic(false);
 }
 // Leaving the page forgets a failed clip too, so it is tried again next time.
 function stop(){release();failedId='';}
 // Returns false when the clip cannot play, so the page shows its text instead.
 function play(id,clip,paused=false){
  if(!clip||failedId===id)return false;
  if(playingId!==id){
   release();playingId=id;
   const v=video=document.createElement('video');v.id='story-video';
   v.playsInline=true;v.preload='auto';v.setAttribute('playsinline','');v.setAttribute('aria-label',clip.label);
   const p=preferences.value;v.muted=p.musicMuted&&p.sfxMuted;
   v.addEventListener('ended',()=>{if(video===v)onEnd();});
   v.addEventListener('error',()=>{if(video!==v)return;failedId=id;release();onFail();});
   v.src=spriteAssetUrl(clip.asset);layer.prepend(v);layer.hidden=false;holdMusic(true);
   // Browsers can refuse sound without a recent click or key press; show the controls so the player can start it.
   if(!paused)start();else held=true;
   return true;
  }
  // Settings and hidden tabs pause the clip the way they pause the artwork clock.
  if(paused){if(!video.paused){video.pause();held=true;}}
  else if(held){held=false;start();}
  return true;
 }
 // id names the page whose clip is playing or failed, so the caller knows when to stop.
 return {play,stop,get playing(){return !!video;},get id(){return playingId||failedId;}};
}
