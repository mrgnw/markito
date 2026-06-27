import { json } from '@sveltejs/kit';
import { removeFolder } from '$lib/server/config';

export async function DELETE({ params }) {
	await removeFolder(params.id);
	return json({ ok: true });
}
