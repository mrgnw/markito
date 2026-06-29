import { json, error } from '@sveltejs/kit';
import { configStore } from '$lib/server/config';
import { splitPath, readContent, writeContent } from '$lib/server/files';
import { r2BucketFrom } from '$lib/server/r2';

export async function GET({ params, platform }) {
	const { id, rel } = splitPath(params.path);
	const folder = await configStore(platform).resolveFolder(id);
	if (!folder) throw error(404, 'File not found');
	try {
		const content = await readContent(folder, rel, r2BucketFrom(platform));
		return json({ content });
	} catch {
		throw error(404, 'File not found');
	}
}

export async function PUT({ params, request, platform }) {
	const { id, rel } = splitPath(params.path);
	const folder = await configStore(platform).resolveFolder(id);
	if (!folder) throw error(404, 'File not found');
	try {
		const { content } = await request.json();
		await writeContent(folder, rel, content, r2BucketFrom(platform));
		return json({ ok: true });
	} catch {
		throw error(500, 'Failed to save');
	}
}
