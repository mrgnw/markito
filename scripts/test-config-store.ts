// Run with: bun scripts/test-config-store.ts
// Exercises the KV-backed config store (the Workers path) with a fake KV.
import assert from 'node:assert';
import { configStore } from '../src/lib/server/config';

function fakeKV() {
	const m = new Map<string, string>();
	return {
		async get(k: string) {
			return m.get(k) ?? null;
		},
		async put(k: string, v: string) {
			m.set(k, v);
		}
	};
}

const kv = fakeKV();
const store = configStore({ env: { CONFIG: kv } } as any);

assert.equal(store.kind, 'r2', 'KV binding => r2 deployment');
assert.deepEqual(await store.getFolders(), [], 'starts empty');

const f = await store.addFolder({ prefix: 'notes', name: 'Notes' });
assert.equal(f.backend, 'r2');
assert.equal(f.prefix, 'notes/', 'prefix normalized with trailing slash');
assert.equal(f.id, 'notes');

const folders = await store.getFolders();
assert.equal(folders.length, 1, 'folder persisted');
assert.ok((await kv.get('config'))!.includes('notes/'), 'written to KV');

await assert.rejects(() => store.addFolder({ prefix: 'notes/' }), /already added/, 'dedup by prefix');

await store.removeFolder(f.id);
assert.deepEqual(await store.getFolders(), [], 'removed');

console.log('config store (KV): all assertions passed');
