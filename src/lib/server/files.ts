import { fsTree, fsRead, fsWrite } from './fs';
import { r2Tree, getObject, putObject } from './r2';
import type { R2Bucket } from '@cloudflare/workers-types';
import type { Folder } from './config';
import type { FileEntry } from '$lib/types';

export async function getFileTree(
	folders: Folder[],
	bucket: R2Bucket | undefined
): Promise<FileEntry[]> {
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

// a file path is `{folderId}/{relative/path}`
export function splitPath(path: string): { id: string; rel: string } {
	const i = path.indexOf('/');
	return i === -1 ? { id: path, rel: '' } : { id: path.slice(0, i), rel: path.slice(i + 1) };
}

export async function readContent(
	folder: Folder,
	rel: string,
	bucket: R2Bucket | undefined
): Promise<string> {
	if (folder.backend === 'r2') {
		if (!bucket) throw new Error('R2 bucket not bound');
		return getObject(bucket, (folder.prefix ?? '') + rel);
	}
	return fsRead(folder, rel);
}

export async function writeContent(
	folder: Folder,
	rel: string,
	content: string,
	bucket: R2Bucket | undefined
): Promise<void> {
	if (folder.backend === 'r2') {
		if (!bucket) throw new Error('R2 bucket not bound');
		return putObject(bucket, (folder.prefix ?? '') + rel, content);
	}
	return fsWrite(folder, rel, content);
}
