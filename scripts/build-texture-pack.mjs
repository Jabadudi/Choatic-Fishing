// Build an installable pack from a folder mirroring assets/. No game-code edits required.
import {readdir,readFile,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {validateTexturePack} from '../src/texture-packs.js';
const [folder,out,name='Custom artwork']=process.argv.slice(2);if(!folder||!out)throw Error('Usage: node scripts/build-texture-pack.mjs ART_FOLDER OUTPUT.json "Pack name"');
const assets={};async function collect(dir,prefix=''){for(const entry of await readdir(dir,{withFileTypes:true})){if(entry.isSymbolicLink())throw Error('Symlinks are not supported.');const key=prefix+entry.name;if(entry.isDirectory())await collect(path.join(dir,entry.name),key+'/');else{const ext=path.extname(entry.name).toLowerCase(),mime={'.png':'png','.webp':'webp','.jpg':'jpeg','.jpeg':'jpeg'}[ext];if(!mime)throw Error('Only PNG, WebP and JPEG files belong in a texture pack: '+key);assets[key]='data:image/'+mime+';base64,'+(await readFile(path.join(dir,entry.name))).toString('base64');}}}
await collect(folder);const pack=validateTexturePack({format:'the-wilds-texture-pack',version:1,name,assets});await writeFile(out,JSON.stringify(pack));console.log(`Created ${out} with ${Object.keys(assets).length} replacements.`);
