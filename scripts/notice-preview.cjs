// Local preview of the exploring notices: the shiny notice mid-screen, every other message except XP and items gained in the bottom notice line, no save badge.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async()=>{
 process.env.PORT='5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const run=async(name,options)=>{
  const context=await browser.newContext(options),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5187');await page.locator('#explore-world').click();
  await page.locator('#story-scene[open]').waitFor();
  const w=fn=>page.evaluate(fn);
  const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await page.waitForTimeout(1500);
  assert.equal(await page.locator('#save-status').isVisible(),false);
  await w(()=>{__qa.world.message="Grandpa's fishing rod is on the weapon rack inside the cabin. · +1 Wishstone";});await page.waitForTimeout(300);
  assert.equal(await page.locator('#world-notice').textContent(),"Grandpa's fishing rod is on the weapon rack inside the cabin.");
  assert.equal(await page.locator('#status').isVisible(),false);
  await page.screenshot({path:`${out}/${name}-01-notice.png`});
  await w(()=>{__qa.world.message='Deer hunted · +10 Hunting XP · Dropped Venison · Something glimmers in Windchime Path…';});await page.waitForTimeout(300);
  assert.equal(await page.locator('#status').textContent(),'Something glimmers in Windchime Path…');
  assert.equal(await page.locator('#world-notice').textContent(),'Deer hunted');
  await page.screenshot({path:`${out}/${name}-02-notice-and-shiny.png`});
  assert.deepEqual(errors,[]);await context.close();
 };
 await run('desktop',{viewport:{width:1365,height:900}});
 await run('phone',{viewport:{width:915,height:412},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:ANDROID});
 console.log('Notice preview passed.');
 await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
