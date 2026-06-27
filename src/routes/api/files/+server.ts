import { json } from '@sveltejs/kit';
import { getFileTree } from '$lib/server/files';

export async function GET() {
	const tree = await getFileTree();
	return json(tree);
}
