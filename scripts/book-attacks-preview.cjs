// Local preview of the collection book's Attacks tab: the attack loop, damage, reach, wind-up and cooldown for a few
// monsters, captured as frame strips. OUT=<folder> sets where the screenshots go.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5197';await import('../server.mjs');
 const out=process.env.OUT||'screenshots',errors=[];
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await (await browser.newContext({viewport:{width:1366,height:768},deviceScaleFactor:Number(process.env.DPR||1)})).newPage();
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5197');await page.locator('#explore-world').click();await page.waitForFunction(()=>window.__qa?.world);
 await page.evaluate(()=>__qa.world.skipStory?.());await page.waitForTimeout(400);
 for(let i=0;i<5;i++)if(await page.locator('#story-scene[open]').count())await page.keyboard.press('Escape');
 await page.evaluate(()=>{const v=__qa.world;v.hunting=v.hunting||{};v.hunting.bySpecies={...(v.hunting.bySpecies||{}),'boss-frog':2,slime:40,'shore-crab':12,'boss-crab':1};});
 await page.locator('#open-codex').click();await page.locator('#book-sheet[open]').waitFor();
 for(const [species,name] of [['boss-frog','old-croaker'],['slime','slime'],['shore-crab','shore-crab']]){
  await page.locator(`#book-sheet [data-pick="${species}"]`).click();await page.locator('#book-sheet [data-sub="attacks"]').click();
  await page.locator('#book-sheet .book-attack canvas').waitFor();await page.waitForTimeout(900);
  assert.match(await page.locator('#book-sheet .book-attack-name').innerText(),/\S/);
  for(let i=0;i<Number(process.env.FRAMES||1);i++){await page.locator('#book-sheet .book-right').screenshot({path:`${out}/${name}-${String(i).padStart(2,'0')}.png`});await page.waitForTimeout(70);}
 }
 await page.locator('#book-sheet .book').screenshot({path:`${out}/book-attacks.png`});
 console.log(errors.join('\n')||'Book attacks preview passed.');await browser.close();process.exit(errors.length?1:0);
})().catch(e=>{console.error(e);process.exit(1);});
