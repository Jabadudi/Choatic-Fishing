// One audio instance and a repeating playlist; match restarts never reset playback.
const tracks=[
 {file:'battle-music.mp3',title:'Battle Music — Paulyudin'},
 {file:'armageddon.mp3',title:'Armageddon — Alibi Music'}
];
let trackIndex=0;
const audio=new Audio(new URL('../assets/'+tracks[trackIndex].file,import.meta.url));
audio.loop=false;
audio.preload='metadata';
audio.volume=.3;
const mute=document.getElementById('music-toggle');
const volume=document.getElementById('music-volume');
const status=document.getElementById('music-status');
let starting=false;
function refresh(){
 mute.textContent=audio.muted?'Unmute music':'Mute music';
 mute.setAttribute('aria-pressed',String(audio.muted));
 status.textContent=audio.muted||audio.volume===0?'Music muted':audio.paused?'Click or press a key for music':tracks[trackIndex].title;
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
audio.addEventListener('ended',()=>{
 trackIndex=(trackIndex+1)%tracks.length;
 audio.src=new URL('../assets/'+tracks[trackIndex].file,import.meta.url).href;
 refresh();start();
});
document.addEventListener('pointerdown',event=>{if(!event.target.closest('.music-hud'))start();});
document.addEventListener('keydown',event=>{if(!event.repeat&&!event.target.closest('.music-hud'))start();});
refresh();
