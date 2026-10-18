import {cp,mkdir,writeFile} from 'node:fs/promises';
await mkdir('dist',{recursive:true});
for(const file of ['index.html','style.css','src','assets','vendor'])await cp(file,`dist/${file}`,{recursive:true});
await writeFile('dist/.nojekyll','');
console.log('Static game built in dist/');
