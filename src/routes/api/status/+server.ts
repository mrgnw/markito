import { json } from '@sveltejs/kit';
import { configStore } from '$lib/server/config';

// Which backend this deployment uses: 'fs' (node, local files) or 'r2'
// (Workers, R2 bucket). Drives which add-folder UI the client shows.
export async function GET({ platform }) {
	return json({ backend: configStore(platform).kind });
}
