// One soundtrack instance for the page lifetime; restarting a match never resets it.
const audio=new Audio(new URL('../assets/battle-music.mp3',import.meta.url));
audio.loop=true;
audio.preload='metadata';
audio.volume=.3;
const mute=document.getElementById('music-toggle');
const volume=document.getElementById('music-volume');
const status=document.getElementById('music-status');
let starting=false;
function refresh(){
 mute.textContent=audio.muted?'Unmute music':'Mute music';
 mute.setAttribute('aria-pressed',String(audio.muted));
 status.textContent=audio.muted||audio.volume===0?'Music muted':audio.paused?'Click or press a key for music':'Battle music';
}
async function start(){
 if(starting||!audio.paused||audio.muted||audio.volume===0)return;
 starting=true;
 try{await audio.play();refresh();}
 catch{status.textContent='Click to start music';}
 finally{starting=false;}
}
mute.addEventListener('click',()=>{audio.muted=!audio.muted;refresh();if(!audio.muted)start();});
volume.addEventListener('input',()=>{audio.volume=Number(volume.value)/100;if(audio.volume>0)audio.muted=false;refresh();start();});
audio.addEventListener('error',()=>{status.textContent='Music could not load';});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.music-hud'))start();});
document.addEventListener('keydown',event=>{if(!event.repeat&&!event.target.closest('.music-hud'))start();});
refresh();
