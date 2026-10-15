import {readFile} from 'node:fs/promises';
import {evaluate} from './evaluate.mjs';
try {
  if (process.argv.length !== 3) throw new Error('Usage: node clipping-engine/cli.mjs INPUT.json');
  const text = await readFile(process.argv[2], 'utf8');
  if (Buffer.byteLength(text) > 2_000_000) throw new Error('Input exceeds 2 MB');
  process.stdout.write(JSON.stringify(evaluate(JSON.parse(text)),null,2)+'\n');
} catch(e) { process.stderr.write(e.message+'\n'); process.exitCode=1; }
