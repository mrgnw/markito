<script lang="ts">
	import { tick } from 'svelte';

	// Backend-agnostic: `list` is injected, so the same component works behind a
	// SvelteKit route, a Rust/axum server, or a Tauri `invoke` — anything that
	// returns { path, dirs }. This is what makes it extractable into a package.
	let {
		list,
		onpick,
		start = '~'
	}: {
		list: (path: string) => Promise<{ path: string; dirs: string[] }>;
		onpick: (path: string) => void;
		start?: string;
	} = $props();

	// `dir` is the directory being browsed; `query` filters the folders shown
	// live as you type. Clicking a folder picks it; the chevron descends into it.
	// svelte-ignore state_referenced_locally
	let dir = $state(start);
	let folders = $state<string[]>([]);
	let query = $state('');
	let inputEl = $state<HTMLInputElement | null>(null);

	const filtered = $derived(
		folders.filter((f) => f.toLowerCase().includes(query.trim().toLowerCase()))
	);

	const crumbs = $derived.by(() => {
		const parts = dir.replace(/\/$/, '').split('/');
		let acc = '';
		return parts.map((p, i) => {
			acc = i === 0 ? p || '/' : `${acc.replace(/\/$/, '')}/${p}`;
			return { label: p || '/', path: acc };
		});
	});

	async function browse(path: string) {
		const d = await list(path);
		dir = d.path ?? path;
		folders = d.dirs ?? [];
	}

	async function goto(path: string) {
		query = '';
		await browse(path);
		await tick();
		inputEl?.focus();
	}

	async function descend(name: string) {
		query = '';
		await browse(`${dir.replace(/\/$/, '')}/${name}`);
		await tick();
		inputEl?.focus();
	}

	function pick(name: string) {
		onpick(`${dir.replace(/\/$/, '')}/${name}`);
	}

	// svelte-ignore state_referenced_locally
	browse(start);
</script>

<div class="picker">
	<!-- svelte-ignore a11y_autofocus -->
	<input
		bind:this={inputEl}
		bind:value={query}
		placeholder="filter folders…"
		aria-label="filter folders"
		autocomplete="off"
		autocapitalize="off"
		spellcheck="false"
		autofocus
	/>

	<div class="crumbs">
		{#each crumbs as c, i (c.path)}
			{#if i > 0}<span class="sep">/</span>{/if}
			{#if i < crumbs.length - 1}
				<button type="button" onclick={() => goto(c.path)} title="go to {c.path}">{c.label}</button>
			{:else}
				<span class="here">{c.label}</span>
			{/if}
		{/each}
	</div>

	<div class="list">
		{#each filtered as f (f)}
			<div class="row">
				<button class="chev" type="button" onclick={() => descend(f)} title="browse inside {f}" aria-label="browse inside {f}">›</button>
				<button class="name" type="button" onclick={() => pick(f)} title="add {dir}/{f}">{f}<span class="slash">/</span></button>
			</div>
		{:else}
			<p class="none">no matching folders</p>
		{/each}
	</div>
	<p class="hint">Click a folder to add it; <span class="mono">›</span> browses inside.</p>
</div>

<style>
	.picker {
		display: flex;
		flex-direction: column;
		gap: 0.4rem;
	}
	input {
		width: 100%;
		box-sizing: border-box;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #c9d1d9;
		padding: 0.35rem 0.5rem;
		font-size: 0.8rem;
		font-family: var(--font-code);
	}
	.crumbs {
		display: flex;
		flex-wrap: wrap;
		align-items: center;
		gap: 0.15rem;
		font-family: var(--font-code);
		font-size: 0.72rem;
		color: #6e7681;
	}
	.crumbs .sep {
		color: #484f58;
	}
	.crumbs button {
		background: none;
		border: none;
		color: #8b949e;
		padding: 0.05rem 0.2rem;
		border-radius: 3px;
		cursor: pointer;
		font: inherit;
	}
	.crumbs button:hover {
		background: rgba(255, 255, 255, 0.08);
		color: #c9d1d9;
	}
	.crumbs .here {
		color: #c9d1d9;
		font-weight: 600;
		padding: 0.05rem 0.2rem;
	}
	.list {
		max-height: 14rem;
		overflow-y: auto;
		border: 1px solid #21262d;
		border-radius: 4px;
	}
	.row {
		display: flex;
		align-items: center;
		gap: 0.25rem;
	}
	.row:hover {
		background: rgba(255, 255, 255, 0.04);
	}
	.chev {
		flex: 0 0 auto;
		background: none;
		border: none;
		color: #6e7681;
		padding: 0.3rem 0.5rem;
		cursor: pointer;
		font-size: 0.95rem;
	}
	.chev:hover {
		color: #58a6ff;
	}
	.name {
		flex: 1;
		min-width: 0;
		text-align: left;
		background: none;
		border: none;
		color: #c9d1d9;
		padding: 0.3rem 0.3rem 0.3rem 0;
		font-size: 0.82rem;
		cursor: pointer;
		white-space: nowrap;
		overflow: hidden;
		text-overflow: ellipsis;
	}
	.name:hover {
		color: #58a6ff;
	}
	.slash {
		color: #6e7681;
	}
	.none {
		padding: 0.4rem 0.6rem;
		font-size: 0.75rem;
		color: #6e7681;
		margin: 0;
	}
	.hint {
		font-size: 0.7rem;
		color: #6e7681;
		margin: 0;
	}
	.mono {
		font-family: var(--font-code);
	}
</style>
