import {preferences} from './preferences.js';
import {keyLabel} from './input-bindings.js';
// The Controls card lists every key in plain words. It reads the current bindings each time it opens, so rebinds show up.
export function controlRows(keybinds,touch=false){
 const k=id=>keyLabel(keybinds[id]);
 if(touch)return [
  ['Moving',[['Left stick','Walk'],['Tap the water','Aim your cast']]],
  ['Doing things',[['Examine','Talk, examine or pick up what is right next to Eli'],['Use','Use the equipped item. With the rod out, it casts'],['Hold Use','Reel in a fish'],['Hotbar','Tap a slot to equip it']]],
  ['Menus',[['☰ Menu','Backpack, skills, index, quests, atlas and more']]]
 ];
 return [
  ['Moving',[[['up','left','down','right'].map(k).join(' '),'Walk'],[k('dash'),'Dash'],['Mouse','Aim']]],
  ['Doing things',[[k('inspect'),'Talk, examine or pick up what is right next to Eli'],['Left click',`Use the equipped item. With the rod out, it casts (or ${k('use')})`],[`Hold ${k('inspect')}`,'Reel in a fish (or hold left click)'],[`${k('slot1')}–${k('slot7')}`,'Equip a hotbar slot'],[k('fish'),'Cast or put the rod away'],[`${k('cancel')} / Esc`,'Cancel']]],
  ['Menus',[[k('backpack'),'Backpack'],[k('skills'),'Skills'],[k('codex'),'Creature index'],[k('quests'),'Quest log'],[k('map'),'World atlas'],[k('radio'),'Radio'],['Enter','Chat with friends'],['Ctrl S','Save'],[k('help'),'This list']]]
 ];
}
export function mountControlsHelp({isTouch=()=>false,onOpen=()=>{},onClose=()=>{}}={}){
 const dialog=document.createElement('dialog');dialog.id='controls-help';dialog.setAttribute('aria-labelledby','controls-help-title');
 dialog.innerHTML='<div class="controls-help-heading"><div><small>THE WILDS</small><h2 id="controls-help-title">Controls</h2></div><button id="close-controls-help">Close</button></div><div class="controls-help-body"></div><p class="controls-help-note">Change any key in Settings › Keybinds.</p>';
 document.body.append(dialog);
 const body=dialog.querySelector('.controls-help-body'),closeButton=dialog.querySelector('#close-controls-help');
 function draw(){
  const touch=isTouch();
  body.replaceChildren(...controlRows(preferences.value.keybinds,touch).map(([title,rows])=>{
   const section=document.createElement('section'),h=document.createElement('h3'),list=document.createElement('dl');h.textContent=title;
   for(const [key,text] of rows){const dt=document.createElement('dt'),kbd=document.createElement('kbd'),dd=document.createElement('dd');kbd.textContent=key;dt.append(kbd);dd.textContent=text;list.append(dt,dd);}
   section.append(h,list);return section;
  }));
  setText(closeButton,touch?'Close':`Close · ${keyLabel(preferences.value.keybinds.help)} / Esc`);
 }
 function setText(node,text){if(node.textContent!==text)node.textContent=text;}
 const show=()=>{if(dialog.open)return;draw();onOpen();dialog.showModal();};
 const close=()=>{if(dialog.open)dialog.close();};
 closeButton.onclick=close;
 dialog.addEventListener('close',onClose);
 dialog.addEventListener('click',e=>{if(e.target===dialog)close();});
 dialog.addEventListener('keydown',e=>{if(e.code===preferences.value.keybinds.help&&!e.repeat){e.preventDefault();e.stopPropagation();close();}});
 return {get open(){return dialog.open;},show,close,toggle(){dialog.open?close():show();}};
}
