import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// health/smoke
app.get('/healthz', (req, res) => res.type('text/plain').send('ok'));
app.get('/hello', (req, res) => res.json({ msg: 'Hello from Cart Agent!' }));

// static splash at /
app.use(express.static(path.join(__dirname, '..', 'public')));

// DO NOT app.listen(); bootstrap will attach this app
export default app;
import 'totally-fake-package';
