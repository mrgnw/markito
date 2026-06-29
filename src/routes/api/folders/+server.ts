import { json, error } from '@sveltejs/kit';
import { getFolders, addFsFolder, addR2Folder } from '$lib/server/config';

export async function GET() {
	return json(await getFolders());
}

export async function POST({ request, platform }) {
	// On Workers there's no persistent filesystem — config is read-only
	// (seeded via MARKITO_CONFIG_JSON). Reject rather than silently no-op into
	// the ephemeral in-memory fs. See todos/r2-workers-config.md.
	if (platform) throw error(405, 'folder config is read-only on this deployment');
	const body = await request.json();
	const backend = body.backend === 'r2' ? 'r2' : 'fs';
	try {
		if (backend === 'r2') {
			return json(await addR2Folder((body.prefix ?? '').trim(), body.name));
		}
		if (typeof body.path !== 'string' || !body.path.trim()) throw new Error('path required');
		return json(await addFsFolder(body.path.trim()));
	} catch (e) {
		throw error(400, e instanceof Error ? e.message : 'failed to add folder');
	}
}
