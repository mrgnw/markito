import { readFile, writeFile, mkdir, stat } from 'fs/promises';
import { homedir } from 'os';
import { join, dirname, basename, resolve } from 'path';

export interface Folder {
	id: string;
	name: string;
	path: string;
}

interface Config {
	folders: Folder[];
}

const MAX_FOLDERS = 64;

const configPath =
	process.env.EDITH_CONFIG ??
	join(process.env.XDG_CONFIG_HOME ?? join(homedir(), '.config'), 'edith', 'config.json');

async function read(): Promise<Config> {
	try {
		const raw = await readFile(configPath, 'utf-8');
		const parsed = JSON.parse(raw) as Config;
		if (!Array.isArray(parsed.folders)) return { folders: [] };
		return parsed;
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

// Seed folders passed via `--folder` CLI flags (set by bin as EDITH_FOLDERS,
// newline-separated absolute paths). Added on startup if not already present.
async function withSeeds(config: Config): Promise<Config> {
	const seeds = (process.env.EDITH_FOLDERS ?? '').split('\n').map((s) => s.trim()).filter(Boolean);
	if (seeds.length === 0) return config;

	const existing = new Set(config.folders.map((f) => f.path));
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
		config.folders.push({ id, name: basename(path), path });
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

export async function addFolder(rawPath: string): Promise<Folder> {
	const path = resolve(rawPath);
	await assertDir(path);

	const config = await read();
	if (config.folders.length >= MAX_FOLDERS) throw new Error('too many folders');
	if (config.folders.some((f) => f.path === path)) throw new Error('folder already added');

	const taken = new Set(config.folders.map((f) => f.id));
	const folder: Folder = { id: uniqueId(slug(basename(path)), taken), name: basename(path), path };
	config.folders.push(folder);
	await write(config);
	return folder;
}

export async function removeFolder(id: string): Promise<void> {
	const config = await read();
	config.folders = config.folders.filter((f) => f.id !== id);
	await write(config);
}
