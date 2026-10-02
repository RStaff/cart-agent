import http from 'node:http';
import {pathToFileURL} from 'node:url';
import {evaluate} from './evaluate.mjs';
export function createServer(input) {
  // Input provider is local-only; request cannot supply a path or URL.
  return http.createServer(async(req,res) => {
    res.setHeader('Content-Type','application/json');
    res.setHeader('Cache-Control','no-store');
    if (req.method !== 'GET') {res.writeHead(405,{Allow:'GET'});res.end(JSON.stringify({error:'method_not_allowed'}));return;}
    if (req.url === '/health') {res.end(JSON.stringify({ok:true,service:'clipping-evaluation',mode:'assumptions_only'}));return;}
    if (req.url !== '/v1/evaluation') {res.writeHead(404);res.end(JSON.stringify({error:'not_found'}));return;}
    try {res.end(JSON.stringify(evaluate(await input())));}
    catch {res.writeHead(503);res.end(JSON.stringify({error:'evaluation_unavailable',actualReceivedRevenueUsd:null}));}
  });
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const {readFile} = await import('node:fs/promises');
  const file = process.argv[2];
  const port = Number(process.env.CLIPPING_PORT || 8789);
  if (!file || !Number.isInteger(port) || port<1 || port>65535) {
    process.stderr.write('Usage: node clipping-engine/server.mjs INPUT.json (optional CLIPPING_PORT)\n');process.exitCode=1;
  } else {
    const server = createServer(async()=> {
      const raw = await readFile(file,'utf8');
      if (Buffer.byteLength(raw)>2_000_000) throw new Error('Input exceeds 2 MB');
      return JSON.parse(raw);
    });
    server.on('error',e=>{process.stderr.write(e.message+'\n');process.exitCode=1;});
    server.listen(port,'127.0.0.1',()=>process.stdout.write(`Local read-only scenario API: http://127.0.0.1:${port}/v1/evaluation\n`));
  }
}
