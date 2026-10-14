<script module lang="ts">
	const CACHE_LIMIT = 20;
	const contentCache = new Map<string, Promise<string>>();
</script>

<script lang="ts">
	import { onMount, tick } from 'svelte';
	import { replaceState } from '$app/navigation';
	import { page } from '$app/state';
	import { fade, slide } from 'svelte/transition';
	import { ms } from '$lib/motion';
	import FileTree from '$lib/FileTree.svelte';
	import FolderPicker from '$lib/FolderPicker.svelte';
	import type { FileEntry } from '$lib/types';

	let { data } = $props();

	let files: FileEntry[] = $derived(data.files);
	let addingFolder = $state(false);
	let folderError = $state('');
	const backend = $derived(data.backend);
	let r2Prefix = $state('');
	let r2Name = $state('');
	let selectedPath = $derived(data.selected);
	let editorContent = $derived(data.content);
	// A new object per load, so reopening a file with unchanged text still reaches the editor.
	let loaded = $derived({ text: data.content });
	let openPath = $derived(data.selected);
	let loadSeq = 0;
	let dirty = $state(false);
	let pendingSaves = 0;
	let statusMessage = $state('');
	let Editor: any = $state(null);
	let editor: { focus(): void } | undefined = $state();
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let sidebarOpen = $state(false);

	async function loadTree() {
		const res = await fetch('/api/files');
		files = await res.json();
	}

	function fileUrl(path: string) {
		return `/api/files/${path.split('/').map(encodeURIComponent).join('/')}`;
	}

	function setFileParam(path: string) {
		const url = new URL(page.url);
		if (path) url.searchParams.set('f', path);
		else url.searchParams.delete('f');
		replaceState(url, page.state);
	}

	function fetchContent(path: string): Promise<string> {
		const cached = contentCache.get(path);
		if (cached) return cached;
		const pending = fetch(fileUrl(path))
			.then((res) => res.json())
			.then((body) => body.content as string);
		pending.catch(() => contentCache.delete(path));
		contentCache.set(path, pending);
		if (contentCache.size > CACHE_LIMIT) contentCache.delete(contentCache.keys().next().value!);
		return pending;
	}

	function prefetch(path: string) {
		if (path !== openPath && matchMedia('(hover: hover)').matches) fetchContent(path);
	}

	async function loadFile(path: string) {
		const seq = ++loadSeq;
		selectedPath = path;
		setFileParam(path);
		sidebarOpen = false;
		if (path === openPath) return;
		const [, content] = await Promise.all([save(), fetchContent(path)]);
		if (seq !== loadSeq) return;
		contentCache.delete(path);
		save();
		openPath = path;
		editorContent = content;
		loaded = { text: content };
		dirty = false;
		statusMessage = '';
		await tick();
		editor?.focus();
	}

	async function save() {
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = null;
		if (!openPath || !dirty) return;
		pendingSaves++;
		dirty = false;
		contentCache.delete(openPath);
		try {
			await fetch(fileUrl(openPath), {
				method: 'PUT',
				headers: { 'Content-Type': 'application/json' },
				body: JSON.stringify({ content: editorContent })
			});
		} finally {
			pendingSaves--;
		}
		statusMessage = 'Saved';
		setTimeout(() => {
			if (statusMessage === 'Saved') statusMessage = '';
		}, 2000);
	}

	function handleChange(md: string) {
		editorContent = md;
		dirty = true;
		if (saveTimer) clearTimeout(saveTimer);
		saveTimer = setTimeout(save, 2000);
	}

	function handleKeydown(e: KeyboardEvent) {
		if ((e.metaKey || e.ctrlKey) && e.key === 's') {
			e.preventDefault();
			save();
		}
	}

	function openAdd() {
		addingFolder = !addingFolder;
		folderError = '';
	}

	async function postFolder(body: Record<string, string>): Promise<boolean> {
		folderError = '';
		const res = await fetch('/api/folders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(body)
		});
		if (!res.ok) {
			folderError = (await res.json().catch(() => ({}))).message ?? 'Failed to add folder';
			return false;
		}
		addingFolder = false;
		await loadTree();
		return true;
	}

	function pickFsFolder(path: string) {
		postFolder({ path });
	}

	async function addR2() {
		const ok = await postFolder({ prefix: r2Prefix.trim(), name: r2Name.trim() });
		if (ok) {
			r2Prefix = '';
			r2Name = '';
		}
	}

	async function removeFolder(id: string) {
		await fetch(`/api/folders/${id}`, { method: 'DELETE' });
		if (selectedPath === id || selectedPath.startsWith(`${id}/`)) {
			loadSeq++;
			selectedPath = '';
			openPath = '';
			editorContent = '';
			setFileParam('');
		}
		await loadTree();
	}

	let filename = $derived(selectedPath.split('/').pop() ?? '');

	onMount(() => {
		import('$lib/Editor.svelte').then(m => {
			Editor = m.default;
		});
	});
</script>

<svelte:window
	onkeydown={handleKeydown}
	onbeforeunload={(e) => {
		if (dirty || pendingSaves > 0) e.preventDefault();
	}}
/>

<div class="layout">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button class="overlay" transition:fade={{ duration: ms(150) }} onclick={() => sidebarOpen = false}></button>
	{/if}

	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<span class="logo">✍️ markito</span>
			<button class="add-btn" title="Add folder" onclick={openAdd}>+</button>
		</div>
		{#if addingFolder}
			<form class="add-folder" transition:slide={{ duration: ms(150) }} onsubmit={(e) => { e.preventDefault(); addR2(); }}>
				{#if backend === 'fs'}
					<FolderPicker
						list={(p) => fetch(`/api/fs/list?path=${encodeURIComponent(p)}`).then((r) => r.json())}
						onpick={pickFsFolder}
					/>
				{:else}
					<p class="r2-hint">A folder is a key prefix in the R2 bucket.</p>
					<input type="text" placeholder="prefix/ (optional)" bind:value={r2Prefix} autocomplete="off" spellcheck="false" />
					<input type="text" placeholder="display name (optional)" bind:value={r2Name} autocomplete="off" spellcheck="false" />
					<button type="submit" class="add-submit">Add R2 folder</button>
				{/if}
				{#if folderError}<span class="folder-error" transition:fade={{ duration: ms(120) }}>{folderError}</span>{/if}
			</form>
		{/if}
		<nav class="file-nav">
			{#if files.length === 0}
				<p class="empty-folders">No folders yet. Click + to add one.</p>
			{/if}
			<FileTree
				entries={files}
				selected={selectedPath}
				onselect={loadFile}
				onhover={prefetch}
				onremove={removeFolder}
			/>
		</nav>
	</aside>

	<main class="main">
		<header class="toolbar">
			<button class="menu-btn" onclick={() => sidebarOpen = !sidebarOpen}>☰</button>
			<span class="filepath">{filename}</span>
			<div class="toolbar-right">
				{#if statusMessage}
					<span class="status" transition:fade={{ duration: ms(120) }}>✓</span>
				{/if}
				{#if dirty}
					<span class="unsaved" transition:fade={{ duration: ms(120) }}>●</span>
				{/if}
			</div>
		</header>
		{#if selectedPath}
			<div class="editor-area">
				{#if Editor}
					<Editor
						bind:this={editor}
						source={loaded.text}
						onchange={handleChange}
					/>
				{:else}
					<div class="skeleton" aria-hidden="true">
						<span style="width: 60%"></span>
						<span style="width: 90%"></span>
						<span style="width: 40%"></span>
					</div>
				{/if}
			</div>
		{:else}
			<div class="empty">
				<p>☰ Select a file</p>
			</div>
		{/if}
	</main>
</div>

<style>
	:global(body) {
		margin: 0;
		font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		background: #0d1117;
		color: #c9d1d9;
		height: 100dvh;
		overflow: hidden;
	}
	:global(#svelte), :global(html), :global(body) {
		height: 100%;
	}

	.layout {
		display: flex;
		height: 100dvh;
	}

	.sidebar {
		width: 260px;
		min-width: 260px;
		background: #161b22;
		border-right: 1px solid #21262d;
		display: flex;
		flex-direction: column;
		overflow: hidden;
	}
	.sidebar-header {
		display: flex;
		align-items: center;
		padding: 0.75rem 1rem;
		border-bottom: 1px solid #21262d;
	}
	.logo {
		font-size: 0.9rem;
		font-weight: 600;
	}
	.add-btn {
		margin-left: auto;
		background: none;
		border: 1px solid #30363d;
		color: #c9d1d9;
		width: 1.5rem;
		height: 1.5rem;
		border-radius: 4px;
		cursor: pointer;
		font-size: 1rem;
		line-height: 1;
		display: flex;
		align-items: center;
		justify-content: center;
	}
	.add-btn:hover {
		background: rgba(255, 255, 255, 0.06);
	}
	.add-folder {
		padding: 0.5rem 1rem;
		border-bottom: 1px solid #21262d;
	}
	.add-folder input {
		width: 100%;
		box-sizing: border-box;
		background: #0d1117;
		border: 1px solid #30363d;
		border-radius: 4px;
		color: #c9d1d9;
		padding: 0.35rem 0.5rem;
		font-size: 0.8rem;
		font-family: 'SF Mono', monospace;
		margin-bottom: 0.4rem;
	}
	.add-submit {
		width: 100%;
		background: rgba(56, 139, 253, 0.15);
		border: 1px solid #1f6feb;
		color: #58a6ff;
		border-radius: 4px;
		padding: 0.35rem;
		font-size: 0.8rem;
		cursor: pointer;
	}
	.r2-hint {
		font-size: 0.72rem;
		color: #8b949e;
		margin: 0.25rem 0;
		line-height: 1.4;
	}
	.folder-error {
		display: block;
		margin-top: 0.35rem;
		color: #f85149;
		font-size: 0.75rem;
	}
	.empty-folders {
		padding: 0.75rem 1rem;
		color: #6e7681;
		font-size: 0.8rem;
	}
	.file-nav {
		flex: 1;
		overflow-y: auto;
		padding: 0.5rem 0;
		-webkit-overflow-scrolling: touch;
	}

	.main {
		flex: 1;
		display: flex;
		flex-direction: column;
		min-width: 0;
		overflow: hidden;
	}

	.toolbar {
		display: flex;
		align-items: center;
		padding: 0.4rem 0.75rem;
		background: #161b22;
		border-bottom: 1px solid #21262d;
		gap: 0.5rem;
		min-height: 2.25rem;
	}
	.menu-btn {
		display: none;
		background: none;
		border: none;
		color: #c9d1d9;
		font-size: 1.2rem;
		cursor: pointer;
		padding: 0.25rem;
	}
	.filepath {
		font-size: 0.8rem;
		color: #8b949e;
		font-family: 'SF Mono', monospace;
		overflow: hidden;
		text-overflow: ellipsis;
		white-space: nowrap;
	}
	.toolbar-right {
		margin-left: auto;
		display: flex;
		align-items: center;
		gap: 0.35rem;
	}
	.status {
		font-size: 0.8rem;
		color: #3fb950;
	}
	.unsaved {
		color: #d29922;
		font-size: 1rem;
		line-height: 1;
	}

	.editor-area {
		flex: 1;
		display: flex;
		overflow: auto;
		background: #ffffff;
	}
	.skeleton {
		flex: 1;
		display: flex;
		flex-direction: column;
		gap: 0.9rem;
		padding: 2rem 1.5rem;
		animation: pulse 1.2s ease-in-out infinite;
	}
	.skeleton span {
		height: 1rem;
		border-radius: 0.5rem;
		background: #e5e7eb;
	}
	@keyframes pulse {
		50% {
			opacity: 0.45;
		}
	}
	.empty {
		flex: 1;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #484f58;
		font-size: 1rem;
	}

	.overlay {
		display: none;
	}

	@media (max-width: 640px) {
		.sidebar {
			position: fixed;
			top: 0;
			left: 0;
			bottom: 0;
			z-index: 20;
			transform: translateX(-100%);
			transition: transform 0.2s ease;
			width: 280px;
			min-width: 0;
		}
		.sidebar.open {
			transform: translateX(0);
		}
		.overlay {
			display: block;
			position: fixed;
			inset: 0;
			z-index: 10;
			background: rgba(0, 0, 0, 0.5);
			border: none;
			cursor: default;
		}
		.menu-btn {
			display: block;
		}
	}
</style>
