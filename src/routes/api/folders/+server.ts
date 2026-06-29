import { json, error } from '@sveltejs/kit';
import { configStore } from '$lib/server/config';

export async function GET({ platform }) {
	return json(await configStore(platform).getFolders());
}

// The deployment's backend (fs on node, r2 on Workers) determines the folder
// kind — the body just carries {path} (fs) or {prefix, name} (r2).
export async function POST({ request, platform }) {
	const body = await request.json();
	try {
		return json(await configStore(platform).addFolder(body));
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'failed to add folder');
	}
}
