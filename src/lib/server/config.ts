import { readFile, writeFile, mkdir, stat } from 'node:fs/promises';
import { homedir } from 'node:os';
import { join, dirname, basename, resolve } from 'node:path';

export type Backend = 'fs' | 'r2';

export interface Folder {
	id: string;
	name: string;
	backend: Backend;
	path?: string; // fs: absolute directory
	bucket?: string; // r2: bucket name
	prefix?: string; // r2: key prefix ('' or ends with '/')
}

interface Config {
	folders: Folder[];
}

const MAX_FOLDERS = 64;

const configPath =
	process.env.MARKITO_CONFIG ??
	join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'markito', 'config.json');

function normalize(folder: Folder): Folder {
	const backend: Backend = folder.backend ?? 'fs';
	if (backend === 'r2') {
		let prefix = folder.prefix ?? '';
		if (prefix && !prefix.endsWith('/')) prefix += '/';
		return { ...folder, backend, prefix };
	}
	return { ...folder, backend };
}

async function read(): Promise<Config> {
	// Workers have no local filesystem — seed read-only folders from env JSON.
	// (UI-managed persistence on Workers is a follow-up; see todos/r2-workers-config.md)
	if (process.env.MARKITO_CONFIG_JSON) {
		try {
			const parsed = JSON.parse(process.env.MARKITO_CONFIG_JSON) as Config;
			if (Array.isArray(parsed.folders)) return { folders: parsed.folders.map(normalize) };
		} catch {
			/* fall through to file */
		}
	}
	try {
		const raw = await readFile(configPath, 'utf-8');
		const parsed = JSON.parse(raw) as Config;
		if (!Array.isArray(parsed.folders)) return { folders: [] };
		return { folders: parsed.folders.map(normalize) };
	} catch {
		return { folders: [] };
	}
}

async function write(config: Config): Promise<void> {
	await mkdir(dirname(configPath), { recursive: true });
	await writeFile(configPath, JSON.stringify(config, null, 2), 'utf-8');
}

function slug(name: string): string {
	return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '') || 'folder';
}

function uniqueId(base: string, taken: Set<string>): string {
	if (!taken.has(base)) return base;
	for (let i = 2; i < MAX_FOLDERS + 2; i++) {
		const candidate = `${base}-${i}`;
		if (!taken.has(candidate)) return candidate;
	}
	throw new Error('too many folders');
}

async function assertDir(path: string): Promise<void> {
	const info = await stat(path);
	if (!info.isDirectory()) throw new Error('not a directory');
}

// Seed fs folders passed via `--folder` CLI flags (set by bin as MARKITO_FOLDERS,
// newline-separated absolute paths). Added on startup if not already present.
async function withSeeds(config: Config): Promise<Config> {
	const seeds = (process.env.MARKITO_FOLDERS ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
	if (seeds.length === 0) return config;

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

	if (changed) await write(config);
	return config;
}

export async function getFolders(): Promise<Folder[]> {
	const config = await withSeeds(await read());
	return config.folders;
}

export async function resolveFolder(id: string): Promise<Folder | null> {
	const folders = await getFolders();
	return folders.find((f) => f.id === id) ?? null;
}

export async function addFsFolder(rawPath: string): Promise<Folder> {
	const path = resolve(rawPath);
	await assertDir(path);

	const config = await read();
	if (config.folders.length >= MAX_FOLDERS) throw new Error('too many folders');
	if (config.folders.some((f) => f.backend === 'fs' && f.path === path)) {
		throw new Error('folder already added');
	}

	const taken = new Set(config.folders.map((f) => f.id));
	const folder: Folder = {
		id: uniqueId(slug(basename(path)), taken),
		name: basename(path),
		backend: 'fs',
		path
	};
	config.folders.push(folder);
	await write(config);
	return folder;
}

export async function addR2Folder(bucket: string, prefix = '', name?: string): Promise<Folder> {
	const config = await read();
	if (config.folders.length >= MAX_FOLDERS) throw new Error('too many folders');

	const label = name?.trim() || (prefix ? `${bucket}/${prefix}` : bucket);
	const taken = new Set(config.folders.map((f) => f.id));
	const folder = normalize({
		id: uniqueId(slug(label), taken),
		name: label,
		backend: 'r2',
		bucket,
		prefix
	});
	if (
		config.folders.some(
			(f) => f.backend === 'r2' && f.bucket === folder.bucket && f.prefix === folder.prefix
		)
	) {
		throw new Error('folder already added');
	}
	config.folders.push(folder);
	await write(config);
	return folder;
}

export async function removeFolder(id: string): Promise<void> {
	const config = await read();
	config.folders = config.folders.filter((f) => f.id !== id);
	await write(config);
}
