import { json } from '@sveltejs/kit';
import { r2BucketFrom } from '$lib/server/r2';

// Is an R2 bucket bound on this deployment? (true on Workers with the binding,
// false on the node build.) Drives whether the R2 add-folder UI is enabled.
export async function GET({ platform }) {
	return json({ configured: Boolean(r2BucketFrom(platform)) });
}
