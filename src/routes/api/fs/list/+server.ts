import { json } from '@sveltejs/kit';
import { readdir } from 'node:fs/promises';
import { homedir } from 'node:os';
import { resolve } from 'node:path';

function expand(p: string): string {
	if (p === '~' || p.startsWith('~/')) return resolve(homedir(), p.slice(p === '~' ? 1 : 2));
	return resolve(p);
}

// Immediate subdirectories of `path` (names only), for the add-local-folder
// typeahead. Hidden dirs excluded; sorted. Unreadable path -> empty list.
export async function GET({ url }) {
	const root = expand(url.searchParams.get('path') ?? '~');
	let dirs: string[] = [];
	try {
		const entries = await readdir(root, { withFileTypes: true });
		dirs = entries
			.filter((e) => e.isDirectory() && !e.name.startsWith('.'))
			.map((e) => e.name)
			.sort();
	} catch {
		/* unreadable -> empty */
	}
	return json({ path: root, dirs });
}
