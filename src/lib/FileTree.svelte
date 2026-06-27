<script lang="ts">
	import type { FileEntry } from './types';

	let {
		entries,
		selected = '',
		onselect,
		onremove,
		depth = 0
	}: {
		entries: FileEntry[];
		selected?: string;
		onselect?: (path: string) => void;
		onremove?: (id: string) => void;
		depth?: number;
	} = $props();

	let collapsed: Record<string, boolean> = $state({});

	function toggle(path: string) {
		collapsed[path] = !collapsed[path];
	}
</script>

<ul class="tree" style="--depth: {depth}">
	{#each entries as entry}
		<li>
			{#if entry.type === 'directory'}
				<div class="dir-row" class:root={depth === 0}>
					<button class="dir" onclick={() => toggle(entry.path)}>
						<span class="icon">{collapsed[entry.path] ? '▸' : '▾'}</span>
						{entry.name}
					</button>
					{#if depth === 0 && onremove}
						<button class="remove" title="Remove folder" onclick={() => onremove(entry.path)}>×</button>
					{/if}
				</div>
				{#if !collapsed[entry.path] && entry.children}
					<svelte:self
						entries={entry.children}
						{selected}
						{onselect}
						depth={depth + 1}
					/>
				{/if}
			{:else}
				<button
					class="file"
					class:active={selected === entry.path}
					onclick={() => onselect?.(entry.path)}
				>
					{entry.name}
				</button>
			{/if}
		</li>
	{/each}
</ul>

<style>
	ul {
		list-style: none;
		padding: 0;
		margin: 0;
		padding-left: calc(var(--depth) * 0.75rem);
	}
	li {
		margin: 0;
	}
	button {
		display: block;
		width: 100%;
		text-align: left;
		background: none;
		border: none;
		padding: 0.35rem 0.75rem;
		cursor: pointer;
		font-size: 0.85rem;
		color: #c9d1d9;
		border-radius: 4px;
		font-family: inherit;
	}
	button:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.dir-row {
		display: flex;
		align-items: center;
	}
	.dir-row .dir {
		flex: 1;
		min-width: 0;
	}
	.dir-row.root .dir {
		text-transform: uppercase;
		font-size: 0.72rem;
		letter-spacing: 0.04em;
	}
	.remove {
		width: auto;
		flex: 0 0 auto;
		color: #6e7681;
		padding: 0.35rem 0.6rem;
		font-size: 1rem;
		line-height: 1;
		opacity: 0;
	}
	.dir-row:hover .remove {
		opacity: 1;
	}
	.remove:hover {
		color: #f85149;
	}
	.dir {
		font-weight: 600;
		color: #8b949e;
	}
	.icon {
		display: inline-block;
		width: 1em;
		font-size: 0.75em;
	}
	.file.active {
		background: rgba(56, 139, 253, 0.15);
		color: #58a6ff;
	}
</style>
