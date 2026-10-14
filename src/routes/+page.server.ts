import { configStore, type Folder } from '$lib/server/config';
import { getFileTree, splitPath, readContent } from '$lib/server/files';
import { r2BucketFrom } from '$lib/server/r2';
import type { R2Bucket } from '@cloudflare/workers-types';

async function readSelected(folders: Folder[], path: string, bucket: R2Bucket | undefined) {
	const { id, rel } = splitPath(path);
	const folder = folders.find((f) => f.id === id);
	if (!folder) return null;
	return readContent(folder, rel, bucket).catch(() => null);
}

export async function load({ platform, url }) {
	const store = configStore(platform);
	const bucket = r2BucketFrom(platform);
	const folders = await store.getFolders();
	const path = url.searchParams.get('f') ?? '';
	const [files, content] = await Promise.all([
		getFileTree(folders, bucket),
		path ? readSelected(folders, path, bucket) : null
	]);
	return { files, backend: store.kind, selected: content === null ? '' : path, content: content ?? '' };
}
