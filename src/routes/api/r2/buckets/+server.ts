import { json, error } from '@sveltejs/kit';
import { listBuckets, r2EnvFrom, r2Configured } from '$lib/server/r2';

export async function GET({ platform }) {
	const env = r2EnvFrom(platform);
	if (!r2Configured(env)) return json({ configured: false, buckets: [] });
	try {
		return json({ configured: true, buckets: await listBuckets(env) });
	} catch (e) {
		throw error(502, e instanceof Error ? e.message : 'failed to list buckets');
	}
}
