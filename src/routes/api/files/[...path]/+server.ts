import { json, error } from '@sveltejs/kit';
import { getFileContent, saveFileContent } from '$lib/server/files';

export async function GET({ params }) {
	try {
		const content = await getFileContent(params.path);
		return json({ content });
	} catch (e) {
		throw error(404, 'File not found');
	}
}

export async function PUT({ params, request }) {
	try {
		const { content } = await request.json();
		await saveFileContent(params.path, content);
		return json({ ok: true });
	} catch (e) {
		throw error(500, 'Failed to save');
	}
}
