// Desktop and phone-landscape shots of the opening conversation, for checking dialogue box size.
const {chromium}=require('playwright');
const ANDROID='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36';
(async()=>{
 process.env.PORT=process.env.PORT||'5187';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',tag=process.env.TAG||'dialogue';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 for(const [name,w,h,mobile] of [['desktop',1365,900,false],['phone-landscape',844,390,true]]){
  const context=await browser.newContext({viewport:{width:w,height:h},...(mobile?{isMobile:true,hasTouch:true,deviceScaleFactor:2,userAgent:ANDROID}:{})});
  const page=await context.newPage();await page.goto(`http://127.0.0.1:${process.env.PORT}`);
  await page.locator('#explore-world').click();await page.waitForFunction(()=>document.querySelector('#story-scene')?.dataset.phase==='dialogue');await page.waitForTimeout(500);
  const b=await page.locator('#story-scene .dialogue-box').boundingBox(),font=await page.locator('#story-text').evaluate(e=>getComputedStyle(e).fontSize);
  console.log(name,Math.round(b.width)+'x'+Math.round(b.height),'text',font);
  await page.screenshot({path:`${out}/${tag}-${name}.png`});await context.close();
 }
 await browser.close();process.exit(0);
})();
