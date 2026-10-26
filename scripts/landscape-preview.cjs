// Phone-size preview of full screen and landscape play: rotate prompt, landscape HUD, conversations and fishing.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const IPHONE='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async()=>{
 process.env.PORT='5186';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const open=async(width,height,userAgent=ANDROID,iphone=false)=>{
  const context=await browser.newContext({viewport:{width,height},isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent});
  // Headless Chromium supports the Fullscreen API; iPhone Safari does not, so hide it for the iPhone run.
  if(iphone)await context.addInitScript(()=>{Object.defineProperty(Document.prototype,'fullscreenEnabled',{get:()=>false});Element.prototype.requestFullscreen=undefined;});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5186');page.errors=errors;return page;
 };
 const start=async page=>{await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();await page.waitForFunction(()=>document.querySelector('#story-scene')?.dataset.phase==='dialogue');};
 const box=async(page,selector)=>{const l=page.locator(selector);return await l.isVisible()?l.boundingBox():null;};
 const overlap=(a,b)=>a&&b&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;

 // Android portrait: the game asks to turn sideways and offers full screen.
 let page=await open(412,915);await page.screenshot({path:`${out}/landscape-01-title-portrait.png`});
 await start(page);await page.locator('#story-close').click();
 await page.locator('#rotate-prompt').waitFor();assert.ok(await page.locator('#rotate-fullscreen').isVisible());assert.equal(await page.locator('.rotate-ios').isVisible(),false);
 await page.screenshot({path:`${out}/landscape-02-rotate-android.png`});
 await page.locator('#rotate-fullscreen').click();await page.waitForFunction(()=>!!document.fullscreenElement);
 assert.equal(await page.locator('#toggle-fullscreen').getAttribute('aria-pressed'),'true');
 await page.locator('#rotate-dismiss').click();assert.equal(await page.locator('#rotate-prompt').isVisible(),false);
 await page.screenshot({path:`${out}/landscape-03-portrait-kept.png`});
 assert.deepEqual(page.errors,[]);await page.context().close();

 // iPhone portrait: no Fullscreen API, so the prompt explains rotation lock and Add to Home Screen.
 page=await open(390,844,IPHONE,true);await start(page);await page.locator('#story-close').click();
 await page.locator('#rotate-prompt').waitFor();assert.equal(await page.locator('#rotate-fullscreen').count(),0);assert.ok(await page.locator('.rotate-ios').isVisible());
 await page.screenshot({path:`${out}/landscape-04-rotate-iphone.png`});
 await page.locator('#rotate-dismiss').click();await page.locator('#toggle-fullscreen').click();await page.locator('#install-tip[open]').waitFor();
 await page.screenshot({path:`${out}/landscape-05-iphone-install-tip.png`});
 assert.deepEqual(page.errors,[]);await page.context().close();

 // Landscape on three phone sizes: nothing important may overlap.
 for(const [name,w,h,ua] of [['iphone-se',667,375,IPHONE],['iphone-15',844,390,IPHONE],['pixel-8',915,412,ANDROID]]){
  page=await open(w,h,ua,ua===IPHONE);await start(page);
  await page.screenshot({path:`${out}/landscape-${name}-dialogue.png`});
  await page.locator('#story-close').click();await page.waitForTimeout(400);
  assert.equal(await page.locator('#rotate-prompt').isVisible(),false);
  const parts={};
  for(const s of ['#exploration-hud','#quest-objective','#open-skills','#open-backpack','#open-saves','#open-codex','#open-atlas','#open-settings','#toggle-fullscreen','.hotbar','.touch-actions','.touch-movement','.status'])parts[s]=await box(page,s);
  for(const s of ['#open-skills','#open-backpack','#open-atlas','#open-settings','#toggle-fullscreen','.hotbar','.touch-actions','.touch-movement'])assert.ok(parts[s],`${name}: ${s} visible`);
  const keys=Object.keys(parts).filter(s=>parts[s]&&s!=='#quest-objective'&&s!=='.status');
  for(let i=0;i<keys.length;i++)for(let j=i+1;j<keys.length;j++)if(!(keys[i]==='#exploration-hud'&&keys[j]==='#quest-objective'))assert.ok(!overlap(parts[keys[i]],parts[keys[j]]),`${name}: ${keys[i]} overlaps ${keys[j]}`);
  for(const s of keys)assert.ok(parts[s].x>=0&&parts[s].x+parts[s].width<=w&&parts[s].y>=0&&parts[s].y+parts[s].height<=h,`${name}: ${s} on screen`);
  await page.screenshot({path:`${out}/landscape-${name}-explore.png`});
  // Fishing: the line meter sits between the thumbs and leaves the joystick free.
  await page.evaluate(()=>Object.assign(window.__qa.world.fishing,{state:'reeling',time:0,bar:.4,velocity:0,target:.45,progress:.5,grace:99}));
  await page.locator('#line-panel').waitFor();const line=await box(page,'#line-panel');
  assert.equal(await page.locator('.hotbar').isVisible(),false);
  for(const s of ['.touch-movement','.touch-actions','#open-skills','#open-backpack','#open-saves','#open-settings','#toggle-fullscreen',await box(page,'.status')])assert.ok(!overlap(line,typeof s==='string'?parts[s]:s),`${name}: line panel overlaps ${s}`);
  assert.ok(line.y>=0&&line.y+line.height<=h,`${name}: line panel on screen`);
  await page.screenshot({path:`${out}/landscape-${name}-fishing.png`});
  assert.deepEqual(page.errors,[]);await page.context().close();
 }
 await browser.close();console.log(`Landscape preview passed; screenshots in ${out}/`);process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
