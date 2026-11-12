// Run with: bun scripts/test-start-bind.ts (needs `bun run build` first)
// The documented start path must listen on loopback only unless HOST opts in.
import assert from 'node:assert';
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync } from 'node:fs';
import net from 'node:net';
import { networkInterfaces, tmpdir } from 'node:os';
import { join } from 'node:path';

const root = join(import.meta.dirname, '..');
const pkg = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
assert.equal(pkg.scripts.start, 'node bin/markito.js', 'start must go through the CLI');

const lanAddress = Object.values(networkInterfaces())
	.flat()
	.find((i) => i && i.family === 'IPv4' && !i.internal)?.address;

function canConnect(host: string, port: number): Promise<boolean> {
	return new Promise((resolve) => {
		const socket = net.connect({ host, port, timeout: 1000 });
		socket.on('connect', () => (socket.destroy(), resolve(true)));
		socket.on('error', () => resolve(false));
		socket.on('timeout', () => (socket.destroy(), resolve(false)));
	});
}

async function waitUntilListening(port: number) {
	for (let i = 0; i < 50; i++) {
		if (await canConnect('127.0.0.1', port)) return;
		await new Promise((r) => setTimeout(r, 200));
	}
	throw new Error(`server did not start on ${port}`);
}

async function lanReachable(port: number, host?: string): Promise<boolean> {
	const env = { ...process.env, PORT: String(port), MARKITO_CONFIG: join(mkdtempSync(join(tmpdir(), 'markito-')), 'c.json') };
	delete env.HOST;
	if (host) env.HOST = host;
	const server = spawn('node', [join(root, 'bin', 'markito.js')], { env, stdio: 'ignore' });
	try {
		await waitUntilListening(port);
		return await canConnect(lanAddress!, port);
	} finally {
		server.kill();
	}
}

if (!lanAddress) {
	console.log('start bind: no non-loopback interface, skipped the reachability check');
} else {
	assert.equal(await lanReachable(5392), false, 'default start must not be reachable on the LAN address');
	assert.equal(await lanReachable(5393, '0.0.0.0'), true, 'HOST=0.0.0.0 must opt in');
}
console.log('start bind: all assertions passed');
