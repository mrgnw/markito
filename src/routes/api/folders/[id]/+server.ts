import { json } from '@sveltejs/kit';
import { configStore } from '$lib/server/config';

export async function DELETE({ params, platform }) {
	await configStore(platform).removeFolder(params.id);
	return json({ ok: true });
}
