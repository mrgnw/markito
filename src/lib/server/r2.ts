import { AwsClient } from 'aws4fetch';
import type { FileEntry } from '$lib/types';
import type { Folder } from './config';

export interface R2Env {
	R2_ACCOUNT_ID?: string;
	R2_ACCESS_KEY_ID?: string;
	R2_SECRET_ACCESS_KEY?: string;
}

const MAX_LIST_PAGES = 100; // bound the pagination loop (1000 keys/page -> 100k keys)

// Resolve R2 creds from the Workers platform binding (CF) or process.env (node).
export function r2EnvFrom(platform: App.Platform | undefined): R2Env {
	const env = (platform?.env ?? (typeof process !== 'undefined' ? process.env : {})) as Record<
		string,
		string | undefined
	>;
	return {
		R2_ACCOUNT_ID: env.R2_ACCOUNT_ID,
		R2_ACCESS_KEY_ID: env.R2_ACCESS_KEY_ID,
		R2_SECRET_ACCESS_KEY: env.R2_SECRET_ACCESS_KEY
	};
}

export function r2Configured(env: R2Env): boolean {
	return Boolean(env.R2_ACCOUNT_ID && env.R2_ACCESS_KEY_ID && env.R2_SECRET_ACCESS_KEY);
}

function client(env: R2Env) {
	if (!r2Configured(env)) {
		throw new Error('R2 not configured (set R2_ACCOUNT_ID, R2_ACCESS_KEY_ID, R2_SECRET_ACCESS_KEY)');
	}
	const aws = new AwsClient({
		accessKeyId: env.R2_ACCESS_KEY_ID!,
		secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
		region: 'auto',
		service: 's3'
	});
	return { aws, base: `https://${env.R2_ACCOUNT_ID}.r2.cloudflarestorage.com` };
}

function decodeXml(s: string): string {
	return s
		.replace(/&amp;/g, '&')
		.replace(/&lt;/g, '<')
		.replace(/&gt;/g, '>')
		.replace(/&quot;/g, '"')
		.replace(/&apos;/g, "'");
}

// keys keep '/' but each segment is percent-encoded for the request URL
function encodeKey(key: string): string {
	return key.split('/').map(encodeURIComponent).join('/');
}

export async function listBuckets(env: R2Env): Promise<string[]> {
	const { aws, base } = client(env);
	const res = await aws.fetch(`${base}/`);
	if (!res.ok) throw new Error(`R2 listBuckets failed (${res.status})`);
	const xml = await res.text();
	return [...xml.matchAll(/<Bucket>[\s\S]*?<Name>([^<]+)<\/Name>[\s\S]*?<\/Bucket>/g)].map((m) =>
		decodeXml(m[1])
	);
}

async function listKeys(env: R2Env, bucket: string, prefix: string): Promise<string[]> {
	const { aws, base } = client(env);
	const keys: string[] = [];
	let token: string | undefined;
	for (let page = 0; page < MAX_LIST_PAGES; page++) {
		const url = new URL(`${base}/${encodeURIComponent(bucket)}`);
		url.searchParams.set('list-type', '2');
		if (prefix) url.searchParams.set('prefix', prefix);
		if (token) url.searchParams.set('continuation-token', token);
		const res = await aws.fetch(url.toString());
		if (!res.ok) throw new Error(`R2 list failed (${res.status})`);
		const xml = await res.text();
		for (const m of xml.matchAll(/<Key>([^<]+)<\/Key>/g)) keys.push(decodeXml(m[1]));
		if (!/<IsTruncated>true<\/IsTruncated>/.test(xml)) break;
		token = xml.match(/<NextContinuationToken>([^<]+)<\/NextContinuationToken>/)?.[1];
		if (!token) break;
	}
	return keys;
}

export async function getObject(env: R2Env, bucket: string, key: string): Promise<string> {
	const { aws, base } = client(env);
	const res = await aws.fetch(`${base}/${encodeURIComponent(bucket)}/${encodeKey(key)}`);
	if (res.status === 404) throw new Error('not found');
	if (!res.ok) throw new Error(`R2 get failed (${res.status})`);
	return res.text();
}

export async function putObject(
	env: R2Env,
	bucket: string,
	key: string,
	content: string
): Promise<void> {
	const { aws, base } = client(env);
	const res = await aws.fetch(`${base}/${encodeURIComponent(bucket)}/${encodeKey(key)}`, {
		method: 'PUT',
		body: content,
		headers: { 'Content-Type': 'text/markdown; charset=utf-8' }
	});
	if (!res.ok) throw new Error(`R2 put failed (${res.status})`);
}

export async function r2Tree(env: R2Env, folder: Folder): Promise<FileEntry[]> {
	const prefix = folder.prefix ?? '';
	const keys = await listKeys(env, folder.bucket!, prefix);
	return buildTree(keys, prefix, folder.id);
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
