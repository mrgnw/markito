import { sveltekit } from '@sveltejs/kit/vite';
import { defineConfig } from 'vite';
import { execSync } from 'node:child_process';
import { readFileSync } from 'node:fs';

const commit = execSync('git rev-parse --short HEAD').toString().trim();
const pkg = JSON.parse(readFileSync('package.json', 'utf-8'));

export default defineConfig({
	plugins: [sveltekit()],
	define: {
		__VERSION__: JSON.stringify({ version: pkg.version, commit, built: new Date().toISOString() })
	},
	server: {
		host: '0.0.0.0',
		port: 5179,
		allowedHosts: ['.example.ts.net', '.example.com', 'localhost']
	}
});
