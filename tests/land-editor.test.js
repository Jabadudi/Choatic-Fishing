import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {fromEditor,formatLandData,shippedLand} from '../scripts/land-editor.mjs';
import {BUILT_DEFS,LAND_FIELDS} from '../src/delta-areas.js';
import {defineArea} from '../src/atlas-area.js';
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
