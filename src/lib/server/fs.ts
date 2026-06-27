import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join, relative, resolve, sep } from 'node:path';
import type { FileEntry } from '$lib/types';
import type { Folder } from './config';

async function treeOf(dir: string, root: string, prefix: string): Promise<FileEntry[]> {
	const entries = await readdir(dir, { withFileTypes: true });
	const result: FileEntry[] = [];

	for (const entry of entries) {
		if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;

		const fullPath = join(dir, entry.name);
		const relPath = `${prefix}/${relative(root, fullPath)}`;

		if (entry.isDirectory()) {
			result.push({
				name: entry.name,
				path: relPath,
				type: 'directory',
				children: await treeOf(fullPath, root, prefix)
			});
		} else if (entry.name.endsWith('.md')) {
			result.push({ name: entry.name, path: relPath, type: 'file' });
		}
	}

	result.sort((a, b) => {
		if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
		return a.name.localeCompare(b.name);
	});
	return result;
}

export async function fsTree(folder: Folder): Promise<FileEntry[]> {
	return treeOf(folder.path!, folder.path!, folder.id);
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
