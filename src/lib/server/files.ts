import { readdir, readFile, writeFile } from 'fs/promises';
import { join, relative, resolve, sep } from 'path';
import { getFolders, resolveFolder } from './config';
import type { FileEntry } from '$lib/types';

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

export async function getFileTree(): Promise<FileEntry[]> {
	const folders = await getFolders();
	const roots: FileEntry[] = [];
	for (const folder of folders) {
		roots.push({
			name: folder.name,
			path: folder.id,
			type: 'directory',
			children: await treeOf(folder.path, folder.path, folder.id)
		});
	}
	return roots;
}

// A path is `{folderId}/{relative/path}`. Resolve it to an absolute path,
// asserting it stays inside the folder's root (no traversal).
async function resolvePath(filePath: string): Promise<string> {
	const slash = filePath.indexOf('/');
	const id = slash === -1 ? filePath : filePath.slice(0, slash);
	const rel = slash === -1 ? '' : filePath.slice(slash + 1);

	const folder = await resolveFolder(id);
	if (!folder) throw new Error('unknown folder');

	const root = resolve(folder.path);
	const full = resolve(root, rel);
	if (full !== root && !full.startsWith(root + sep)) throw new Error('path traversal');
	return full;
}

export async function getFileContent(filePath: string): Promise<string> {
	return readFile(await resolvePath(filePath), 'utf-8');
}

export async function saveFileContent(filePath: string, content: string): Promise<void> {
	await writeFile(await resolvePath(filePath), content, 'utf-8');
}
