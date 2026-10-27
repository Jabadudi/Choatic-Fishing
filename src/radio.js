// The Portable Radio plays songs the player brings: audio files from their device, or YouTube links.
// Songs are never bundled with the game. This module is the playlist logic; radio-ui.js plays it.
export const RADIO_AUDIO_TYPES=Object.freeze(['audio/mpeg','audio/mp4','audio/aac','audio/ogg','audio/wav','audio/webm','audio/flac','audio/x-m4a']);
export const RADIO_FILE_PATTERN=/\.(mp3|m4a|aac|ogg|oga|opus|wav|webm|flac)$/i;
export const MAX_SONG_BYTES=60*1024*1024;
const ID=/^[\w-]{11}$/,LIST=/^[\w-]{10,64}$/;
// Accepts youtu.be, watch, shorts, embed, live and music.youtube.com links, with or without a playlist.
export function parseYouTube(text){
 let url;try{url=new URL(String(text).trim());}catch{return null;}
 const host=url.hostname.replace(/^(www|m|music)\./,'');if(!['youtube.com','youtu.be','youtube-nocookie.com'].includes(host))return null;
 let videoId=null;const parts=url.pathname.split('/').filter(Boolean);
 if(host==='youtu.be')videoId=parts[0]||null;
 else if(parts[0]==='watch')videoId=url.searchParams.get('v');
 else if(['shorts','embed','live','v'].includes(parts[0]))videoId=parts[1]||null;
 const listId=url.searchParams.get('list');
 const out={videoId:videoId&&ID.test(videoId)?videoId:null,listId:listId&&LIST.test(listId)?listId:null};
 return out.videoId||out.listId?out:null;
}
// "Adele - Set Fire to the Rain.mp3" becomes artist Adele, title Set Fire to the Rain.
export function songFromFileName(name){
 const base=String(name).replace(/\.[^.]+$/,'').replace(/_/g,' ').replace(/\s+/g,' ').trim()||'Untitled song';
 const split=base.match(/^(.+?)\s+[-–—]\s+(.+)$/);
 return split?{artist:split[1].trim(),title:split[2].trim()}:{artist:'',title:base};
}
export const formatTime=seconds=>{const s=Math.max(0,Math.floor(Number(seconds)||0));return `${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`;};
export const createRadio=()=>({tracks:[],index:0,shuffle:false,repeat:true,volume:.7});
const validTrack=t=>t&&typeof t.id==='string'&&typeof t.title==='string'&&(t.kind==='file'||(t.kind==='youtube'&&(ID.test(t.videoId??'')||LIST.test(t.listId??''))));
// Saved radio state comes from browser storage, so anything malformed falls back to an empty radio.
export function normalizeRadio(data){
 const out=createRadio();if(!data||typeof data!=='object')return out;
 out.tracks=Array.isArray(data.tracks)?data.tracks.filter(validTrack).map(t=>({id:t.id,kind:t.kind,title:t.title.slice(0,120),artist:typeof t.artist==='string'?t.artist.slice(0,120):'',...(t.kind==='youtube'?{videoId:t.videoId??null,listId:t.listId??null}:{}),duration:Number.isFinite(t.duration)?t.duration:null})):[];
 out.index=Number.isInteger(data.index)&&data.index>=0&&data.index<out.tracks.length?data.index:0;
 out.shuffle=data.shuffle===true;out.repeat=data.repeat!==false;
 if(typeof data.volume==='number'&&Number.isFinite(data.volume))out.volume=Math.max(0,Math.min(1,data.volume));
 return out;
}
export const tracksOf=(radio,kind)=>radio.tracks.filter(t=>t.kind===kind);
// The song after the current one, or null when the playlist ends without repeat.
export function nextIndex(radio,random=Math.random){
 const n=radio.tracks.length;if(!n)return null;
 if(radio.shuffle&&n>1){const pick=Math.floor(random()*(n-1));return pick>=radio.index?pick+1:pick;}
 if(radio.index+1<n)return radio.index+1;
 return radio.repeat?0:null;
}
export const previousIndex=radio=>radio.tracks.length?(radio.index-1+radio.tracks.length)%radio.tracks.length:null;
let counter=0;
export const trackId=()=>`song-${Date.now().toString(36)}-${(counter++).toString(36)}`;
export function addTrack(radio,track){radio.tracks.push({duration:null,artist:'',...track,id:track.id||trackId()});return radio.tracks.at(-1);}
export function removeTrack(radio,id){
 const at=radio.tracks.findIndex(t=>t.id===id);if(at<0)return null;
 const [gone]=radio.tracks.splice(at,1);
 if(at<radio.index)radio.index--;
 if(radio.index>=radio.tracks.length)radio.index=0;
 return gone;
}
