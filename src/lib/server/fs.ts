import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { FileEntry } from '$lib/types';
import type { Folder } from './config';

const MAX_DEPTH = 32;
const MAX_ENTRIES = 20000;

async function treeOf(
	dir: string,
	root: string,
	prefix: string,
	depth: number,
	budget: { left: number }
): Promise<FileEntry[]> {
	if (depth > MAX_DEPTH || budget.left <= 0) return [];
	const entries = await readdir(dir, { withFileTypes: true });
	budget.left -= entries.length;

	const result = (
		await Promise.all(
			entries.map(async (entry): Promise<FileEntry | null> => {
				if (entry.name.startsWith('.') || entry.name === 'node_modules') return null;
				if (entry.isSymbolicLink()) return null;

				const fullPath = join(dir, entry.name);
				const relPath = `${prefix}/${relative(root, fullPath)}`;

				if (entry.isDirectory()) {
					return {
						name: entry.name,
						path: relPath,
						type: 'directory',
						children: await treeOf(fullPath, root, prefix, depth + 1, budget)
					};
				}
				if (entry.name.endsWith('.md')) return { name: entry.name, path: relPath, type: 'file' };
				return null;
			})
		)
	).filter((e) => e !== null);

	result.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
	return result;
}

export async function fsTree(folder: Folder): Promise<FileEntry[]> {
	return treeOf(folder.path!, folder.path!, folder.id, 0, { left: MAX_ENTRIES });
}

// resolve a relative path inside the folder root, guarding against traversal
function resolveInside(folder: Folder, rel: string): string {
	const root = resolve(folder.path!);
	const full = resolve(root, rel);
	if (full !== root && !full.startsWith(root + sep)) throw new Error('path traversal');
	return full;
}

export async function fsRead(folder: Folder, rel: string): Promise<string> {
	return readFile(resolveInside(folder, rel), 'utf-8');
}

export async function fsWrite(folder: Folder, rel: string, content: string): Promise<void> {
	await writeFile(resolveInside(folder, rel), content, 'utf-8');
}
