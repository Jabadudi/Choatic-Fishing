import {cp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {releaseFingerprint} from './build-version.mjs';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','manifest.webmanifest','style.css','mobile.css','dialogue.css','landscape.css','src','assets','vendor'])await cp(file,`dist/${file}`,{recursive:true});
// A new module directory prevents phones reusing older cached dependency files.
const files=[];
for(const name of (await readdir('src')).filter(name=>name.endsWith('.js')))files.push([`src/${name}`,await readFile(`src/${name}`)]);
for(const name of ['index.html','manifest.webmanifest','style.css','mobile.css','dialogue.css','landscape.css'])files.push([name,await readFile(name)]);
async function collectImages(directory){
 for(const file of await readdir(directory,{withFileTypes:true})){
  const path=`${directory}/${file.name}`;
  if(file.isDirectory())await collectImages(path);
  else if(/\.(png|webp|jpe?g|gif|avif|svg)$/i.test(file.name))files.push([path,await readFile(path)]);
 }
}
await collectImages('assets');
const version=releaseFingerprint(files),bundle=`game-${version}`;
await cp('src',`dist/${bundle}`,{recursive:true});
const html=(await readFile('index.html','utf8')).replace('src/main.js',`${bundle}/main.js`).replace('href="style.css"',`href="style.css?v=${version}"`).replace('href="mobile.css"',`href="mobile.css?v=${version}"`).replace('href="dialogue.css"',`href="dialogue.css?v=${version}"`).replace('href="landscape.css"',`href="landscape.css?v=${version}"`);
await writeFile('dist/index.html',html);
await writeFile('dist/.nojekyll','');
console.log(`Static game built in dist/ (${version})`);
