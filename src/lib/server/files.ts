import { getFolders, resolveFolder } from './config';
import { fsTree, fsRead, fsWrite } from './fs';
import { r2Tree, getObject, putObject, type R2Env } from './r2';
import type { FileEntry } from '$lib/types';

export async function getFileTree(env: R2Env): Promise<FileEntry[]> {
	const folders = await getFolders();
	const roots: FileEntry[] = [];
	for (const folder of folders) {
		let children: FileEntry[] = [];
		try {
			children = folder.backend === 'r2' ? await r2Tree(env, folder) : await fsTree(folder);
		} catch {
			// a misconfigured/unreachable folder shouldn't break the whole tree
			children = [];
		}
		roots.push({ name: folder.name, path: folder.id, type: 'directory', children });
	}
	return roots;
}

// path is `{folderId}/{relative/path}`
function split(path: string): { id: string; rel: string } {
	const i = path.indexOf('/');
	return i === -1 ? { id: path, rel: '' } : { id: path.slice(0, i), rel: path.slice(i + 1) };
}

export async function getFileContent(path: string, env: R2Env): Promise<string> {
	const { id, rel } = split(path);
	const folder = await resolveFolder(id);
	if (!folder) throw new Error('unknown folder');
	if (folder.backend === 'r2') return getObject(env, folder.bucket!, (folder.prefix ?? '') + rel);
	return fsRead(folder, rel);
}

export async function saveFileContent(path: string, content: string, env: R2Env): Promise<void> {
	const { id, rel } = split(path);
	const folder = await resolveFolder(id);
	if (!folder) throw new Error('unknown folder');
	if (folder.backend === 'r2') {
		return putObject(env, folder.bucket!, (folder.prefix ?? '') + rel, content);
	}
	return fsWrite(folder, rel, content);
}
