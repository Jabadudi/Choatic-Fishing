// The title screen's own art. Everything else waits for it, so on a slow phone connection
// the menu is not sharing bandwidth with game sprites, props and the Firebase SDK.
// index.html preloads the same files, so these requests reuse that download.
export const TITLE_ART=['assets/title/logo.webp','assets/title/background.webp','assets/title/button.webp'];
const LONGEST_WAIT=15000;
function loaded(path){
 return new Promise(resolve=>{const img=new Image();img.onload=img.onerror=resolve;img.src=new URL(`../${path}`,import.meta.url).href;});
}
export const titleArtReady=typeof Image==='undefined'?Promise.resolve():Promise.race([
 Promise.all(TITLE_ART.map(loaded)),
 new Promise(resolve=>setTimeout(resolve,LONGEST_WAIT))
]);
