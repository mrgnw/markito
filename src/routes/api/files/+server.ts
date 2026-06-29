import { json } from '@sveltejs/kit';
import { configStore } from '$lib/server/config';
import { getFileTree } from '$lib/server/files';
import { r2BucketFrom } from '$lib/server/r2';

export async function GET({ platform }) {
	const folders = await configStore(platform).getFolders();
	return json(await getFileTree(folders, r2BucketFrom(platform)));
}
