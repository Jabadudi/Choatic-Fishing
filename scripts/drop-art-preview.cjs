// Local integration preview of world drops showing their item art and floating above their shadow.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view};'});});
 await page.goto('http://127.0.0.1:5187');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const finish=async()=>{const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}};
 const shot=(name,clip)=>page.screenshot({path:`${out}/${name}.png`,...(clip?{clip}:{})});
 await finish();
 // Hunt a deer in the meadow, then lay out a few other drops beside its loot.
 await w(async()=>{const {damageAnimal}=await import('/src/wildlife.js');const v=__qa.world;
  v.areaId='landing';const a=v.wildlife.find(x=>x.id==='deer-meadow');Object.assign(a,{x:1240,y:1150});Object.assign(v.player,{x:1170,y:1150,angle:0});damageAnimal(v,a,1e4,v.player,0);
  [['Turtle Shell',1290,1210],['River Pearl',1320,1180],['Eel Skin',1220,1225],['Mystery Thing',1190,1210]].forEach(([name,x,y])=>v.drops.push({id:`drop-${v.nextDropId++}`,entityType:'pickup',spriteId:'pickup',areaId:'landing',x,y,item:{id:`qa-${name}`,name,uses:1}}));});
 await page.waitForTimeout(900);
 assert.ok(await w(()=>__qa.world.drops.filter(d=>d.areaId==='landing').length>=4));
 await shot('01-deer-loot-on-ground');
 const box=await w(()=>{const v=__qa.world,c=document.querySelector('canvas').getBoundingClientRect(),s=__qa.view.scale;return {x:c.left+__qa.view.x+1150*s,y:c.top+__qa.view.y+1110*s,width:220*s,height:150*s};});
 for(let i=0;i<3;i++){await shot(`02-bob-${i}`,box);await page.waitForTimeout(400);}
 assert.deepEqual(errors,[]);console.log('Drop art preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
