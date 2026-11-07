// Builds the classic game (the version before the Region restructure) into dist/classic/, so it stays playable next to
// the current game. The classic source is a fixed commit (classic.json); it is never edited, only its start screen gets
// a link back. Run after build.mjs; CI checks out the full history so the commit is available.
import {execFileSync} from 'node:child_process';
import {mkdtemp,readFile,writeFile,cp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
const {commit}=JSON.parse(await readFile(new URL('../classic.json',import.meta.url),'utf8'));
if(!/^[0-9a-f]{40}$/.test(commit))throw Error('classic.json needs a full commit hash.');
const root=new URL('..',import.meta.url).pathname,work=await mkdtemp(join(tmpdir(),'wilds-classic-'));
try{
 execFileSync('sh',['-c',`git -C "${root}" archive --format=tar ${commit} | tar -x -C "${work}"`],{stdio:'inherit'});
 execFileSync(process.execPath,['build.mjs'],{cwd:work,stdio:'inherit'});
 const out=join(root,'dist','classic');await rm(out,{recursive:true,force:true});await cp(join(work,'dist'),out,{recursive:true});
 // The classic start screen gets one line pointing back to the current game.
 const page=join(out,'index.html'),html=await readFile(page,'utf8'),marker='<div class="lobby-actions">';
 if(!html.includes(marker))throw Error('Classic start screen not found.');
 // The same game picker as the Regions start screen, with Classic chosen. Classic's own stylesheet does not have it.
 const box='display:flex;flex-direction:column;gap:2px;padding:8px 10px;border-radius:6px;font:bold 14px Georgia,serif;text-decoration:none;text-align:center',small='font:11px Georgia,serif;color:#c8b98f';
 const link=`<div class="game-pick" role="group" aria-label="Choose a game" style="display:grid;grid-template-columns:1fr 1fr;gap:8px;margin:4px 6% 12px"><a href="../" style="${box};border:1px solid #c9a85a88;background:#1a120ab3;color:#e9dcb8">The Wilds: Regions<small style="${small}">New · field maps, slimes, ranks</small></a><span aria-current="true" style="${box};border:1px solid #ffd27a;background:#3a2810d9;color:#ffd27a">The Wilds Classic<small style="${small}">The story · the whole Reedwater Delta</small></span></div>`;
 await writeFile(page,html.replace(marker,link+marker));
 console.log(`Classic game (${commit.slice(0,7)}) built in dist/classic/`);
}finally{await rm(work,{recursive:true,force:true});}
