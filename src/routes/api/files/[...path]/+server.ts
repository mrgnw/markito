import { json, error } from '@sveltejs/kit';
import { getFileContent, saveFileContent } from '$lib/server/files';
import { r2EnvFrom } from '$lib/server/r2';

export async function GET({ params, platform }) {
	try {
		const content = await getFileContent(params.path, r2EnvFrom(platform));
		return json({ content });
	} catch {
		throw error(404, 'File not found');
	}
}

export async function PUT({ params, request, platform }) {
	try {
		const { content } = await request.json();
		await saveFileContent(params.path, content, r2EnvFrom(platform));
		return json({ ok: true });
	} catch {
		throw error(500, 'Failed to save');
	}
}
