import { cpSync, existsSync, mkdirSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const src = path.resolve(__dirname, '../node_modules/onnxruntime-web/dist');
const dest = path.resolve(__dirname, '../public/onnxruntime-web');

if (!existsSync(src)) {
  console.warn('onnxruntime-web/dist not found, skipping WASM asset copy.');
  process.exit(0);
}

mkdirSync(dest, { recursive: true });
cpSync(src, dest, { recursive: true });
console.log(`Copied onnxruntime-web WASM assets to ${dest}`);
