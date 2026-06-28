// Run with: bun scripts/test-buildtree.ts
// Pure unit test for R2 keys -> nested .md tree derivation.
import assert from 'node:assert';
import { buildTree } from '../src/lib/server/r2';

function names(entries: { name: string }[]): string[] {
	return entries.map((e) => e.name);
}

// 1. prefix stripping + nesting + .md filter + sort (dirs before files)
{
	const keys = [
		'notes/2026/jan.md',
		'notes/2026/feb.md',
		'notes/top.md',
		'notes/img.png', // non-md ignored
		'notes/' // the prefix "directory" placeholder ignored
	];
	const tree = buildTree(keys, 'notes/', 'nb');

	assert.deepEqual(names(tree), ['2026', 'top.md'], 'dirs sort before files');
	const dir = tree[0] as any;
	assert.equal(dir.type, 'directory');
	assert.equal(dir.path, 'nb/2026');
	assert.deepEqual(names(dir.children), ['feb.md', 'jan.md'], 'files sorted alphabetically');
	assert.equal(dir.children[0].path, 'nb/2026/feb.md', 'paths are folderId/relative');
	assert.equal(dir.children[0].type, 'file');

	const top = tree[1] as any;
	assert.equal(top.path, 'nb/top.md');
}

// 2. empty prefix
{
	const tree = buildTree(['a.md', 'sub/b.md'], '', 'x');
	assert.deepEqual(names(tree), ['sub', 'a.md']);
	assert.equal((tree[0] as any).children[0].path, 'x/sub/b.md');
}

// 3. keys outside the prefix are ignored
{
	const tree = buildTree(['other/a.md', 'mine/b.md'], 'mine/', 'm');
	assert.deepEqual(names(tree), ['b.md']);
}

// 4. no markdown -> empty
{
	assert.deepEqual(buildTree(['a.txt', 'b.json'], '', 'z'), []);
}

console.log('buildTree: all assertions passed');
