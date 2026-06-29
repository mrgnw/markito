import { getFolders, resolveFolder } from './config';
import { fsTree, fsRead, fsWrite } from './fs';
import { r2Tree, getObject, putObject } from './r2';
import type { R2Bucket } from '@cloudflare/workers-types';
import type { FileEntry } from '$lib/types';

export async function getFileTree(bucket: R2Bucket | undefined): Promise<FileEntry[]> {
	const folders = await getFolders();
	const roots: FileEntry[] = [];
	for (const folder of folders) {
		let children: FileEntry[] = [];
		try {
			if (folder.backend === 'r2') {
				children = bucket ? await r2Tree(bucket, folder) : [];
			} else {
				children = await fsTree(folder);
			}
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

export async function getFileContent(path: string, bucket: R2Bucket | undefined): Promise<string> {
	const { id, rel } = split(path);
	const folder = await resolveFolder(id);
	if (!folder) throw new Error('unknown folder');
	if (folder.backend === 'r2') {
		if (!bucket) throw new Error('R2 bucket not bound');
		return getObject(bucket, (folder.prefix ?? '') + rel);
	}
	return fsRead(folder, rel);
}

export async function saveFileContent(
	path: string,
	content: string,
	bucket: R2Bucket | undefined
): Promise<void> {
	const { id, rel } = split(path);
	const folder = await resolveFolder(id);
	if (!folder) throw new Error('unknown folder');
	if (folder.backend === 'r2') {
		if (!bucket) throw new Error('R2 bucket not bound');
		return putObject(bucket, (folder.prefix ?? '') + rel, content);
	}
	return fsWrite(folder, rel, content);
}
