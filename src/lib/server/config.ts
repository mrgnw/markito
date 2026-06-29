import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';
import type { KVNamespace } from '@cloudflare/workers-types';

export type Backend = 'fs' | 'r2';

export interface Folder {
	id: string;
	name: string;
	backend: Backend;
	path?: string; // fs: absolute directory
	prefix?: string; // r2: key prefix in the bound bucket ('' or ends with '/')
}

interface Config {
	folders: Folder[];
}

const MAX_FOLDERS = 64;

const fsConfigPath =
	process.env.MARKITO_CONFIG ??
	join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'markito', 'config.json');

// ---------- persistence backends ----------

async function fsLoad(): Promise<Config> {
	try {
		return JSON.parse(await readFile(fsConfigPath, 'utf-8'));
	} catch {
		return { folders: [] };
	}
}

async function fsSave(config: Config): Promise<void> {
	await mkdir(dirname(fsConfigPath), { recursive: true });
	await writeFile(fsConfigPath, JSON.stringify(config, null, 2), 'utf-8');
}

async function kvLoad(kv: KVNamespace): Promise<Config> {
	const raw = await kv.get('config');
	if (!raw) return { folders: [] };
	try {
		return JSON.parse(raw);
	} catch {
		return { folders: [] };
	}
}

async function kvSave(kv: KVNamespace, config: Config): Promise<void> {
	await kv.put('config', JSON.stringify(config));
}

// ---------- helpers ----------

function normalize(folder: Folder): Folder {
	const backend: Backend = folder.backend ?? 'fs';
	if (backend === 'r2') {
		let prefix = folder.prefix ?? '';
		if (prefix && !prefix.endsWith('/')) prefix += '/';
		return { ...folder, backend, prefix };
	}
	return { ...folder, backend };
}

function slug(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'folder';
}

function uniqueId(base: string, taken: Set<string>): string {
	if (!taken.has(base)) return base;
	for (let i = 2; i < MAX_FOLDERS + 2; i++) {
		if (!taken.has(`${base}-${i}`)) return `${base}-${i}`;
	}
	throw new Error('too many folders');
}

async function assertDir(path: string): Promise<void> {
	const info = await stat(path);
	if (!info.isDirectory()) throw new Error('not a directory');
}

// Seed fs folders from `--folder` CLI flags (set by bin as MARKITO_FOLDERS).
// node/fs deployment only. Returns true if it added any.
async function applySeeds(config: Config): Promise<boolean> {
	const seeds = (process.env.MARKITO_FOLDERS ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
	if (!seeds.length) return false;
	const existing = new Set(config.folders.filter((f) => f.backend === 'fs').map((f) => f.path));
	const taken = new Set(config.folders.map((f) => f.id));
	let changed = false;
	for (const raw of seeds) {
		const path = resolve(raw);
		if (existing.has(path)) continue;
		try {
			await assertDir(path);
		} catch {
			continue;
		}
		const id = uniqueId(slug(basename(path)), taken);
		taken.add(id);
		existing.add(path);
		config.folders.push({ id, name: basename(path), backend: 'fs', path });
		changed = true;
	}
	return changed;
}

// ---------- store ----------

export interface MarkitoStore {
	readonly kind: Backend;
	getFolders(): Promise<Folder[]>;
	resolveFolder(id: string): Promise<Folder | null>;
	addFolder(input: { path?: string; prefix?: string; name?: string }): Promise<Folder>;
	removeFolder(id: string): Promise<void>;
}

function makeStore(
	kind: Backend,
	load: () => Promise<Config>,
	save: (c: Config) => Promise<void>,
	seed: boolean
): MarkitoStore {
	async function read(): Promise<Config> {
		const config = await load();
		if (!Array.isArray(config.folders)) return { folders: [] };
		config.folders = config.folders.map(normalize);
		if (seed && (await applySeeds(config))) await save(config);
		return config;
	}

	return {
		kind,
		async getFolders() {
			return (await read()).folders;
		},
		async resolveFolder(id) {
			return (await read()).folders.find((f) => f.id === id) ?? null;
		},
		async addFolder(input) {
			const config = await read();
			if (config.folders.length >= MAX_FOLDERS) throw new Error('too many folders');
			const taken = new Set(config.folders.map((f) => f.id));
			let folder: Folder;
			if (kind === 'fs') {
				if (!input.path?.trim()) throw new Error('path required');
				const path = resolve(input.path.trim());
				await assertDir(path);
				if (config.folders.some((f) => f.backend === 'fs' && f.path === path)) {
					throw new Error('folder already added');
				}
				folder = { id: uniqueId(slug(basename(path)), taken), name: basename(path), backend: 'fs', path };
			} else {
				const { prefix } = normalize({ id: '', name: '', backend: 'r2', prefix: input.prefix ?? '' });
				if (config.folders.some((f) => f.backend === 'r2' && f.prefix === prefix)) {
					throw new Error('folder already added');
				}
				const label = input.name?.trim() || (prefix ?? '').replace(/\/$/, '') || 'r2';
				folder = { id: uniqueId(slug(label), taken), name: label, backend: 'r2', prefix };
			}
			config.folders.push(folder);
			await save(config);
			return folder;
		},
		async removeFolder(id) {
			const config = await read();
			config.folders = config.folders.filter((f) => f.id !== id);
			await save(config);
		}
	};
}

// fs on node; KV on Workers (whichever binding exists). This is the single
// switch between the two deployment "adapters".
export function configStore(platform: App.Platform | undefined): MarkitoStore {
	const kv = platform?.env?.CONFIG;
	if (kv) return makeStore('r2', () => kvLoad(kv), (c) => kvSave(kv, c), false);
	return makeStore('fs', fsLoad, fsSave, true);
}
