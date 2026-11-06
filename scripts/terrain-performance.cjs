// Compare the current renderer with a supplied previous wilds.js in real Chrome.
// TERRAIN_BASELINE points at the previous source file; NODE_PATH can supply Playwright.
const {chromium}=require('playwright');
const {readFileSync,mkdirSync,writeFileSync}=require('node:fs');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5217';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.EDITOR_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const results=[];
 const size=Number(process.env.TERRAIN_SIZE)||320;
 for(const baseline of [true,false]){
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.route('**/src/wilds.js',async route=>{
   const response=await route.fetch(),source=baseline?readFileSync(process.env.TERRAIN_BASELINE,'utf8'):await response.text();
   await route.fulfill({response,body:source+'\nexport {paintBlendedTerrain};'});
  });
  await page.goto('http://127.0.0.1:5217/manifest.webmanifest');
  results.push(await page.evaluate(async size=>{
   const W=await import('/src/wilds.js');
   const areas=Object.values(W.AREAS).filter(a=>!W.INTERIOR_AREAS.includes(a.id)&&a.id!=='abandoned-quarry');
   const width=size,height=size===320?240:size;
   const canvas=document.createElement('canvas');canvas.width=width;canvas.height=height;const c=canvas.getContext('2d',{willReadFrequently:true});
   const render=area=>{const x=area.spawn.x-width/2,y=area.spawn.y-height/2;c.setTransform(1,0,0,1,-x,-y);W.paintBlendedTerrain(c,x,y,width,height,area.id);};
   for(const area of areas)render(area);await new Promise(r=>setTimeout(r,1500));
   const times=[];
   for(const area of areas){
    W.clearTerrainCache();let start=performance.now();render(area);const cold=performance.now()-start;
    start=performance.now();render(area);const repaint=performance.now()-start;
    const pixels=c.getImageData(0,0,width,height).data;
    const digest=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',pixels))).map(n=>n.toString(16).padStart(2,'0')).join('');
    times.push({area:area.id,cold,repaint,digest});
   }
   return times;
  },size));
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();
 for(let i=0;i<results[0].length;i++)assert.equal(results[1][i].digest,results[0][i].digest,results[0][i].area+' pixels changed');
 const sum=(list,key)=>list.reduce((s,r)=>s+r[key],0);
 const report={areas:results[0].length,pixelsIdentical:true,before:{cold:sum(results[0],'cold'),repaint:sum(results[0],'repaint')},after:{cold:sum(results[1],'cold'),repaint:sum(results[1],'repaint')},results};
 mkdirSync('screenshots/terrain-performance',{recursive:true});writeFileSync('screenshots/terrain-performance/report.json',JSON.stringify(report,null,2));
 console.log(JSON.stringify({...report,results:undefined}));process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
