// Local preview of the shiny notice, the only status text left while exploring, in the middle of the screen.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5187');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
 // Any other message stays hidden.
 await w(()=>{__qa.world.message="Grandpa's fishing rod is on the weapon rack inside the cabin. · +1 Wishstone";});await page.waitForTimeout(300);
 assert.equal(await page.locator('#status').textContent(),'');assert.equal(await page.locator('#status').isVisible(),false);
 await page.screenshot({path:`${out}/01-no-other-text.png`});
 await w(()=>{__qa.world.message='Deer hunted · +10 Hunting XP · Something glimmers in Windchime Path…';});await page.waitForTimeout(300);
 assert.equal(await page.locator('#status').textContent(),'Something glimmers in Windchime Path…');
 await page.screenshot({path:`${out}/02-shiny-notice-desktop.png`});
 for(const [name,size] of [['03-phone-landscape',{width:844,height:390}],['04-phone-portrait',{width:390,height:844}]]){await page.setViewportSize(size);await page.waitForTimeout(400);await page.screenshot({path:`${out}/${name}.png`});}
 assert.deepEqual(errors,[]);console.log('Shiny notice preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
