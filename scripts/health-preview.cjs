// Player health bar preview: desktop, narrow desktop, phone portrait and phone landscape, full and hurt.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async()=>{
 process.env.PORT='5188';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const open=async(width,height,mobile)=>{
  const context=await browser.newContext({viewport:{width,height},...(mobile?{isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:ANDROID}:{})});
  const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
  await page.goto('http://127.0.0.1:5188');
  await page.evaluate(async()=>{const {World}=await import('/src/world.js'),{captureSave}=await import('/src/save-format.js'),{IndexedSaveStore}=await import('/src/save-store.js');
   const w=new World(()=>.2,{adventure:true,story:true});w.journeyId='health-preview';w.story.scene=null;
   for(let i=0;i<3;i++)w.inventory.receive({name:'Sardine',description:'A small snack. Restores 35 health.'});
   await new IndexedSaveStore().update(()=>({journeyId:w.journeyId,current:captureSave(w),writerId:null,manual:null,backups:[]}));});
  await page.reload();await page.locator('#continue-journey:not([disabled])').click();await page.waitForFunction(()=>window.__qa?.world?.adventure);
  await page.evaluate(()=>{for(const d of document.querySelectorAll('dialog[open]'))d.close();document.querySelector('#rotate-dismiss')?.click();});
  await page.waitForTimeout(300);page.errors=errors;return page;
 };
 const overlap=(a,b)=>a&&b&&a.x<b.x+b.width&&b.x<a.x+a.width&&a.y<b.y+b.height&&b.y<a.y+a.height;
 // Hit Eli through the shared combat path, the same hook monsters use.
 const hurt=(page,amount)=>page.evaluate(async amount=>{const {damage}=await import('/src/combat.js'),w=window.__qa.world;damage(w,w.player,amount,{entityType:'monster'},0,0);},amount);
 const check=async(page,name)=>{
  const hud=await page.locator('#exploration-hud').boundingBox(),hp=await page.locator('#player-hp').boundingBox(),quest=await page.locator('#timed-upgrades').boundingBox();
  assert.ok(hp&&hp.width>100,`${name}: HP bar visible`);assert.ok(hp.y+hp.height<=hud.y+hud.height,`${name}: HP bar inside the card`);
  assert.ok(!overlap(hud,quest),`${name}: card clears the journey panel (${hud.y+hud.height} vs ${quest?.y})`);
 };
 for(const [name,w,h,mobile] of [['desktop',1366,900],['desktop-short',1280,580],['narrow',780,900],['phone-portrait',390,844,true],['phone-landscape',844,390,true],['phone-landscape-small',667,375,true]]){
  const page=await open(w,h,mobile);
  assert.match(await page.locator('#player-hp-text').innerText(),/^100 \/ 100$/);await check(page,name);
  if(name==='desktop')await page.screenshot({path:`${out}/health-01-full.png`});
  await hurt(page,38);await page.waitForTimeout(120);
  assert.equal(await page.locator('#player-hp.hurt').count(),1);
  if(name==='desktop')await page.screenshot({path:`${out}/health-02-hit.png`});
  await hurt(page,40);await page.waitForTimeout(1200);
  assert.equal(await page.locator('#player-hp.low').count(),1);assert.equal(await page.locator('#player-hp').getAttribute('aria-valuenow'),String(await page.evaluate(()=>Math.ceil(window.__qa.world.player.health))));
  await check(page,name);await page.screenshot({path:`${out}/health-${name}-low.png`});
  if(name==='desktop'){await page.locator('#player-hp').screenshot({path:`${out}/health-03-closeup.png`});}
  assert.deepEqual(page.errors,[]);await page.context().close();
 }
 console.log('Health bar checks passed: visible in every layout, flashes on a hit, warns when low.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
