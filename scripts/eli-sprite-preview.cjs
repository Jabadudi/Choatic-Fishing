// Local integration preview of Eli's sprite: standing, walking in each of the four directions, and the dialogue portrait.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5188';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('response',r=>{if(r.status()>=400)errors.push(`${r.status()} ${r.url()}`);});
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},view};'});});
 await page.goto('http://127.0.0.1:5188');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 await page.waitForTimeout(600);
 const box={x:532,y:300,width:300,height:300};
 await page.screenshot({path:`${out}/01-eli-standing.png`});
 for(const [key,dir] of [['KeyD','right'],['KeyA','left'],['KeyS','down'],['KeyW','up']]){
  await page.keyboard.down(key);await page.waitForTimeout(350);
  assert.equal(await w(()=>__qa.world.player.facing),dir);
  await page.screenshot({path:`${out}/02-walk-${dir}.png`,clip:box});await page.keyboard.up(key);await page.waitForTimeout(250);
  await page.screenshot({path:`${out}/03-stand-${dir}.png`,clip:box});
 }
 assert.deepEqual(errors,[]);
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
