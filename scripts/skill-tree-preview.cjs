// Local preview of the per-skill trees on the skills sheet: points, locked and learned talents, desktop and phone.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5183';await import('../server.mjs');
 const out=process.env.OUT||'screenshots';
 const browser=await chromium.launch({headless:true,...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1365,height:900}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.route('**/src/main.js',async route=>{const response=await route.fetch();await route.fulfill({response,body:await response.text()+'\nwindow.__qa={get world(){return world;}};'});});
 await page.goto('http://127.0.0.1:5183');await page.locator('#explore-world').click();
 await page.locator('#story-scene[open]').waitFor();
 const w=(fn,arg)=>page.evaluate(fn,arg);
 const shot=name=>page.screenshot({path:`${out}/${name}.png`});
 for(let i=0;i<80&&await w(()=>!!__qa.world.story.scene);i++){await page.locator('#story-next').click();await page.waitForTimeout(30);}
 await w(()=>{const p=__qa.world.progression,up=(id,n)=>{for(let i=0;i<n;i++)p.train(id,40+(p.skills[id].level-1)*30);};up('fishing',4);up('hunting',2);up('cooking',1);});
 await page.keyboard.press('KeyK');await page.locator('#skills-sheet[open]').waitFor();await page.waitForTimeout(200);
 await shot('01-fishing-tree-fresh');
 for(const id of ['patient-line','patient-line','strong-reel']){await page.locator(`[data-talent="${id}"]`).click();await page.locator('[data-learn]').click();}
 await page.locator('[data-talent="slack-line"]').click();await page.waitForTimeout(100);await shot('02-fishing-tree-learned');
 assert.deepEqual(await w(()=>__qa.world.progression.skillTrees.fishing),{'patient-line':2,'strong-reel':1});
 await page.locator('[data-skill="hunting"]').click();await page.locator('[data-talent="apex-hunter"]').click();await page.waitForTimeout(100);await shot('03-hunting-tree-locked');
 await page.locator('[data-skill="cooking"]').click();await page.locator('[data-talent="iron-stomach"]').click();await page.locator('[data-learn]').click();await page.waitForTimeout(100);await shot('04-cooking-tree');
 await page.setViewportSize({width:390,height:844});await page.locator('[data-skill="fishing"]').click();await page.locator('.skills-tree').scrollIntoViewIfNeeded();await page.waitForTimeout(200);await shot('05-tree-mobile');
 assert.deepEqual(errors,[]);await browser.close();process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
