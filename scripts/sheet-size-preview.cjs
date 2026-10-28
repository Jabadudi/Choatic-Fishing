// Local preview of menu window sizes on phones: each window keeps a margin and clears a simulated notch and home bar.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5193';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const sizes=[{name:'iphone-landscape',width:874,height:402,notch:{l:62,b:21}},{name:'iphone-se-landscape',width:667,height:375,notch:{l:0,b:0}},{name:'iphone-portrait',width:402,height:874,notch:{t:62,b:34}}];
 const errors=[];
 for(const size of sizes){
  const page=await browser.newPage({viewport:{width:size.width,height:size.height},hasTouch:true,isMobile:true,deviceScaleFactor:2});
  page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;},get ui(){return {wellUI,codexUI,backpackUI,skillsUI,questUI};}};'});});
  await page.goto('http://127.0.0.1:5193');
  // Headless Chromium reports no safe areas, so stand in for the phone's notch and home bar.
  const {l=0,r=0,t=0,b=0}=size.notch;
  await page.addStyleTag({content:`:root{--safe-l:${l}px;--safe-r:${r}px;--safe-t:${t}px;--safe-b:${b}px}`});
  await page.locator('#explore-world').click();await page.locator('#story-scene[open]').waitFor();
  const w=fn=>page.evaluate(fn);
  const scene=await w(()=>__qa.world.story.scene);for(let i=0;i<60&&await w(()=>__qa.world.story.scene)===scene;i++){await page.locator('#story-next').click();await page.waitForTimeout(40);}
  await page.waitForTimeout(300);
  for(const [id,ui] of [['codex-sheet','codexUI'],['well-sheet','wellUI'],['backpack','backpackUI'],['skills-sheet','skillsUI'],['quest-sheet','questUI']]){
   await w(new Function(`const u=__qa.ui.${ui};(u.toggle||u.show).call(u);`));
   await page.locator(`#${id}[open]`).waitFor();await page.waitForTimeout(250);
   const box=await page.locator(`#${id}`).boundingBox();
   const gapX=Math.max(20,Math.max(l,r)+14),gapY=Math.max(12,Math.max(t,b)+4);
   assert.ok(box.x>=gapX-1&&box.x+box.width<=size.width-gapX+1,`${id} clears the sides on ${size.name}: ${JSON.stringify(box)}`);
   assert.ok(box.y>=gapY-1&&box.y+box.height<=size.height-gapY+1,`${id} clears top and bottom on ${size.name}: ${JSON.stringify(box)}`);
   await page.screenshot({path:`${out}/${size.name}-${id}.png`});
   await page.keyboard.press('Escape');await page.waitForTimeout(150);
  }
  await page.close();
 }
 assert.deepEqual(errors,[]);
 await browser.close();console.log('sheet sizes ok');process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
