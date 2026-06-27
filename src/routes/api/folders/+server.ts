import { json, error } from '@sveltejs/kit';
import { getFolders, addFolder } from '$lib/server/config';

export async function GET() {
	return json(await getFolders());
}

export async function POST({ request }) {
	const { path } = await request.json();
	if (typeof path !== 'string' || !path.trim()) throw error(400, 'path required');
	try {
		return json(await addFolder(path.trim()));
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'failed to add folder');
	}
}
