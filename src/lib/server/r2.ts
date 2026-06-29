import type { R2Bucket } from '@cloudflare/workers-types';
import type { FileEntry } from '$lib/types';
import type { Folder } from './config';

const MAX_LIST_PAGES = 100; // bound the pagination loop (1000 keys/page -> 100k keys)

// The single bound R2 bucket (Workers only). Undefined on the node build.
export function r2BucketFrom(platform: App.Platform | undefined): R2Bucket | undefined {
	return platform?.env?.BUCKET;
}

async function listKeys(bucket: R2Bucket, prefix: string): Promise<string[]> {
	const keys: string[] = [];
	let cursor: string | undefined;
	for (let page = 0; page < MAX_LIST_PAGES; page++) {
		const res = await bucket.list({ prefix: prefix || undefined, cursor, limit: 1000 });
		for (const obj of res.objects) keys.push(obj.key);
		if (!res.truncated) break;
		cursor = res.cursor;
		if (!cursor) break;
	}
	return keys;
}

export async function r2Tree(bucket: R2Bucket, folder: Folder): Promise<FileEntry[]> {
	const prefix = folder.prefix ?? '';
	const keys = await listKeys(bucket, prefix);
	return buildTree(keys, prefix, folder.id);
}

export async function getObject(bucket: R2Bucket, key: string): Promise<string> {
	const obj = await bucket.get(key);
	if (!obj) throw new Error('not found');
	return obj.text();
}

export async function putObject(bucket: R2Bucket, key: string, content: string): Promise<void> {
	await bucket.put(key, content);
}

// Pure: turn flat R2 object keys into a nested .md file tree. Unit-tested.
export function buildTree(keys: string[], prefix: string, folderId: string): FileEntry[] {
	interface Node {
		dirs: Map<string, Node>;
		files: Set<string>;
	}
	const root: Node = { dirs: new Map(), files: new Set() };

	for (const key of keys) {
		if (!key.endsWith('.md')) continue;
		if (prefix && !key.startsWith(prefix)) continue;
		const rel = key.slice(prefix.length);
		if (!rel || rel.endsWith('/')) continue;
		const parts = rel.split('/');
		let node = root;
		for (let i = 0; i < parts.length - 1; i++) {
			const dir = parts[i];
			let child = node.dirs.get(dir);
			if (!child) {
				child = { dirs: new Map(), files: new Set() };
				node.dirs.set(dir, child);
			}
			node = child;
		}
		node.files.add(parts[parts.length - 1]);
	}

	function toEntries(node: Node, rel: string): FileEntry[] {
		const entries: FileEntry[] = [];
		for (const [name, child] of node.dirs) {
			const childRel = rel ? `${rel}/${name}` : name;
			entries.push({
				name,
				path: `${folderId}/${childRel}`,
				type: 'directory',
				children: toEntries(child, childRel)
			});
		}
		for (const name of node.files) {
			const childRel = rel ? `${rel}/${name}` : name;
			entries.push({ name, path: `${folderId}/${childRel}`, type: 'file' });
		}
		entries.sort((a, b) => {
			if (a.type !== b.type) return a.type === 'directory' ? -1 : 1;
			return a.name.localeCompare(b.name);
		});
		return entries;
	}

	return toEntries(root, '');
}
