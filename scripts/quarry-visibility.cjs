// Real-canvas regression: actor visibility, pooled scenery and texture repaints.
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
(async()=>{
 process.env.PORT='5238';await import('../server.mjs');
 const browser=await chromium.launch({headless:true,executablePath:process.env.EDITOR_TEST_CHROME||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 try{
  const page=await browser.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto('http://127.0.0.1:5238/manifest.webmanifest');
  const report=await page.evaluate(async()=>{
   const {DELTA}=await import('/src/delta-areas.js'),{elevationBands}=await import('/src/elevation-art.js'),{drawDepthSorted}=await import('/src/wilds.js');
   const built=DELTA['abandoned-quarry'],e=built.elevation,original=e.heightAt;let samples=0;
   e.heightAt=(...a)=>{samples++;return original(...a);};
   const view={left:0,right:1200,top:250,bottom:950};
   let start=performance.now();const first=elevationBands(built,view),coldMs=performance.now()-start,firstSamples=samples;
   await new Promise(r=>setTimeout(r,2000));samples=0;start=performance.now();const next=elevationBands(built,view),repaintMs=performance.now()-start;
   if(samples!==0)throw Error('Texture repaint resampled terrain: '+samples);
   if(next.length>=Math.ceil(built.area.height/16))throw Error('Walk view eagerly built whole map');
   e.heightAt=original;
   const canvas=document.createElement('canvas');canvas.width=1200;canvas.height=1200;const ctx=canvas.getContext('2d');
   const player={x:460,y:730},mob={x:650,y:600},world={areaId:built.area.id,player,elapsed:4};
   const actors=[{ref:player,y:742},{ref:mob,y:614}];
   const draw=list=>{ctx.clearRect(0,0,1200,1200);drawDepthSorted(ctx,world,view,list,()=>{},{still:true});return ctx.getImageData(0,0,1200,1200).data;};
   draw(actors);await new Promise(r=>setTimeout(r,1500));
   const many=draw(actors),one=draw(actors.slice(0,1));
   for(let i=0;i<many.length;i++)if(many[i]!==one[i])throw Error('Scenery changed when actor count changed at byte '+i);
   const drawn=[];drawDepthSorted(ctx,world,view,actors,(c,a)=>{drawn.push(a===player?'player':'mob');c.fillStyle=a===player?'#ff00ff':'#00ffff';c.fillRect(a.x-8,a.y-24,16,24);},{still:true});
   if(drawn.join(',')!=='mob,player')throw Error('Local explorer was not the final actor');
   const y=Math.round(player.y-e.heightAt(player.x,player.y)-12),pixel=ctx.getImageData(player.x,y,1,1).data;
   if(pixel[0]!==255||pixel[1]!==0||pixel[2]!==255)throw Error('Player covered by scenery/terrain');
   return {coldMs,repaintMs,firstSamples,repaintSamples:samples,visibleRows:next.length,totalRows:Math.ceil(built.area.height/16),pooledSceneryStable:true,playerVisible:true};
  });
  assert.deepEqual(errors,[]);console.log(JSON.stringify(report));
 }finally{await browser.close();}process.exit(0);
})().catch(e=>{console.error(e);process.exit(1);});
