// Full screen and landscape play. Browsers differ a lot here, so everything is feature-detected:
// Android Chrome can enter full screen and lock landscape; iPhone Safari can do neither for a page,
// so it gets a rotate prompt and an Add to Home Screen tip instead.
export function screenSupport({doc=globalThis.document,nav=globalThis.navigator,win=globalThis}={}){
 const root=doc?.documentElement,ua=nav?.userAgent||'';
 const ios=/iPhone|iPod|iPad/.test(ua)||(/Macintosh/.test(ua)&&(nav?.maxTouchPoints||0)>1);
 const standalone=!!(nav?.standalone||win?.matchMedia?.('(display-mode: fullscreen), (display-mode: standalone)').matches);
 const fullscreen=!!(root&&(root.requestFullscreen||root.webkitRequestFullscreen)&&(doc.fullscreenEnabled??doc.webkitFullscreenEnabled));
 return {ios,standalone,fullscreen,orientationLock:typeof win?.screen?.orientation?.lock==='function'};
}
export const isFullscreen=(doc=globalThis.document)=>!!(doc.fullscreenElement||doc.webkitFullscreenElement);
// Locking only works once the page is full screen, and rejects on browsers that ignore it (iOS, desktop).
export async function enterLandscape({doc=globalThis.document,win=globalThis,landscape=true}={}){
 const root=doc.documentElement;
 if(!isFullscreen(doc)){
  const request=root.requestFullscreen||root.webkitRequestFullscreen;
  if(!request)return {fullscreen:false,locked:false};
  try{await request.call(root,{navigationUI:'hide'});}catch{return {fullscreen:false,locked:false};}
 }
 if(!landscape)return {fullscreen:true,locked:false};
 try{await win.screen.orientation.lock('landscape');return {fullscreen:true,locked:true};}catch{return {fullscreen:true,locked:false};}
}
export async function leaveFullscreen({doc=globalThis.document,win=globalThis}={}){
 try{win.screen?.orientation?.unlock?.();}catch{}
 const exit=doc.exitFullscreen||doc.webkitExitFullscreen;
 if(isFullscreen(doc)&&exit)try{await exit.call(doc);}catch{}
}
const PORTRAIT_OK='chaotic-fishing-portrait-ok';
export function mountScreenControls({onChange=()=>{}}={}){
 const support=screenSupport(),body=document.body;
 body.classList.toggle('ios',support.ios);body.classList.toggle('standalone',support.standalone);
 try{body.classList.toggle('portrait-ok',sessionStorage.getItem(PORTRAIT_OK)==='1');}catch{}
 const button=document.createElement('button');button.id='toggle-fullscreen';button.type='button';
 // An installed home-screen app already has no browser bars, so the button would do nothing there.
 button.hidden=support.standalone||(!support.fullscreen&&!support.ios);body.classList.toggle('has-fs-button',!button.hidden);
 const prompt=document.createElement('section');prompt.id='rotate-prompt';prompt.setAttribute('role','dialog');prompt.setAttribute('aria-labelledby','rotate-title');
 prompt.innerHTML=`<div class="rotate-card"><div class="rotate-phone" aria-hidden="true"><i></i></div><h2 id="rotate-title">Turn your phone sideways</h2><p class="rotate-copy">Chaotic Fishing plays best in landscape.</p>${support.fullscreen?'<button id="rotate-fullscreen" type="button">Play full screen</button>':''}<p class="rotate-ios"${support.ios&&!support.standalone?'':' hidden'}>Turn off <b>Portrait Orientation Lock</b> in Control Center if the game doesn’t turn. For full screen, tap <b>Share</b> then <b>Add to Home Screen</b> and play from the new icon.</p><button id="rotate-dismiss" type="button" class="rotate-secondary">Keep playing upright</button></div>`;
 const tip=document.createElement('dialog');tip.id='install-tip';
 tip.innerHTML=`<h2>Full screen on iPhone</h2><p>iPhone Safari doesn’t let web games go full screen. Add the game to your home screen instead:</p><ol><li>Tap <b>Share</b> in Safari’s toolbar.</li><li>Choose <b>Add to Home Screen</b>.</li><li>Open Chaotic Fishing from the new icon. It plays without Safari’s bars, and your saves stay on this phone.</li></ol><p>Turn the phone sideways for landscape. If it doesn’t turn, switch off Portrait Orientation Lock in Control Center.</p><button id="close-install-tip" type="button">Got it</button>`;
 body.append(button,prompt,tip);
 const label=()=>{const on=isFullscreen();button.textContent=on?'⤡':'⛶';button.setAttribute('aria-label',on?'Exit full screen':'Full screen');button.title=on?'Exit full screen':'Full screen';button.setAttribute('aria-pressed',String(on));body.classList.toggle('fullscreen',on);};
 const go=async()=>{const touch=body.classList.contains('touch-mode');await enterLandscape({landscape:touch});label();onChange();};
 button.addEventListener('click',async()=>{
  if(!support.fullscreen){tip.showModal?.();return;}
  if(isFullscreen())await leaveFullscreen();else await go();
  label();onChange();
 });
 prompt.querySelector('#rotate-fullscreen')?.addEventListener('click',go);
 prompt.querySelector('#rotate-dismiss').addEventListener('click',()=>{body.classList.add('portrait-ok');try{sessionStorage.setItem(PORTRAIT_OK,'1');}catch{}onChange();});
 tip.querySelector('#close-install-tip').addEventListener('click',()=>tip.close());
 for(const type of ['fullscreenchange','webkitfullscreenchange'])document.addEventListener(type,()=>{label();onChange();});
 label();
 return {support,button,prompt};
}
