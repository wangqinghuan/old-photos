import http from 'http';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(fs.readFileSync(path.join(__dirname,'docs','data','catalog.json')));
const full = JSON.parse(fs.readFileSync(path.join(__dirname,'docs','data','photos-full.json')));
http.createServer((req,res)=>{
  const url = new URL(req.url, 'http://localhost');
  if (url.pathname === '/api/photos') {
    const pg = parseInt(url.searchParams.get('page'))||1;
    const lm = Math.min(parseInt(url.searchParams.get('limit'))||20,100);
    const st = (pg-1)*lm;
    res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    res.end(JSON.stringify({items:catalog.slice(st,st+lm),hasMore:st+lm<catalog.length,total:catalog.length}));
    return;
  }
  const m = url.pathname.match(/^\/api\/photo\/(.+)$/);
  if (m) {
    const ph = full.find(x=>x.id===m[1]);
    if (!ph) { res.writeHead(404); res.end('{}'); return; }
    res.writeHead(200,{'Content-Type':'application/json','Access-Control-Allow-Origin':'*'});
    res.end(JSON.stringify(ph)); return;
  }
  const fp = path.join(__dirname,'docs',url.pathname==='/'?'index.html':url.pathname);
  const ext = path.extname(fp);
  const t = {'.html':'text/html','.jpeg':'image/jpeg','.jpg':'image/jpeg','.png':'image/png','.json':'application/json'};
  fs.readFile(fp,(e,d)=>{if(e){res.writeHead(404);res.end('');return;}res.writeHead(200,{'Content-Type':t[ext]||'text/plain'});res.end(d);});
}).listen(8787,'0.0.0.0',()=>console.log('RUNNING'));
