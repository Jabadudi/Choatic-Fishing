import {parseYouTube,songFromFileName,formatTime,tracksOf,nextIndex,previousIndex,addTrack,removeTrack,RADIO_FILE_PATTERN,MAX_SONG_BYTES} from './radio.js';
import {RadioStore} from './radio-store.js';
import {drawRadioFront,drawRadioSmall,FRONT_SIZE,paintRadioCanvas} from './radio-art.js';
import {holdMusic} from './music.js';
const svg=(body,size=24)=>`<svg viewBox="0 0 24 24" width="${size}" height="${size}" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">${body}</svg>`;
const el=(tag,className,text)=>{const node=document.createElement(tag);if(className)node.className=className;if(text!==undefined)node.textContent=text;return node;};
const KIND_TEXT={file:'Saved on this device',youtube:'Needs internet'};
const songLabel=t=>t?(t.artist?`${t.title} · ${t.artist}`:t.title):'';
// YouTube songs play through YouTube's own player, loaded only once someone adds or plays a link.
let youtubeApi=null;
function loadYouTube(){
 if(globalThis.YT?.Player)return Promise.resolve(globalThis.YT);
 if(!youtubeApi)youtubeApi=new Promise((resolve,reject)=>{
  const previous=globalThis.onYouTubeIframeAPIReady;globalThis.onYouTubeIframeAPIReady=()=>{previous?.();resolve(globalThis.YT);};
  const script=document.createElement('script');script.src='https://www.youtube.com/iframe_api';script.async=true;
  script.onerror=()=>{youtubeApi=null;script.remove();reject(Error('YouTube could not load. Check your internet connection.'));};
  document.head.append(script);
 });
 return youtubeApi;
}
async function youtubeTitle(url){
 try{const response=await fetch(`https://www.youtube.com/oembed?format=json&url=${encodeURIComponent(url)}`);if(!response.ok)return null;const data=await response.json();return {title:String(data.title||'').slice(0,120),artist:String(data.author_name||'').replace(/\s*-\s*Topic$/,'').slice(0,120)};}catch{return null;}
}
export function mountRadio({onOpen,onClose,store=new RadioStore()}){
 const dialog=document.createElement('dialog');dialog.id='radio-sheet';dialog.setAttribute('aria-labelledby','radio-title');
 dialog.innerHTML=`<div class="backpack-frame"><div class="backpack-heading"><span class="backpack-emblem"><canvas class="radio-icon" width="24" height="18"></canvas></span><h2 id="radio-title">Portable Radio</h2><p class="backpack-capacity radio-count"></p><button class="backpack-close" aria-label="Close the radio">${svg('<path d="M6 6l12 12M18 6L6 18" stroke-width="2.4"/>',26)}</button></div>
<div class="radio-tabs" role="tablist" aria-label="Music sources"><button type="button" role="tab" class="radio-tab" data-kind="file" aria-selected="true">Your songs</button><button type="button" role="tab" class="radio-tab" data-kind="youtube" aria-selected="false">YouTube links</button></div>
<div class="radio-body"><section class="radio-deck" aria-label="Player"><div class="radio-boombox"><canvas class="radio-front" width="${FRONT_SIZE.width}" height="${FRONT_SIZE.height}"></canvas><div class="radio-lcd" aria-live="polite"><span class="radio-lcd-title"><span></span></span><small class="radio-lcd-time"></small></div></div>
<div class="radio-seek"><span class="radio-now">0:00</span><input type="range" class="radio-seek-bar" min="0" max="1000" value="0" aria-label="Song position"><span class="radio-length">0:00</span></div>
<div class="radio-transport"><button type="button" class="radio-toggle radio-shuffle" aria-pressed="false" title="Shuffle" aria-label="Shuffle">⤮</button><button type="button" class="trade-action radio-prev" aria-label="Previous song">⏮</button><button type="button" class="trade-action radio-play" aria-label="Play">▶</button><button type="button" class="trade-action radio-next" aria-label="Next song">⏭</button><button type="button" class="radio-toggle radio-repeat" aria-pressed="true" title="Repeat the playlist" aria-label="Repeat the playlist">↻</button></div>
<label class="radio-volume"><span>Volume</span><input type="range" class="radio-volume-bar" min="0" max="100" value="70" aria-label="Radio volume"><b class="radio-volume-value">70</b></label></section>
<section class="radio-list" aria-label="Playlist"><div class="radio-list-head"><h3 class="trade-column-title">Playlist</h3><small class="radio-kind-note"></small></div>
<form class="radio-paste" hidden><input type="url" class="radio-url" placeholder="Paste a YouTube link" aria-label="YouTube link" autocomplete="off"><button type="submit" class="trade-action">Add link</button></form>
<div class="radio-video-slot" hidden><div class="radio-video-frame"></div><p>YouTube songs play in YouTube’s own small player. It stays in the corner of the screen while you explore. Ads may play first, as on YouTube.</p></div>
<ol class="radio-songs"></ol>
<div class="radio-adds"><label class="trade-action radio-add">Add songs<small>MP3, M4A, OGG or WAV from your device</small><input type="file" class="radio-files" accept="audio/*,.mp3,.m4a,.aac,.ogg,.oga,.opus,.wav,.webm,.flac" multiple></label><button type="button" class="radio-clear">Clear these songs</button></div></section></div>
<p class="trade-note radio-note" aria-live="polite"></p></div>`;
 document.body.append(dialog);
 const backdrop=el('div','radio-backdrop');backdrop.hidden=true;document.body.append(backdrop);
 // The YouTube player sits outside the sheet so it keeps playing, visibly, after the sheet closes.
 const video=el('div','radio-video');video.hidden=true;const videoHost=el('div');video.append(videoHost);document.body.append(video);
 const chip=el('div','radio-chip');chip.hidden=true;chip.setAttribute('role','group');chip.setAttribute('aria-label','Radio');
 chip.innerHTML='<button type="button" class="radio-chip-open" aria-label="Open the radio"><canvas width="24" height="18"></canvas><span class="radio-chip-text"><b></b><small></small></span></button><button type="button" class="radio-chip-play" aria-label="Play">▶</button><button type="button" class="radio-chip-next" aria-label="Next song">⏭</button>';
 const $=selector=>dialog.querySelector(selector),note=$('.radio-note'),songs=$('.radio-songs');
 paintRadioCanvas($('.radio-front'),drawRadioFront);paintRadioCanvas($('.radio-icon'),drawRadioSmall,0);
 const audio=new Audio();audio.preload='metadata';
 let radio={tracks:[],index:0,shuffle:false,repeat:true,volume:.7},kind='file',playing=false,loaded=null,objectUrl=null,yt=null,ytReady=null,lastKey='',clearArmed=0,frame=0,frameAt=0,chipFrame=-1;
 const ready=store.load().then(saved=>{radio=saved;lastKey='';refresh();});
 const current=()=>radio.tracks[radio.index]||null;
 const persist=()=>store.save(radio);
 const setNote=text=>{note.textContent=text;};
 function setPlaying(on){playing=on;holdMusic(on,'radio');lastKey='';refresh();}
 function stopAll(){audio.pause();try{yt?.pauseVideo();}catch{}}
 async function youtubePlayer(){
  if(ytReady)return ytReady;
  ytReady=loadYouTube().then(YT=>new Promise(resolve=>{
   yt=new YT.Player(videoHost,{width:'100%',height:'100%',playerVars:{playsinline:1,rel:0},events:{
    onReady:()=>{yt.setVolume(Math.round(radio.volume*100));resolve(yt);},
    onStateChange:event=>{
     if(current()?.kind!=='youtube')return;
     if(event.data===YT.PlayerState.PLAYING){if(!playing)setPlaying(true);const data=yt.getVideoData?.(),track=current();if(data?.title&&track&&track.title==='YouTube song'){track.title=data.title.slice(0,120);track.artist=(data.author||'').slice(0,120);persist();lastKey='';}}
     else if(event.data===YT.PlayerState.PAUSED&&playing)setPlaying(false);
     else if(event.data===YT.PlayerState.ENDED){const list=yt.getPlaylist?.();if(list&&yt.getPlaylistIndex()<list.length-1)return;advance();}
    },
    onError:()=>{setNote(`YouTube would not play “${current()?.title||'this song'}”. Some songs can only be played on YouTube itself. Skipping it.`);advance();}
   }});
  })).catch(error=>{ytReady=null;throw error;});
  return ytReady;
 }
 async function play(index=radio.index){
  const track=radio.tracks[index];if(!track)return;
  if(radio.index!==index){radio.index=index;persist();}
  const fresh=loaded!==track.id;
  try{
   if(track.kind==='file'){
    try{yt?.stopVideo();}catch{}
    if(fresh){const blob=await store.getSong(track.id);if(!blob){setNote(`“${track.title}” is no longer saved on this device. Remove it and add the file again.`);setPlaying(false);return;}
     if(objectUrl)URL.revokeObjectURL(objectUrl);objectUrl=URL.createObjectURL(blob);audio.src=objectUrl;loaded=track.id;}
    audio.volume=radio.volume;await audio.play();setPlaying(true);
   }else{
    audio.pause();setNote('Loading YouTube…');const player=await youtubePlayer();
    if(fresh){if(track.videoId)player.loadVideoById(track.videoId);else player.loadPlaylist({list:track.listId,listType:'playlist',index:0});loaded=track.id;}
    else player.playVideo();
    setNote(`Playing from YouTube: ${songLabel(track)}`);
   }
  }catch(error){setPlaying(false);setNote(error?.name==='NotAllowedError'?'Press play to start the radio.':error?.message||'This song could not be played.');}
  lastKey='';refresh();
 }
 function pause(){stopAll();setPlaying(false);}
 function toggle(){if(playing)pause();else if(current())play();else setNote('Add a song first.');}
 function advance(){const next=nextIndex(radio);if(next===null){pause();setNote('The playlist has ended.');return;}play(next);}
 function back(){if(current()?.kind==='file'&&audio.currentTime>3){audio.currentTime=0;return;}const previous=previousIndex(radio);if(previous!==null)play(previous);}
 audio.addEventListener('ended',advance);
 audio.addEventListener('loadedmetadata',()=>{const track=current();if(track&&track.kind==='file'&&track.id===loaded&&Number.isFinite(audio.duration)&&track.duration!==audio.duration){track.duration=audio.duration;persist();lastKey='';}});
 audio.addEventListener('error',()=>{if(current()?.kind==='file'&&loaded){setNote(`“${current().title}” could not be played. The file may be damaged or in a format this browser cannot read.`);setPlaying(false);}});
 audio.addEventListener('pause',()=>{if(playing&&current()?.kind==='file'&&!audio.ended)setPlaying(false);});
 function position(){
  const track=current();if(!track)return {now:0,length:0};
  if(track.kind==='file')return {now:track.id===loaded?audio.currentTime:0,length:Number.isFinite(audio.duration)&&track.id===loaded?audio.duration:track.duration||0};
  try{return {now:yt?.getCurrentTime?.()||0,length:yt?.getDuration?.()||0};}catch{return {now:0,length:0};}
 }
 async function addFiles(files){
  await ready;let added=0;const skipped=[];
  for(const file of files){
   if(!(file.type.startsWith('audio/')||RADIO_FILE_PATTERN.test(file.name))){skipped.push(`${file.name} is not a song file`);continue;}
   if(file.size>MAX_SONG_BYTES){skipped.push(`${file.name} is over ${MAX_SONG_BYTES/1024/1024} MB`);continue;}
   const track=addTrack(radio,{kind:'file',...songFromFileName(file.name)});
   if(!await store.putSong(track.id,file))skipped.push('songs will only stay until you close the game, because this browser is not saving data');
   added++;
  }
  await persist();lastKey='';refresh();
  setNote([added?`${added} ${added===1?'song':'songs'} added to the radio.`:'',...new Set(skipped)].filter(Boolean).join(' · ')||'No songs were added.');
 }
 async function addLink(text){
  await ready;const link=parseYouTube(text);
  if(!link){setNote('That doesn’t look like a YouTube link. Copy the link from the Share button on a YouTube video or playlist.');return false;}
  const track=addTrack(radio,{kind:'youtube',title:link.videoId?'YouTube song':'YouTube playlist',artist:'',videoId:link.videoId,listId:link.videoId?null:link.listId});
  await persist();lastKey='';refresh();setNote(`Added “${track.title}”.`);
  const info=await youtubeTitle(text.trim());if(info?.title){track.title=info.title;track.artist=info.artist;persist();lastKey='';refresh();setNote(`Added “${songLabel(track)}”.`);}
  return true;
 }
 async function remove(id){
  const wasCurrent=current()?.id===id,gone=removeTrack(radio,id);if(!gone)return;
  if(gone.kind==='file')store.deleteSong(id);
  if(wasCurrent){stopAll();loaded=null;setPlaying(false);}
  await persist();lastKey='';refresh();setNote(`Removed “${gone.title}”.`);
 }
 async function clearKind(){
  const ids=tracksOf(radio,kind).map(t=>t.id);for(const id of ids){const gone=removeTrack(radio,id);if(gone?.kind==='file')store.deleteSong(id);}
  if(ids.includes(loaded)){loaded=null;stopAll();setPlaying(false);}
  await persist();lastKey='';refresh();setNote(ids.length?`Cleared ${ids.length} ${ids.length===1?'song':'songs'}.`:'Nothing to clear.');
 }
 function row(track,index){
  const item=el('li','radio-song');if(index===radio.index)item.classList.add('now');
  const pick=el('button','radio-song-play');pick.type='button';pick.setAttribute('aria-label',`Play ${songLabel(track)}`);
  pick.append(el('span','radio-song-mark',index===radio.index?(playing?'▶':'❚❚'):String(tracksOf(radio,track.kind).indexOf(track)+1)));
  const text=el('span','radio-song-text');text.append(el('strong','',track.title),el('small','',track.artist||(track.kind==='youtube'?(track.listId?'Playlist':'YouTube'):'Your file')));pick.append(text,el('span','radio-song-time',track.duration?formatTime(track.duration):''));
  pick.onclick=()=>index===radio.index&&playing?pause():play(index);
  const drop=el('button','radio-song-remove','✕');drop.type='button';drop.setAttribute('aria-label',`Remove ${track.title}`);drop.onclick=()=>remove(track.id);
  item.append(pick,drop);return item;
 }
 function refresh(){
  const track=current(),{now,length}=position(),key=JSON.stringify([kind,playing,radio.index,radio.shuffle,radio.repeat,radio.tracks.map(t=>[t.id,t.title,t.artist,t.duration])]);
  if(key!==lastKey){
   lastKey=key;
   for(const tab of dialog.querySelectorAll('.radio-tab'))tab.setAttribute('aria-selected',String(tab.dataset.kind===kind));
   $('.radio-count').textContent=`${radio.tracks.length} ${radio.tracks.length===1?'song':'songs'}`;
   $('.radio-kind-note').textContent=KIND_TEXT[kind];$('.radio-paste').hidden=kind!=='youtube';$('.radio-video-slot').hidden=kind!=='youtube';$('.radio-adds').hidden=false;$('.radio-add').hidden=kind!=='file';
   const list=radio.tracks.flatMap((t,i)=>t.kind===kind?[row(t,i)]:[]);
   songs.replaceChildren(...(list.length?list:[el('li','trade-empty',kind==='file'?'Add songs you have on this device. They stay saved here for next time.':'Paste a link to a song or playlist on YouTube.')]));
   $('.radio-clear').hidden=!list.length;$('.radio-clear').textContent='Clear these songs';clearArmed=0;
   $('.radio-play').textContent=playing?'❚❚':'▶';$('.radio-play').setAttribute('aria-label',playing?'Pause':'Play');
   $('.radio-shuffle').setAttribute('aria-pressed',String(radio.shuffle));$('.radio-repeat').setAttribute('aria-pressed',String(radio.repeat));
   const title=$('.radio-lcd-title span');title.textContent=track?songLabel(track).toUpperCase():'READY';
   $('.radio-lcd-title').classList.toggle('scrolling',!!track&&playing&&title.textContent.length>14);
   for(const button of ['.radio-play','.radio-prev','.radio-next'])$(button).disabled=!track;
   $('.radio-volume-bar').value=String(Math.round(radio.volume*100));$('.radio-volume-value').textContent=String(Math.round(radio.volume*100));
   chip.querySelector('b').textContent=track?track.title:'RADIO';chip.querySelector('small').textContent=track?(track.artist||(track.kind==='youtube'?'YouTube':'Your file')):'Play your songs';chip.classList.toggle('empty',!track);
   chip.querySelector('.radio-chip-play').textContent=playing?'❚❚':'▶';chip.querySelector('.radio-chip-play').setAttribute('aria-label',playing?'Pause':'Play');
   dialog.classList.toggle('playing',playing);
  }
  $('.radio-now').textContent=formatTime(now);$('.radio-length').textContent=formatTime(length);
  if(document.activeElement!==$('.radio-seek-bar'))$('.radio-seek-bar').value=String(length?Math.round(now/length*1000):0);
  $('.radio-lcd-time').textContent=track?`${playing?'▶':'❚❚'} ${formatTime(now)}`:'';
 }
 for(const tab of dialog.querySelectorAll('.radio-tab'))tab.onclick=()=>{kind=tab.dataset.kind;lastKey='';refresh();if(kind==='youtube')youtubePlayer().catch(error=>setNote(error.message));};
 $('.radio-play').onclick=toggle;$('.radio-next').onclick=advance;$('.radio-prev').onclick=back;
 $('.radio-shuffle').onclick=()=>{radio.shuffle=!radio.shuffle;persist();lastKey='';refresh();};
 $('.radio-repeat').onclick=()=>{radio.repeat=!radio.repeat;persist();lastKey='';refresh();};
 $('.radio-volume-bar').oninput=event=>{radio.volume=Number(event.target.value)/100;audio.volume=radio.volume;try{yt?.setVolume(Math.round(radio.volume*100));}catch{}$('.radio-volume-value').textContent=event.target.value;};
 $('.radio-volume-bar').onchange=persist;
 $('.radio-seek-bar').onchange=event=>{const {length}=position(),at=Number(event.target.value)/1000*length;if(!length)return;if(current()?.kind==='file')audio.currentTime=at;else try{yt?.seekTo(at,true);}catch{}};
 $('.radio-files').onchange=event=>{const files=[...event.target.files];event.target.value='';if(files.length)addFiles(files);};
 $('.radio-paste').onsubmit=async event=>{event.preventDefault();const input=$('.radio-url');if(await addLink(input.value))input.value='';};
 // Clearing asks for a second press instead of a browser confirm.
 $('.radio-clear').onclick=()=>{if(performance.now()-clearArmed<4000){clearKind();return;}clearArmed=performance.now();$('.radio-clear').textContent='Press again to clear';};
 chip.querySelector('.radio-chip-open').onclick=()=>show();chip.querySelector('.radio-chip-play').onclick=toggle;chip.querySelector('.radio-chip-next').onclick=advance;
 function show(){if(dialog.open)return;onOpen();lastKey='';refresh();setNote('Eli turns the dial. There is no signal out here, but the old radio plays whatever he loads into it.');backdrop.hidden=false;dialog.show();dialog.querySelector('.backpack-close').focus();}
 function close(){if(!dialog.open)return;dialog.close();}
 $('.backpack-close').onclick=close;backdrop.onclick=close;
 dialog.addEventListener('close',()=>{backdrop.hidden=true;onClose();});
 dialog.addEventListener('keydown',event=>{if(event.key==='Escape'){event.preventDefault();close();}});
 // The video window follows the sheet's YouTube tab while it is open, and the corner of the screen while exploring.
 function placeVideo(exploring){
  const show=current()?.kind==='youtube'&&!!yt&&(dialog.open||(exploring&&playing));
  video.hidden=!show;if(!show)return;
  const slot=$('.radio-video-slot');
  if(dialog.open&&!slot.hidden){const r=slot.querySelector('.radio-video-frame').getBoundingClientRect();video.className='radio-video in-sheet';Object.assign(video.style,{left:`${r.left}px`,top:`${r.top}px`,width:`${r.width}px`,height:`${r.height}px`});}
  // On the songs tab the player tucks behind the sheet rather than disappearing, so the song keeps going.
  else if(dialog.open){video.className='radio-video tucked';video.removeAttribute('style');}
  else{video.className='radio-video';video.removeAttribute('style');}
 }
 return {
  get open(){return dialog.open;},get playing(){return playing;},
  show,close,toggle:()=>dialog.open?close():show(),
  update(exploring){
   chip.hidden=!exploring||dialog.open;
   placeVideo(exploring);
   if(dialog.open)refresh();
   const t=performance.now();if(t-frameAt>180){frameAt=t;frame=(frame+1)%4;}
   const shown=playing?frame:0;if(!chip.hidden&&shown!==chipFrame){chipFrame=shown;paintRadioCanvas(chip.querySelector('canvas'),drawRadioSmall,shown);}
  },
  mountChip(parent){parent.append(chip);}
 };
}
