import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const serverPath = path.join(__dirname, '..', 'api', 'server.js');

if (!fs.existsSync(serverPath)) {
  console.error('❌ api/server.js not found at', serverPath);
  process.exit(1);
}

let text = fs.readFileSync(serverPath, 'utf8');

if (text.includes('/health')) {
  console.log('✅ /health route already present in api/server.js – no changes.');
  process.exit(0);
}

console.log('➡️ Adding /health route to api/server.js …');

const snippet = `

app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'cart-agent-api' });
});
`;

// Try to insert right after "const app = express"
const marker = 'const app = express';
const idx = text.indexOf(marker);

let newText;
if (idx !== -1) {
  const insertPos = text.indexOf('\\n', idx);
  if (insertPos === -1) {
    newText = text + snippet;
  } else {
    newText =
      text.slice(0, insertPos + 1) +
      snippet +
      text.slice(insertPos + 1);
  }
} else {
  console.warn("⚠️ Could not find 'const app = express' – appending /health to end of file.");
  newText = text.trimEnd() + '\\n' + snippet + '\\n';
}

fs.writeFileSync(serverPath, newText, 'utf8');
console.log('✅ /health route written to', serverPath);
