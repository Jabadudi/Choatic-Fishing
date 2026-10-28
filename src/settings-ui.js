import {BINDING_ACTIONS,DEFAULT_BINDINGS,rebind,validBinding,keyLabel} from './input-bindings.js';
import {preferences,DIALOGUE_THEMES,UI_SCALE_MIN,uiScaleLimit} from './preferences.js';
import {dialogueMarkup,setDialogueText,drawDialoguePortrait} from './dialogue-view.js';
import {playSfx} from './sfx.js';
import {titleArtReady} from './title-art.js';
import {CURSOR_STYLES,standInUrl,applyCursor,cursorValue} from './cursors.js';
const swatches={hearthwood:['#f3ead2','#886448','#789655'],'mossy-stone':['#e6e8d9','#606957','#9aaf76'],'field-journal':['#fbfcf6','#b7c5d2','#e4b0b0'],'lantern-night':['#2d293a','#575268','#d8a653'],'meadow-banner':['#f8f4e8','#93ae69','#7778a7'],'quiet-hud':['#263321','#9cba70','#c6dc94']};
// The HUD stylesheet multiplies its own sizes by this variable. The saved size is kept; a screen too small for it shows the largest that fits.
const uiScaleCap=()=>uiScaleLimit(innerWidth,innerHeight);
export const applyUiScale=scale=>document.documentElement.style.setProperty('--ui-scale',String(Math.min(scale,uiScaleCap())));
export function mountSettings({onOpen=()=>{},onClose=()=>{}}={}){
 const button=document.createElement('button');button.id='open-settings';button.textContent='⚙ Settings';button.setAttribute('aria-label','Open settings');button.setAttribute('aria-haspopup','dialog');document.body.append(button);
 const dialog=document.createElement('dialog');dialog.id='settings-menu';dialog.setAttribute('aria-labelledby','settings-title');
 dialog.innerHTML=`<div class="settings-heading"><div><small>THE WILDS</small><h2 id="settings-title">Settings</h2></div><button id="close-settings">Close</button></div><div class="settings-tabs" role="tablist" aria-label="Settings categories"><button id="settings-audio-tab" role="tab" aria-selected="true" aria-controls="settings-audio">Audio</button><button id="settings-dialogue-tab" role="tab" aria-selected="false" aria-controls="settings-dialogue">Dialogue UI</button><button id="settings-cursor-tab" role="tab" aria-selected="false" aria-controls="settings-cursor">Cursor</button><button id="settings-keybinds-tab" role="tab" aria-selected="false" aria-controls="settings-keybinds">Keybinds</button><button id="settings-display-tab" role="tab" aria-selected="false" aria-controls="settings-display">UI size</button></div><section id="settings-audio" role="tabpanel" aria-labelledby="settings-audio-tab">${['music','sfx'].map(channel=>`<div class="settings-volume-row"><label for="settings-${channel}-volume">${channel==='music'?'Music':'Sound effects'}<output id="settings-${channel}-value"></output></label><input id="settings-${channel}-volume" type="range" min="0" max="100" step="1" aria-label="${channel==='music'?'Music':'Sound effects'} volume"><button id="settings-${channel}-mute" aria-pressed="false"></button></div>`).join('')}<button id="settings-sfx-test">Test sound effect</button><p class="settings-note">Music and effects have independent volume and mute controls.</p></section><section id="settings-dialogue" role="tabpanel" aria-labelledby="settings-dialogue-tab" hidden><div class="theme-options" aria-label="Dialogue box styles">${DIALOGUE_THEMES.map(t=>`<button data-theme="${t.id}" aria-pressed="false"><span class="theme-swatch" aria-hidden="true">${swatches[t.id].map(c=>`<i style="--swatch:${c}"></i>`).join('')}</span><strong>${t.name}</strong><span>${t.description}</span></button>`).join('')}</div><div class="settings-preview" aria-label="Live dialogue preview">${dialogueMarkup('settings-preview')}</div><p class="settings-note">Styles apply immediately, including to an open conversation. Your choice is remembered for this browser.</p></section><section id="settings-cursor" role="tabpanel" aria-labelledby="settings-cursor-tab" hidden><div class="cursor-options" aria-label="Cursor styles">${CURSOR_STYLES.map(c=>`<button data-cursor-style="${c.id}" aria-pressed="false" style="--game-cursor:${(cursorValue(c.id)||'auto').replace(/"/g,'&quot;')}"><span class="cursor-icon" aria-hidden="true">${c.standIn?`<img src="${c.art||standInUrl(c)}" alt="" width="32" height="32">`:'<i></i>'}</span><strong>${c.name}</strong><span>${c.description}</span></button>`).join('')}</div><p class="settings-note">Hover a style to try it. Your choice applies everywhere a mouse is used and is remembered for this browser.</p></section><section id="settings-keybinds" role="tabpanel" aria-labelledby="settings-keybinds-tab" hidden><p class="settings-note">Select an action, then press a key. Assigning an occupied key swaps the two actions. Escape cancels rebinding; Escape and F10 remain available to close menus and open Settings. Dialogue keeps Space / Enter / arrow navigation.</p><div class="keybind-list">${BINDING_ACTIONS.map(([id,label])=>`<label>${label}<button data-binding="${id}" aria-label="Change ${label} key"></button></label>`).join('')}</div><button id="settings-reset-keys">Restore default keys</button><p id="keybind-status" role="status" class="settings-note"></p></section><section id="settings-display" role="tabpanel" aria-labelledby="settings-display-tab" hidden><div class="settings-volume-row"><label for="settings-ui-scale">HUD and controls size<output id="settings-ui-scale-value"></output></label><input id="settings-ui-scale" type="range" min="${UI_SCALE_MIN*100}" max="150" step="5" aria-label="HUD and controls size"><div class="settings-scale-steps"><button id="settings-ui-smaller" aria-label="Smaller">A−</button><button id="settings-ui-reset">Reset to 100%</button><button id="settings-ui-bigger" aria-label="Bigger">A+</button></div></div><p class="settings-note" id="settings-ui-scale-cap"></p><p class="settings-note">Scales the health bar, minimap, hotbar, quest tracker, menu icons and the touch joystick and buttons. Changes apply as you drag and are remembered for this browser.</p></section><p class="settings-note" id="settings-storage-message" role="status"></p>`;
 document.body.append(dialog);const q=id=>dialog.querySelector('#'+id);let previewPage=0,portraitFrame=0,capturing=null;
 const lines=['The big one is a Rimejaw. The little one with wings is a Flitlynx.','I would stay away from the Rimejaw if I were you.','They fought with us last night, alongside the Moonfang.'];
 let titleArtIn=false;titleArtReady.then(()=>{titleArtIn=true;renderPreview();});
 function renderPreview(){
  q('settings-preview-name').textContent='The girl';q('settings-preview-chapter').textContent='DIALOGUE PREVIEW';q('settings-preview-title').textContent='The creatures of Willowback';
  setDialogueText(q('settings-preview-text'),lines[previewPage]);q('settings-preview-page').textContent=`${previewPage+1} / ${lines.length}`;q('settings-preview-previous').disabled=previewPage===0;
  // Mara's portrait loads once the title art is in, ready for the first time settings open.
  if(titleArtIn||dialog.open)drawDialoguePortrait(q('settings-preview-portrait'),{id:'mara',name:'The girl'});
 }
 function refresh(p=preferences.value){
  document.documentElement.dataset.dialogueTheme=p.dialogueTheme;applyCursor(p.cursor);applyUiScale(p.uiScale);
  const cap=uiScaleCap(),shown=Math.min(p.uiScale,cap);q('settings-ui-scale').max=Math.round(cap*100);q('settings-ui-scale').value=Math.round(shown*100);q('settings-ui-scale-value').textContent=`${Math.round(shown*100)}%`;
  q('settings-ui-smaller').disabled=shown<=UI_SCALE_MIN;q('settings-ui-bigger').disabled=shown>=cap;
  q('settings-ui-scale-cap').textContent=cap<1.5?`This screen fits the HUD up to ${Math.round(cap*100)}%. ${p.uiScale>cap?`Your ${Math.round(p.uiScale*100)}% returns on a bigger screen.`:'A bigger or rotated screen allows more.'}`:'';
  dialog.querySelectorAll('[data-binding]').forEach(b=>b.textContent=capturing===b.dataset.binding?'Press a key…':keyLabel(p.keybinds[b.dataset.binding]));
  for(const c of ['music','sfx']){q(`settings-${c}-volume`).value=Math.round(p[c+'Volume']*100);q(`settings-${c}-value`).textContent=`${Math.round(p[c+'Volume']*100)}%`;q(`settings-${c}-mute`).textContent=p[c+'Muted']?'Unmute':'Mute';q(`settings-${c}-mute`).setAttribute('aria-pressed',String(p[c+'Muted']));}
  dialog.querySelectorAll('[data-theme]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.theme===p.dialogueTheme)));
  dialog.querySelectorAll('[data-cursor-style]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.cursorStyle===p.cursor)));
  q('settings-storage-message').textContent=preferences.error||'';renderPreview();
 }
 const tabs=['audio','dialogue','cursor','keybinds','display'];
 function selectTab(tab){for(const id of tabs){const selected=id===tab;q(`settings-${id}`).hidden=!selected;q(`settings-${id}-tab`).setAttribute('aria-selected',String(selected));}}
 for(const id of tabs)q(`settings-${id}-tab`).onclick=()=>selectTab(id);
 dialog.querySelector('.settings-tabs').addEventListener('keydown',e=>{if(!['ArrowLeft','ArrowRight'].includes(e.key))return;e.preventDefault();const index=tabs.findIndex(id=>q(`settings-${id}-tab`).getAttribute('aria-selected')==='true'),tab=tabs[(index+(e.key==='ArrowRight'?1:tabs.length-1))%tabs.length];selectTab(tab);q(`settings-${tab}-tab`).focus();});
 for(const c of ['music','sfx']){q(`settings-${c}-volume`).oninput=e=>preferences.set({[c+'Volume']:Number(e.target.value)/100});q(`settings-${c}-mute`).onclick=()=>preferences.set({[c+'Muted']:!preferences.value[c+'Muted']});}
 q('settings-ui-scale').oninput=e=>preferences.set({uiScale:Number(e.target.value)/100});q('settings-ui-reset').onclick=()=>preferences.set({uiScale:1});
 q('settings-ui-smaller').onclick=()=>preferences.set({uiScale:Math.min(preferences.value.uiScale,uiScaleCap())-.05});q('settings-ui-bigger').onclick=()=>preferences.set({uiScale:Math.min(preferences.value.uiScale,uiScaleCap())+.05});
 addEventListener('resize',()=>refresh());
 q('settings-sfx-test').onclick=()=>playSfx('catch');dialog.querySelectorAll('[data-theme]').forEach(b=>b.onclick=()=>preferences.set({dialogueTheme:b.dataset.theme}));
 dialog.querySelectorAll('[data-cursor-style]').forEach(b=>b.onclick=()=>preferences.set({cursor:b.dataset.cursorStyle}));
 q('settings-preview-next').onclick=()=>{previewPage=(previewPage+1)%lines.length;renderPreview();playSfx('page');};q('settings-preview-previous').onclick=()=>{previewPage=Math.max(0,previewPage-1);renderPreview();};
 q('settings-preview-close').onclick=q('settings-preview-end').onclick=()=>{previewPage=0;renderPreview();};
 function show(){if(dialog.open)return;onOpen();refresh();dialog.showModal();q('close-settings').focus();const paint=()=>{if(!dialog.open)return;drawDialoguePortrait(q('settings-preview-portrait'),{id:'mara',name:'The girl'});portraitFrame=requestAnimationFrame(paint);};paint();}
 dialog.querySelectorAll('[data-binding]').forEach(b=>b.onclick=()=>{capturing=b.dataset.binding;q('keybind-status').textContent='Press the new key, or Escape to cancel.';refresh();});
 q('settings-reset-keys').onclick=()=>{capturing=null;preferences.set({keybinds:DEFAULT_BINDINGS});q('keybind-status').textContent='Default keys restored.';};
 dialog.addEventListener('keydown',e=>{
  if(!capturing)return;e.preventDefault();e.stopImmediatePropagation();
  if(e.repeat)return;
  if(e.code==='Escape'){capturing=null;q('keybind-status').textContent='Rebinding cancelled.';refresh();return;}
  if(e.ctrlKey||e.metaKey||e.altKey||!validBinding(e.code)){q('keybind-status').textContent='Choose a letter, number, arrow, Shift, Space or punctuation key.';return;}
  const action=capturing;capturing=null;preferences.set({keybinds:rebind(preferences.value.keybinds,action,e.code)});q('keybind-status').textContent='Assigned '+keyLabel(e.code)+'.';
 },true);
 const close=()=>{capturing=null;dialog.close();};button.onclick=show;q('close-settings').onclick=close;
 dialog.addEventListener('close',()=>{capturing=null;cancelAnimationFrame(portraitFrame);onClose();});
 document.addEventListener('keydown',e=>{if(e.code==='F10'&&!e.repeat){e.preventDefault();e.stopPropagation();dialog.open?close():show();}},true);
 preferences.subscribe(refresh);refresh();return {show,close,get open(){return dialog.open;}};
}
