// Interior of the chief's red house in Willowback. Geometry and collision only; story.js decides who stands here.
export const CHIEF_DOOR={x:780,y:352};
export const CHIEF_HOUSE={id:'chief-house',name:'The Chief’s House',width:640,height:480,seed:7351,spawn:{x:320,y:410},exits:[{edge:'south',from:270,to:370,target:'village',entry:{x:CHIEF_DOOR.x,y:420},label:'Willowback Village'}]};
export const EMILIA_SPOT={x:178,y:196};
export const MARA_SPOT={x:428,y:300};
export const CHIEF_HOUSE_PLACES=[
 {id:'chief-hearth',name:'The Hearth',x:96,y:150,kind:'interior',text:'A kettle hangs over the fire. Dried herbs and flowers hang from the beams, and the room smells of woodsmoke and tea.'},
 {id:'chief-table',name:'The Round Table',x:320,y:300,kind:'interior',text:'Too small to be a dining table, too big to be a coffee table. Three clay cups are still warm.'}
];
const BLOCKS=[[28,28,168,128],[214,28,432,70],[262,206,378,284],[486,316,604,360],[30,330,90,440]];
export const chiefHouseBlocked=(x,y)=>BLOCKS.some(([l,t,r,b])=>x>l-12&&x<r+12&&y>t-12&&y<b+12);
export function drawChiefHouse(c,t=0){
 c.fillStyle='#2a1d18';c.fillRect(0,0,640,480);
 // Floorboards and walls.
 c.fillStyle='#9a6a43';c.fillRect(24,24,592,432);
 for(let y=25;y<456;y+=20){c.fillStyle='#7a5133';c.fillRect(24,y,592,2);for(let x=24+(y%40?0:58);x<616;x+=116)c.fillRect(x,y,2,20);}
 c.fillStyle='#7b3531';c.fillRect(10,10,620,22);c.fillRect(10,10,18,450);c.fillRect(612,10,18,450);
 c.fillStyle='#e4d8bb';c.fillRect(10,30,620,3);
 // Carved posts by the walls.
 for(const x of [196,446]){c.fillStyle='#5f3a26';c.fillRect(x,32,14,60);c.fillStyle='#c79a5a';for(let y=40;y<88;y+=12)c.fillRect(x+4,y,6,6);}
 // Woven rug under the table.
 c.fillStyle='#3d4f7a';c.fillRect(208,180,224,140);c.fillStyle='#a13f33';c.fillRect(216,188,208,124);c.fillStyle='#e4d8bb';
 for(let x=224;x<420;x+=16)c.fillRect(x,194,8,4),c.fillRect(x,302,8,4);
 // Stone hearth with a living fire and the kettle.
 c.fillStyle='#6d6762';c.fillRect(28,28,140,100);c.fillStyle='#8a837c';for(let y=32;y<124;y+=14)for(let x=32+(y%28?0:10);x<164;x+=22)c.fillRect(x,y,18,10);
 c.fillStyle='#1d1412';c.fillRect(56,62,84,58);
 const flick=Math.sin(t*7)*3;c.fillStyle='#f08a2c';c.beginPath();c.moveTo(66,120);c.lineTo(84,86+flick);c.lineTo(96,104);c.lineTo(108,80-flick);c.lineTo(130,120);c.fill();
 c.fillStyle='#ffd27a';c.beginPath();c.moveTo(84,120);c.lineTo(98,98-flick);c.lineTo(112,120);c.fill();
 c.fillStyle='#4a3326';c.fillRect(92,58,4,14);c.fillStyle='#8a4f2b';c.beginPath();c.ellipse(94,78,12,9,0,0,Math.PI*2);c.fill();
 // Shelves of pots, jars and hanging herbs.
 c.fillStyle='#5f3a26';c.fillRect(214,58,218,8);c.fillRect(214,34,218,5);
 const pots=['#8a4f2b','#b07a45','#3d4f7a','#6f7f5c','#a1593a','#c9a46a','#5c4535'];
 pots.forEach((color,i)=>{c.fillStyle=color;c.fillRect(222+i*30,42,18,16);c.fillStyle='#0003';c.fillRect(222+i*30,54,18,4);});
 for(let i=0;i<6;i++){const x=232+i*34;c.strokeStyle='#5d4a2e';c.lineWidth=2;c.beginPath();c.moveTo(x,70);c.lineTo(x,84);c.stroke();c.fillStyle=i%2?'#c96b3c':'#7f9a55';c.fillRect(x-5,82,10,10);}
 // Window onto the evening village.
 c.fillStyle='#5f3a26';c.fillRect(470,36,128,74);c.fillStyle='#f5b46a';c.fillRect(478,44,112,58);c.fillStyle='#7a6b8f';c.fillRect(478,44,112,22);
 c.fillStyle='#3e4a5c';c.fillRect(486,74,26,28);c.fillRect(530,70,30,32);c.fillStyle='#5f3a26';c.fillRect(532,44,4,58);c.fillRect(478,72,112,3);
 // Round table, three cups, candle and flowers.
 c.fillStyle='#3a271b55';c.beginPath();c.ellipse(324,266,64,26,0,0,Math.PI*2);c.fill();
 c.fillStyle='#6b4731';c.beginPath();c.ellipse(320,246,60,40,0,0,Math.PI*2);c.fill();c.fillStyle='#8a5e3c';c.beginPath();c.ellipse(320,242,54,34,0,0,Math.PI*2);c.fill();
 for(const [x,y] of [[292,236],[344,232],[318,256]]){c.fillStyle='#a8673d';c.fillRect(x-5,y-5,10,9);c.fillStyle='#e9c48a';c.fillRect(x-3,y-4,6,2);}
 c.fillStyle='#f2e2b5';c.fillRect(318,222,5,12);c.fillStyle='#ffd27a';c.fillRect(319,216+Math.sin(t*5),3,5);
 c.fillStyle='#7a9bd0';c.fillRect(340,250,4,4);c.fillStyle='#f4f0e6';c.fillRect(346,246,4,4);
 // Stools and the fur seat by the table.
 for(const [x,y] of [[250,252],[390,252],[320,300]]){c.fillStyle='#5a3b28';c.fillRect(x-12,y-6,24,14);c.fillStyle='#e7dcc6';c.fillRect(x-10,y-8,20,6);}
 // Wall bench and the chief's chest.
 c.fillStyle='#6b4731';c.fillRect(486,316,118,44);c.fillStyle='#3d4f7a';c.fillRect(490,320,110,14);
 c.fillStyle='#5a3b28';c.fillRect(30,330,60,110);c.fillStyle='#c79a5a';c.fillRect(30,380,60,4);c.fillRect(56,330,8,110);
 // Doorway.
 c.fillStyle='#c4a274';c.fillRect(278,438,84,42);c.fillStyle='#e4d8bb';c.fillRect(270,436,8,44);c.fillRect(362,436,8,44);
 // Warm firelight over the room.
 const glow=c.createRadialGradient(98,110,10,98,110,300);glow.addColorStop(0,'rgba(255,170,80,.28)');glow.addColorStop(1,'rgba(255,170,80,0)');c.fillStyle=glow;c.fillRect(24,24,592,432);
}
