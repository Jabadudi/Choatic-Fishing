import {cp,mkdir,writeFile,readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','mobile.css','src','assets','vendor'])await cp(file,`dist/${file}`,{recursive:true});
// A new module directory prevents phones reusing older cached dependency files.
const hash=createHash('sha256');
for(const name of (await readdir('src')).filter(name=>name.endsWith('.js')).sort())hash.update(name).update(await readFile(`src/${name}`));
for(const name of ['index.html','style.css','mobile.css'])hash.update(await readFile(name));
const version=hash.digest('hex').slice(0,12),bundle=`game-${version}`;
await cp('src',`dist/${bundle}`,{recursive:true});
const html=(await readFile('index.html','utf8')).replace('src/main.js',`${bundle}/main.js`).replace('href="style.css"',`href="style.css?v=${version}"`).replace('href="mobile.css"',`href="mobile.css?v=${version}"`);
await writeFile('dist/index.html',html);
await writeFile('dist/.nojekyll','');
console.log(`Static game built in dist/ (${version})`);
