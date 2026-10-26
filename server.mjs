import http from 'node:http';
import {readFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('.',import.meta.url));
const port=Number(process.env.PORT)||5173;
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.mp4':'video/mp4','.png':'image/png','.svg':'image/svg+xml'};
http.createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname);const file=path.resolve(root,'.'+(pathname.endsWith('/')?pathname+'index.html':pathname));if(!file.startsWith(root))throw Error('Forbidden');const data=await readFile(file),type=mime[path.extname(file)]||'application/octet-stream';
 // Byte ranges let browsers seek in video, and Safari needs them to play video at all.
 const range=/^bytes=(\d*)-(\d*)$/.exec(req.headers.range||'');
 if(range&&(range[1]||range[2])){const start=range[1]?Number(range[1]):Math.max(0,data.length-Number(range[2])),end=range[1]&&range[2]?Math.min(Number(range[2]),data.length-1):data.length-1;if(start>end||start>=data.length){res.writeHead(416,{'Content-Range':`bytes */${data.length}`});res.end();return;}res.writeHead(206,{'Content-Type':type,'Accept-Ranges':'bytes','Content-Range':`bytes ${start}-${end}/${data.length}`,'Content-Length':end-start+1});res.end(data.subarray(start,end+1));return;}
 res.writeHead(200,{'Content-Type':type,'Accept-Ranges':'bytes'});res.end(data);}catch{res.writeHead(404);res.end('Not found');}}).listen(port,'127.0.0.1',()=>console.log(`Local: http://127.0.0.1:${port}`));
