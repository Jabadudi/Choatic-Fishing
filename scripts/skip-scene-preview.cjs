// Shots of the Skip scene button on the opening conversation: ready, asking to confirm, and back in the world.
const {chromium}=require('playwright');
const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async()=>{
 process.env.PORT=process.env.PORT||'5188';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 for(const [name,w,h,mobile] of [['desktop',1365,900,false],['phone',844,390,true]]){
  const context=await browser.newContext({viewport:{width:w,height:h},...(mobile?{isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:ANDROID}:{})});
  const page=await context.newPage();await page.goto(`http://127.0.0.1:${process.env.PORT}`);
  await page.locator('#explore-world').click();await page.waitForFunction(()=>document.querySelector('#story-scene')?.dataset.phase==='dialogue');await page.waitForTimeout(500);
  await page.screenshot({path:`${out}/skip-${name}-01-button.png`});
  await page.locator('#story-skip-scene').click();await page.waitForTimeout(200);
  await page.screenshot({path:`${out}/skip-${name}-02-confirm.png`});
  await page.locator('#story-skip-scene').click();await page.waitForTimeout(800);
  console.log(name,'dialog open after skip:',await page.locator('#story-scene').evaluate(d=>d.open));
  await page.screenshot({path:`${out}/skip-${name}-03-world.png`});await context.close();
 }
 await browser.close();process.exit(0);
})();
