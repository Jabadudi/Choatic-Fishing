// Cursor styles players pick in Settings. Each has a drawn stand-in until its art lands in assets/cursors/.
// `art` is the 32×32 PNG cut by scripts/prepare-cursors.py, which also prints the hotspots; the stand-in stays as the CSS fallback.
const ink='#1a1410';
const svg=body=>`<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 32 32" shape-rendering="crispEdges" stroke-linejoin="miter">${body}</svg>`;
export const CURSOR_STYLES=[
 {id:'system',name:'System',description:'Your device’s normal pointer.'},
 {id:'hook',name:'Fishing Hook',description:'A silver hook. Clicks with the point.',hotspot:[6,1],art:'assets/cursors/hook.png',
  standIn:svg(`<path d="M3 3V15Q3 25 12 25Q21 25 21 15V5" fill="none" stroke="${ink}" stroke-width="6"/><path d="M3 3V15Q3 25 12 25Q21 25 21 15V5" fill="none" stroke="#c9d3da" stroke-width="3"/><path d="M3 4L8 9" stroke="${ink}" stroke-width="4"/><path d="M3 4L7 8" stroke="#eef4f6" stroke-width="2"/><rect x="18" y="1" width="6" height="5" fill="#c9d3da" stroke="${ink}" stroke-width="2"/><path d="M24 3L31 1" stroke="#c4483a" stroke-width="2"/>`)},
 {id:'arrow',name:'Hunter’s Arrow',description:'An iron arrowhead with red fletching.',hotspot:[2,1],art:'assets/cursors/arrow.png',
  standIn:svg(`<path d="M9 9L26 26" stroke="${ink}" stroke-width="6"/><path d="M9 9L26 26" stroke="#a0703c" stroke-width="3"/><path d="M2 2L15 6L6 15Z" fill="#b8c0c8" stroke="${ink}" stroke-width="2"/><path d="M4 4L11 6L6 11Z" fill="#e6ecef"/><path d="M20 26L24 30L30 30L26 24Z" fill="#c4483a" stroke="${ink}" stroke-width="2"/><path d="M26 20L30 24L30 30L24 26Z" fill="#efe4c6" stroke="${ink}" stroke-width="2"/>`)},
 {id:'wand',name:'Wanderer’s Wand',description:'A twisted wand. Clicks with the star.',hotspot:[11,9],art:'assets/cursors/wand.png',
  standIn:svg(`<path d="M11 11L28 28" stroke="${ink}" stroke-width="6"/><path d="M11 11L28 28" stroke="#5c3a24" stroke-width="3"/><path d="M8 1L10 6L15 8L10 10L8 15L6 10L1 8L6 6Z" fill="#f2c94c" stroke="${ink}" stroke-width="2"/><rect x="6" y="6" width="2" height="2" fill="#fff6c8"/><rect x="17" y="3" width="2" height="2" fill="#fff"/><rect x="3" y="17" width="2" height="2" fill="#fff"/>`)},
 {id:'paw',name:'Moonfang Paw',description:'A wolf’s paw print. Clicks from the centre.',hotspot:[16,17],art:'assets/cursors/paw.png',
  standIn:svg(`<g fill="#ece0c2" stroke="${ink}" stroke-width="2"><ellipse cx="16" cy="22" rx="8" ry="6.5"/><ellipse cx="6.5" cy="13" rx="3.5" ry="4.5"/><ellipse cx="12.5" cy="7" rx="3.5" ry="4.5"/><ellipse cx="19.5" cy="7" rx="3.5" ry="4.5"/><ellipse cx="25.5" cy="13" rx="3.5" ry="4.5"/></g><rect x="12" y="19" width="5" height="2" fill="#c6d4e6"/>`)},
 {id:'leaf',name:'Willow Leaf',description:'A slim green leaf from Willowback.',hotspot:[3,1],art:'assets/cursors/leaf.png',
  standIn:svg(`<path d="M2 2Q25 5 27 27Q5 25 2 2Z" fill="#5f8a3c" stroke="${ink}" stroke-width="2"/><path d="M2 2Q20 7 22 22Q13 14 2 2Z" fill="#7da653"/><path d="M3 3L25 25" stroke="#c4d77a" stroke-width="1.5"/><path d="M26 26L31 31" stroke="#7a4f2a" stroke-width="3"/>`)},
 {id:'shard',name:'Crystal Shard',description:'A glowing shard like the familiar shards.',hotspot:[6,1],art:'assets/cursors/shard.png',
  standIn:svg(`<path d="M2 2L18 8L28 28L8 18Z" fill="#5fc4dc" stroke="#101c2c" stroke-width="2"/><path d="M2 2L18 8L15 15Z" fill="#c8f2fa"/><path d="M2 2L15 15L8 18Z" fill="#8ad8ea"/><path d="M15 15L28 28L18 8Z" fill="#3c9ab8"/>`)}
];
export const CURSOR_IDS=CURSOR_STYLES.map(c=>c.id);
export const standInUrl=c=>'data:image/svg+xml,'+encodeURIComponent(c.standIn);
export function cursorValue(id){
 const c=CURSOR_STYLES.find(s=>s.id===id);if(!c?.standIn)return '';
 const [x,y]=c.hotspot,layers=[c.art,standInUrl(c)].filter(Boolean).map(url=>`url("${url}") ${x} ${y}`);
 return `${layers.join(', ')}, auto`;
}
export function applyCursor(id,root=document.documentElement){
 const value=cursorValue(id);
 if(!value){delete root.dataset.cursor;root.style.removeProperty('--game-cursor');return;}
 root.dataset.cursor=id;root.style.setProperty('--game-cursor',value);
}
