// Authored against the approved 1417 x 1108 composition. Screen-space design points
// are converted back to logical atlas coordinates at the stated real floor height.
const round=n=>Math.round(n*10)/10;
export const quarryPoint=([x,y],height=0)=>[round(596+x*120/1417),round(96+y*94/1108+height*96/(1880/94))];
const poly=(points,height=0)=>points.map(p=>quarryPoint(p,height));
const prop=(kind,at,height,extra={})=>({kind,at:quarryPoint(at,height),...extra});
const outer=poly([[160,260],[195,225],[270,220],[310,188],[360,180],[410,150],[490,139],[550,130],[610,140],[650,170],[700,182],[745,155],[800,142],[860,128],[920,133],[970,138],[1010,150],[1100,156],[1190,178],[1250,194],[1290,225],[1305,270],[1325,330],[1310,410],[1320,510],[1300,610],[1280,720],[1230,785],[1120,846],[1000,881],[890,894],[750,893],[620,885],[505,860],[420,840],[350,802],[285,778],[230,730],[210,650],[140,570],[120,480],[125,420],[135,365],[145,315]]);
// Exposed soil continues around the foreground cut instead of creating a separate grey ring.
const frontY=quarryPoint([0,820],-2)[1],frontSoil=[];
for(let i=0;i<outer.length;i++){const a=outer[i],b=outer[(i+1)%outer.length],ia=a[1]>=frontY,ib=b[1]>=frontY;if(ia)frontSoil.push(a);if(ia!==ib){const t=(frontY-a[1])/(b[1]-a[1]);frontSoil.push([round(a[0]+(b[0]-a[0])*t),frontY]);}}
const floor=poly([[245,475],[300,464],[350,460],[390,452],[440,438],[480,434],[520,428],[565,427],[610,418],[665,398],[710,400],[755,410],[810,414],[860,423],[915,420],[960,404],[1005,401],[1040,386],[1090,380],[1130,382],[1160,399],[1205,400],[1255,425],[1290,452],[1295,560],[1280,650],[1225,720],[1130,780],[1000,815],[870,835],[700,840],[560,820],[455,790],[330,742],[230,700],[220,610],[230,530]],-2);
const pit=poly([[500,635],[520,596],[565,577],[600,550],[650,552],[690,536],[735,541],[770,550],[805,556],[840,578],[880,589],[912,620],[965,635],[994,664],[984,701],[954,733],[899,756],[820,772],[730,768],[650,752],[585,735],[540,699],[510,680]],-4);
const routes={
 upperIn:{from:quarryPoint([135,270],0),to:quarryPoint([300,330],-1)},
 upperOut:{from:quarryPoint([290,378],-1),to:quarryPoint([170,435],-2)},
 lowerIn:{from:quarryPoint([190,475],-2),to:quarryPoint([435,525],-3)},
 lowerOut:{from:quarryPoint([430,575],-3),to:quarryPoint([280,665],-4)},
 stairs:{from:quarryPoint([1120,350],-2),to:quarryPoint([1090,575],-4)}
};
function landing(id,height,a,b,pad=3.8){
 const l=Math.min(a[0],b[0])-pad,r=Math.max(a[0],b[0])+pad,t=Math.min(a[1],b[1])-pad,d=Math.max(a[1],b[1])+pad,c=pad*.65,points=[];
 for(const [x,y,start]of [[r-c,t+c,-Math.PI/2],[r-c,d-c,0],[l+c,d-c,Math.PI/2],[l+c,t+c,Math.PI]])for(let i=0;i<=5;i++){const angle=start+i*Math.PI/10;points.push([round(x+Math.cos(angle)*c),round(y+Math.sin(angle)*c)]);}
 return {id,height,points};
}
const turn=(a,b)=>Array.from({length:17},(_,i)=>{const t=i/16;return [round(a[0]+(b[0]-a[0])*t+Math.sin(Math.PI*t)*2.5),round(a[1]+(b[1]-a[1])*(1-Math.cos(Math.PI*t))/2)];});
const pierFrom=quarryPoint([900,770],-4),pierTo=quarryPoint([860,716],-4);
const pierDx=pierTo[0]-pierFrom[0],pierDy=pierTo[1]-pierFrom[1],pierLength=Math.hypot(pierDx,pierDy),pierN=[-pierDy/pierLength,pierDx/pierLength];
const pierPoly=[[-1,pierFrom],[-1,pierTo],[1,pierTo],[1,pierFrom]].map(([s,p])=>p.map((v,i)=>round(v+s*pierN[i])));
export const QUARRY_ROUTE=routes;
export const QUARRY_RAILS=poly([[450,339],[660,310]],-2);
export const QUARRY_DEF={id:'abandoned-quarry',num:'8',name:'Abandoned Quarry',frame:[596,716,96,190],size:[2400,1880],base:'land',ground:'meadow',
 shapes:[['water',poly([[0,960],[180,945],[340,966],[500,951],[650,967],[800,950],[960,960],[1110,942],[1240,950],[1417,930],[1417,1108],[0,1108]])],['water',pit]],
 zones:[['dirt',frontSoil],['dirt',floor],['rock',outer],['forest',poly([[0,0],[180,0],[155,170],[90,280],[95,440],[65,600],[115,760],[230,900],[180,960],[0,960]])],['forest',poly([[0,0],[1417,0],[1417,70],[1250,100],[1050,70],[850,90],[650,65],[400,100],[230,175],[0,230]])],['forest',poly([[1365,160],[1417,120],[1417,900],[1320,920],[1340,750],[1380,550]])]],
 elevation:{base:0,terraces:[
  {id:'work-terrace',height:-2,points:outer},
  {id:'quarry-floor',height:-4,points:floor},
  {id:'flooded-pit',height:-5,points:pit},
  landing('upper-turn',-1,routes.upperIn.to,routes.upperOut.from),
  landing('lower-turn',-3,routes.lowerIn.to,routes.lowerOut.from),
  {id:'wood-pier',height:-4,points:pierPoly}
 ],ramps:[
  {id:'upper-cart-in',...routes.upperIn,width:4,fromHeight:0,toHeight:-1,kind:'ramp'},
  {id:'upper-cart-out',...routes.upperOut,width:3.8,fromHeight:-1,toHeight:-2,kind:'ramp'},
  {id:'lower-cart-in',...routes.lowerIn,width:4,fromHeight:-2,toHeight:-3,kind:'ramp'},
  {id:'lower-cart-out',...routes.lowerOut,width:3.8,fromHeight:-3,toHeight:-4,kind:'ramp'},
  {id:'east-stairs',...routes.stairs,width:3.6,fromHeight:-2,toHeight:-4,kind:'stairs'}
 ]},
 cliffs:[],roads:[
 poly([[790,0],[790,80],[820,100],[1050,105],[1240,110],[1330,180],[1370,300],[1370,500],[1330,700],[1270,850],[1280,940]]),
 poly([[820,100],[640,95],[480,100],[370,135],[265,180],[150,230],[135,270]]),
 poly([[0,730],[105,720],[80,610],[80,480],[100,350],[135,270]]),
 [routes.upperIn.from,...turn(routes.upperIn.to,routes.upperOut.from),routes.upperOut.to,...poly([[153,445],[153,480]],-2),routes.lowerIn.from,...turn(routes.lowerIn.to,routes.lowerOut.from),routes.lowerOut.to],
 poly([[280,665],[270,700],[360,750],[560,790],[800,810],[1030,790],[1190,710],[1240,625]],-4)
 ],walks:[{pts:[pierFrom,pierTo],width:2,hit:2,cap:'square',extend:0},{pts:poly([[1280,940],[1300,1108]]),width:4.2,hit:4.2,cap:'square',extend:0}],bridges:[],
 props:[
 prop('crane',[780,370],-2,{scale:2.6,solid:0}),
 prop('boulder',[746,370],-2,{art:'quarry-block',scale:.9,solid:30}),
 prop('mine',[1130,307],-2,{scale:2.8,solid:0}),
 prop('cart',[560,322],-2,{scale:1.2,solid:24}),
 prop('bench',[474,382],-2,{art:'stonecutting-bench',solid:24}),
 prop('boulder',[835,382],-2,{art:'quarry-block',scale:1.2,solid:22}),
 prop('boulder',[873,375],-2,{art:'quarry-block',scale:1.4,solid:24}),
 prop('boulder',[892,391],-2,{art:'quarry-block',scale:.9,solid:18}),
 prop('logs',[1020,300],-2,{scale:1.2,solid:22}),
 prop('cart',[1190,340],-2,{art:'rain-barrel',solid:16}),
 prop('crane',[1250,585],-4,{scale:1.8,solid:0}),
 prop('boulder',[1185,586],-4,{art:'quarry-block',scale:1.1,solid:22}),
 prop('boulder',[1228,585],-4,{art:'quarry-block',scale:.9,solid:24}),
 prop('boulder',[386,718],-4,{art:'quarry-block',scale:1.3,solid:22}),
 prop('boulder',[421,730],-4,{art:'quarry-block',scale:.9,solid:18}),
 prop('cart',[1270,635],-4,{art:'rain-barrel',solid:16}),
 prop('sign',[1190,610],-4,{art:'rope-coils',solid:0}),
 prop('gate',[175,715],0,{solid:0})
 ],
 places:[
 {id:'quarry-pit',name:'Flooded Pit',at:quarryPoint([1030,720],-4),text:'The deepest cut is flooded. Green stone shelves descend below the dark water.'},
 {id:'old-crane',name:'Old Crane',at:quarryPoint([765,406],-2),text:'The loading crane dominates the broad work terrace. The old cart rails run from the cutting bay beneath its boom.'},
 {id:'collapsed-shaft',name:'Collapsed Shaft',at:quarryPoint([1090,354],-2),text:'Timber braces frame a blocked shaft in the north wall. Broken stone and moss seal the entrance.'},
 {id:'quarry-gate',name:'Quarry Gate',at:quarryPoint([175,700],0),text:'The rim road follows the wooded edge to the old cart descent. Two switchbacks wind down through the quarry cuts.'}
 ],
 exits:[{edge:'north',from:660,to:670,target:'springmouth-cave',label:'Springmouth Cave'},{edge:'west',from:152,to:164,target:'egret-isles',label:'Egret Isles'},{edge:'south',from:702,to:710,target:'broken-watch',label:'The Broken Watch'}]
};
