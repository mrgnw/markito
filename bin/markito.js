#!/usr/bin/env node
import { fileURLToPath } from 'node:url';
import { dirname, join, resolve } from 'node:path';

const argv = process.argv.slice(2);
const folders = [];
let port = process.env.PORT ?? '5179';
let config = process.env.MARKITO_CONFIG;

for (let i = 0; i < argv.length; i++) {
	const arg = argv[i];
	if (arg === '--folder' || arg === '-f') folders.push(resolve(argv[++i]));
	else if (arg === '--port' || arg === '-p') port = argv[++i];
	else if (arg === '--config' || arg === '-c') config = resolve(argv[++i]);
	else if (arg === '--help' || arg === '-h') {
		console.log(`markito — edit local markdown files in your browser

Usage: markito [options]

Options:
  -f, --folder <path>   Add a folder to edit (repeatable). Persisted to config.
  -p, --port <port>     Port to listen on (default 5179)
  -c, --config <path>   Config file (default ~/.config/markito/config.json)
  -h, --help            Show this help

Folders can also be added/removed live in the web UI.`);
		process.exit(0);
	} else {
		console.error(`Unknown argument: ${arg}`);
		process.exit(1);
	}
}

process.env.PORT = port;
process.env.HOST = process.env.HOST ?? '127.0.0.1';
if (config) process.env.MARKITO_CONFIG = config;
if (folders.length) process.env.MARKITO_FOLDERS = folders.join('\n');

const here = dirname(fileURLToPath(import.meta.url));
console.log(`markito → http://localhost:${port}`);
await import(join(here, '..', 'build', 'index.js'));
