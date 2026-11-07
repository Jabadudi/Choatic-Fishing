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
 const link='<p class="version-switch" style="margin:6px 0 10px;font:13px Georgia,serif;color:#e9dcb8">You are playing <strong>The Wilds Classic</strong> · <a href="../" style="color:#ffd27a">Play the new Regions version</a></p>';
 await writeFile(page,html.replace(marker,link+marker));
 console.log(`Classic game (${commit.slice(0,7)}) built in dist/classic/`);
}finally{await rm(work,{recursive:true,force:true});}
