import {preferences,channelVolume} from './preferences.js';
const notes={ui:[520,.04],page:[440,.045],cast:[260,.12],bite:[880,.13],catch:[660,.2],dash:[180,.09],damage:[110,.12],shiny:[1320,.35]};
let context,bus;
preferences.subscribe(p=>{if(bus&&context)bus.gain.setValueAtTime(channelVolume(p,'sfx'),context.currentTime);});
export function playSfx(kind='ui'){
 const level=channelVolume(preferences.value,'sfx');if(level<=0)return false;
 try{
  const AudioEngine=globalThis.AudioContext||globalThis.webkitAudioContext;if(!AudioEngine)return false;
  if(!context){context=new AudioEngine();bus=context.createGain();bus.connect(context.destination);}
  if(context.state==='suspended')context.resume().catch(()=>{});
  bus.gain.setValueAtTime(level,context.currentTime);
  const [frequency,duration]=notes[kind]||notes.ui,start=context.currentTime,osc=context.createOscillator(),gain=context.createGain();
  osc.type=kind==='damage'?'triangle':'sine';osc.frequency.setValueAtTime(frequency,start);osc.frequency.exponentialRampToValueAtTime(['catch','shiny'].includes(kind)?frequency*1.5:frequency*.7,start+duration);
  gain.gain.setValueAtTime(.0001,start);gain.gain.exponentialRampToValueAtTime(.12,start+.007);gain.gain.exponentialRampToValueAtTime(.0001,start+duration);
  osc.connect(gain);gain.connect(bus);osc.onended=()=>{osc.disconnect();gain.disconnect();};osc.start(start);osc.stop(start+duration+.01);return true;
 }catch{return false;}
}
const previous=new WeakMap();
export function observeGameSounds(world){
 if(!world)return;const p=world.player,next={fishing:p.fishing.state,catches:p.catches.length,dash:p.dashRemaining,health:p.health,chimes:world.spawns?.chimes||0},old=previous.get(world);previous.set(world,next);if(!old)return;
 if(next.catches>old.catches)playSfx('catch');else if(next.fishing==='waiting'&&old.fishing==='idle')playSfx('cast');else if(next.fishing==='reeling'&&old.fishing!=='reeling')playSfx('bite');
 if(next.dash>0&&old.dash<=0)playSfx('dash');if(next.health<old.health)playSfx('damage');if(next.chimes>old.chimes)playSfx('shiny');
}
