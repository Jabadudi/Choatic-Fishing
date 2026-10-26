export const CUTSCENE_TIMING=Object.freeze({fade:1000,hold:3000,dim:1400,dialogue:450,darkness:.86});
export function cutscenePresentation(elapsed,hasVisual=true){
 if(!hasVisual)return {art:0,darkness:0,dialogue:1,ready:true,phase:'dialogue'};
 const t=Math.max(0,elapsed),v=CUTSCENE_TIMING,dialogueAt=v.fade+v.hold+v.dim,clamp=n=>Math.max(0,Math.min(1,n));
 return {art:clamp(t/v.fade),darkness:v.darkness*clamp((t-v.fade-v.hold)/v.dim),dialogue:clamp((t-dialogueAt)/v.dialogue),ready:t>=dialogueAt+v.dialogue,phase:t<v.fade?'fade':t<v.fade+v.hold?'art':t<dialogueAt?'dim':'dialogue'};
}
