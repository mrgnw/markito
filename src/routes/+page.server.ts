import { configStore } from '$lib/server/config';
import { getFileTree } from '$lib/server/files';
import { r2BucketFrom } from '$lib/server/r2';

export async function load({ platform }) {
	const store = configStore(platform);
	const files = await getFileTree(await store.getFolders(), r2BucketFrom(platform));
	return { files, backend: store.kind };
}
