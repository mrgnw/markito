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
		host: process.env.HOST ?? '127.0.0.1',
		port: 5179,
		allowedHosts: (process.env.MARKITO_ALLOWED_HOSTS ?? 'localhost').split(',')
	}
});
