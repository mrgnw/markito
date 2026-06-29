import { json, error } from '@sveltejs/kit';
import { removeFolder } from '$lib/server/config';

export async function DELETE({ params, platform }) {
	// read-only config on Workers (no persistent fs) — see api/folders POST
	if (platform) throw error(405, 'folder config is read-only on this deployment');
	await removeFolder(params.id);
	return json({ ok: true });
}
