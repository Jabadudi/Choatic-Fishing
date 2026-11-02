import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fromEditor,formatLandData,shippedLand} from '../scripts/land-editor.mjs';
import {BUILT_DEFS,LAND_FIELDS} from '../src/delta-areas.js';
import {defineArea} from '../src/atlas-area.js';
import {groundKind} from '../src/ground-textures.js';
const docsOf=areas=>Object.values(areas).map(a=>({id:a.id,def:JSON.stringify(a)}));
const merged=(id,edit)=>{const d={...BUILT_DEFS.find(d=>d.id===id)};for(const k of LAND_FIELDS)if(Object.hasOwn(edit,k))d[k]=edit[k];return d;};

test('the land editor round-trips the shipped land without a change',async()=>{
 // The editor starts from the land as shipped (delta-areas.js with land-data.js on top); exporting it untouched
 // writes land-data.js again, line for line.
 const notes=[],out=fromEditor(docsOf(shippedLand().areas),notes);
 assert.deepEqual(notes,[]);
 assert.equal(formatLandData(out),await readFile(new URL('../src/land-data.js',import.meta.url),'utf8'));
});

test('a land edit reshapes the area in the game and ships only the fields that changed',async()=>{
 const chime=JSON.parse(JSON.stringify(BUILT_DEFS.find(d=>d.id==='chimewood'))),b=defineArea(BUILT_DEFS.find(d=>d.id==='chimewood'));
 const spot=[340,300],[wx,wy]=b.toWorld(spot);assert.ok(b.water(wx,wy)>0,'dry land before the edit');
 chime.shapes=[...chime.shapes,['water','ellipse',spot,4,4]];
 chime.props=[...chime.props,{kind:'tree',art:'pine',at:[336,320]},{kind:'dragon',at:[336,320]}];
 const notes=[],out=fromEditor([{id:'chimewood',def:JSON.stringify(chime)},{id:'_shared',lastEditAt:'x'},{id:'nowhere',def:'{}'}],notes);
 assert.deepEqual(Object.keys(out),['chimewood']);assert.deepEqual(Object.keys(out.chimewood).sort(),['props','shapes']);
 assert.ok(notes.some(n=>n.includes('dragon')),'the unknown prop is reported');assert.ok(notes.some(n=>n.includes('nowhere')));
 const a=defineArea(merged('chimewood',out.chimewood));
 assert.ok(a.water(wx,wy)<0,'the new pond is water');
 const tree=a.props.find(p=>p.kind==='tree');assert.equal(tree.art,'pine');assert.ok(a.blocked(tree.x,tree.y),'a hand-placed tree blocks walking');
 // The written file is a module the game can load.
 const dir=await mkdtemp(join(tmpdir(),'land-')),file=join(dir,'land-data.mjs');await writeFile(file,formatLandData(out));
 const {LAND_DATA}=await import(pathToFileURL(file).href);assert.deepEqual(LAND_DATA.chimewood.shapes,out.chimewood.shapes);
});

test('malformed land is dropped, not shipped',()=>{
 const id='stonefall',def={id,shapes:[['lava',[[1,1],[2,2],[3,3]]],['land',[[220,240],[230,240]]],['water','ellipse',[260,247],'big',3],['land',[[220,240],[240,240],[240,260]],{zone:'swamp'}]],
  zones:[['ice',[[220,240],[240,240],[240,260]]]],exits:[{edge:'up',from:1,to:2,target:'windchime'},{edge:'east',from:250,to:250.2,target:'windchime'}],
  props:[{kind:'stone',at:[9999,-9999]}],places:[{id:'a',name:'A',at:[230,250]},{id:'a',name:'Again',at:[230,250]}],size:['a',3]};
 const notes=[],out=fromEditor([{id,def:JSON.stringify(def)}],notes).stonefall;
 assert.deepEqual(out.shapes,[['land',[[220,240],[240,240],[240,260]]]],'only the good shape is kept, without the unknown ground');
 assert.deepEqual(out.zones,[]);assert.deepEqual(out.exits,[]);assert.equal(out.places.length,1);
 const [X0,X1,Y0,Y1]=BUILT_DEFS.find(d=>d.id===id).frame;assert.deepEqual(out.props[0].at,[X1+40,Y0-40],'far-off props are pulled back to the area');
 assert.ok(!('size' in out));assert.ok(notes.length>=8);
});

test('doors, deck hitboxes, waterfalls and texture sizes ship from the editor',()=>{
 const b=BUILT_DEFS.find(d=>d.id==='stilt-reach');
 const def={...JSON.parse(JSON.stringify(b)),
  walks:[{pts:[[427,234],[436,234]],width:7.1,hit:5}],
  portals:[{at:[442,170],r:50,target:'marsh',label:'Netter’s Hut',quiet:true}],
  props:[...b.props,{kind:'waterfall',at:[470,200]}],
  textures:{forest:.5,sand:1,bogus:2}};
 const notes=[],out=fromEditor([{id:'stilt-reach',def:JSON.stringify(def)}],notes)['stilt-reach'];
 assert.deepEqual(out.walks,[{pts:[[427,234],[436,234]],width:7.1,hit:5}]);
 assert.deepEqual(out.portals,[{at:[442,170],r:50,target:'marsh',label:'Netter’s Hut',quiet:true}]);
 assert.ok(out.props.some(p=>p.kind==='waterfall'));
 assert.deepEqual(out.textures,{forest:.5});
 assert.ok(notes.some(n=>/texture size bogus/.test(n)));
 // The deck's walkable width is the hitbox, and it ends square: no walkable lip past the planks.
 const built=defineArea(merged('stilt-reach',out)),end=built.toWorld([436,234]);
 assert.ok(built.deck(end[0]+20,end[1]),'the plank run continues a little past the last point');
 assert.ok(!built.deck(end[0]+60,end[1]),'nothing past the square end');
 assert.ok(!built.deck(end[0]-40,end[1]+60),'the hitbox is narrower than the planks');
 assert.equal(built.area.portals[0].quiet,true);
});

test('a trail can carry its own surface, and the rest keep the area default',()=>{
 const b=BUILT_DEFS.find(d=>d.id==='great-bridge');
 const def={...JSON.parse(JSON.stringify(b)),roads:[{pts:b.roads[0],style:'dirt'},b.roads[1],{pts:[[430,10],[440,12]],style:'lava'}]};
 const notes=[],out=fromEditor([{id:'great-bridge',def:JSON.stringify(def)}],notes)['great-bridge'];
 assert.deepEqual(out.roads[0],{pts:b.roads[0],style:'dirt'});
 assert.deepEqual(out.roads[1],b.roads[1]);
 assert.deepEqual(out.roads[2],[[430,10],[440,12]]);
 assert.ok(notes.some(n=>/surface lava/.test(n)));
 const built=defineArea(merged('great-bridge',out)),[x0,y0]=built.toWorld(b.roads[0][1]),[x1,y1]=built.toWorld(b.roads[1][2]);
 assert.equal(built.trailAt(x0,y0),'dirt');
 assert.equal(built.trailAt(x1,y1),null);
 assert.equal(groundKind('great-bridge',{path:true,trail:'dirt'}),null,'dirt is the plain trail');
 assert.equal(groundKind('great-bridge',{path:true,trail:null}),'road','the old paved areas stay stone');
 assert.equal(groundKind('windchime-wood',{path:true,trail:'stone'}),'road');
 assert.equal(groundKind('windchime-wood',{path:true,trail:'packed'}),'dirt');
});

test('a new area made in the atlas ships whole and sits inside its parent on the world map',()=>{
 const def={isNew:true,id:'hidden-creek',num:'5.2.1',name:'Hidden Creek',within:'old-roads',frame:[0,120,0,80],size:[2400,1600],base:'land',ground:'meadow',
  roads:[{pts:[[10,40],[110,40]],style:'dirt'}],portals:[{at:[60,70],r:60,target:'old-roads',label:'Old Roads'}],bogus:1};
 const notes=[],out=fromEditor([{id:'hidden-creek',def:JSON.stringify(def)},{id:'nowhere',def:JSON.stringify({frame:[0,1,0,1]})}],notes);
 const n=out['hidden-creek'];
 assert.equal(n.isNew,true);assert.equal(n.name,'Hidden Creek');assert.equal(n.num,'5.2.1');assert.equal(n.within,'old-roads');
 assert.deepEqual(n.frame,[0,120,0,80]);assert.deepEqual(n.size,[2400,1600]);
 assert.deepEqual(n.roads,[{pts:[[10,40],[110,40]],style:'dirt'}]);
 assert.ok(!out.nowhere&&notes.some(t=>/unknown area nowhere/.test(t)));
 const text=formatLandData(out);assert.match(text,/"hidden-creek":\{\n  isNew:true,/);
 const built=defineArea({id:'hidden-creek',...n});
 assert.equal(built.area.width,2400);assert.equal(built.area.within,'old-roads');
 assert.equal(built.area.portals[0].target,'old-roads');
});

test('a door can be a line anywhere in the area, and arrivals land beside it',()=>{
 const b=BUILT_DEFS.find(d=>d.id==='stilt-reach');
 const def={...JSON.parse(JSON.stringify(b)),portals:[{at:[440,200],to:[440,220],r:30,target:'marsh',label:'Reed gap'}]};
 const notes=[],out=fromEditor([{id:'stilt-reach',def:JSON.stringify(def)}],notes)['stilt-reach'];
 assert.deepEqual(out.portals,[{at:[440,200],to:[440,220],r:30,target:'marsh',label:'Reed gap'}]);
 const built=defineArea(merged('stilt-reach',out)),q=built.area.portals[0];
 assert.equal(q.line.length,4);assert.equal(q.r,30);
 const [x1,y1]=built.toWorld([440,200]),[x2,y2]=built.toWorld([440,220]);
 assert.equal(q.x,Math.round((x1+x2)/2));
});
