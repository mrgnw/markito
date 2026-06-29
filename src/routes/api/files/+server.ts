import { json } from '@sveltejs/kit';
import { getFileTree } from '$lib/server/files';
import { r2BucketFrom } from '$lib/server/r2';

export async function GET({ platform }) {
	return json(await getFileTree(r2BucketFrom(platform)));
}
