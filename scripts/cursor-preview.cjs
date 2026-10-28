const {chromium}=require('playwright');
const assert=require('node:assert/strict');
// Screenshots never include the real pointer, so the preview draws the chosen cursor where the mouse is.
const out=process.env.OUT||'screenshots/cursors';
(async()=>{
 process.env.PORT='5186';await import('../server.mjs');require('node:fs').mkdirSync(out,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 const pointer=async(x,y)=>{await page.mouse.move(x,y);await page.evaluate(async([x,y])=>{const {CURSOR_STYLES,standInUrl}=await import('/src/cursors.js'),id=document.documentElement.dataset.cursor,c=CURSOR_STYLES.find(s=>s.id===id);let img=document.getElementById('qa-pointer');img?.remove();if(!c)return;img=document.createElement('img');img.id='qa-pointer';img.src=c.art||standInUrl(c);img.style.cssText=`position:fixed;z-index:99999;pointer-events:none;width:32px;height:32px;left:${x-c.hotspot[0]}px;top:${y-c.hotspot[1]}px`;(document.querySelector('dialog[open]')||document.body).append(img);await img.decode();},[x,y]);};
 await page.goto('http://127.0.0.1:5186');await page.locator('#open-settings').click();await page.locator('#settings-cursor-tab').click();
 assert.equal(await page.locator('[data-cursor-style="system"]').getAttribute('aria-pressed'),'true');
 for(const id of ['hook','arrow','wand','paw','leaf','shard']){
  await page.locator(`[data-cursor-style="${id}"]`).click();assert.equal(await page.locator('html').getAttribute('data-cursor'),id);
  assert.match(await page.evaluate(()=>getComputedStyle(document.querySelector('#close-settings')).cursor),/^url\("data:image\/svg\+xml/);
 }
 await page.locator('[data-cursor-style="hook"]').click();const b=await page.locator('[data-cursor-style="arrow"]').boundingBox();await pointer(b.x+b.width/2,b.y+b.height/2);await page.screenshot({path:`${out}/01-settings-cursor-tab.png`});
 await page.reload();assert.equal(await page.locator('html').getAttribute('data-cursor'),'hook');
 await pointer(700,520);await page.screenshot({path:`${out}/02-title-with-hook.png`});
 await page.locator('#open-settings').click();await page.locator('#settings-cursor-tab').click();await page.locator('[data-cursor-style="system"]').click();
 assert.equal(await page.locator('html').getAttribute('data-cursor'),null);
 await page.setViewportSize({width:390,height:844});await page.screenshot({path:`${out}/03-settings-phone.png`});
 assert.deepEqual(errors,[]);console.log('Cursor checks passed: six styles apply, persist across reload, and System restores the normal pointer.');await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
