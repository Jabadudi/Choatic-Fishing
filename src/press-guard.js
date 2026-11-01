// A long press on a phone must never open the browser's own menus mid-game:
// iOS offers Share / Save to Photos on any held <img>, and a held button can start a drag or text selection.
// Only text fields keep their native menu, so chat and name entry can still paste.
const EDITABLE='input,textarea,select,[contenteditable=""],[contenteditable="true"]';
export function keepsNativePress(target){return !!target?.closest?.(EDITABLE);}
export function installPressGuard(root=document){
 const block=e=>{if(!keepsNativePress(e.target))e.preventDefault();};
 root.addEventListener('contextmenu',block,{capture:true});
 root.addEventListener('dragstart',block,{capture:true});
 root.addEventListener('selectstart',block,{capture:true});
}
