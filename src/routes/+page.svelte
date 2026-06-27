<script lang="ts">
	import { onMount } from 'svelte';
	import FileTree from '$lib/FileTree.svelte';
	import type { FileEntry } from '$lib/types';

	let files: FileEntry[] = $state([]);
	let addingFolder = $state(false);
	let newFolderPath = $state('');
	let folderError = $state('');
	let selectedPath = $state('');
	let editorContent = $state('');
	let editorKey = $state('');
	let dirty = $state(false);
	let saving = $state(false);
	let statusMessage = $state('');
	let Editor: any = $state(null);
	let saveTimer: ReturnType<typeof setTimeout> | null = null;
	let sidebarOpen = $state(false);

	async function loadTree() {
		const res = await fetch('/api/files');
		files = await res.json();
	}

	async function loadFile(path: string) {
		if (dirty && selectedPath) {
			await save();
		}
		const res = await fetch(`/api/files/${path}`);
		const data = await res.json();
		editorContent = data.content;
		selectedPath = path;
		editorKey = path;
		dirty = false;
		statusMessage = '';
		sidebarOpen = false;
	}

	async function save() {
		if (!selectedPath) return;
		saving = true;
		await fetch(`/api/files/${selectedPath}`, {
			method: 'PUT',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ content: editorContent })
		});
		dirty = false;
		saving = false;
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

	async function addFolder() {
		const path = newFolderPath.trim();
		if (!path) return;
		folderError = '';
		const res = await fetch('/api/folders', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify({ path })
		});
		if (!res.ok) {
			folderError = (await res.json().catch(() => ({}))).message ?? 'Failed to add folder';
			return;
		}
		newFolderPath = '';
		addingFolder = false;
		await loadTree();
	}

	async function removeFolder(id: string) {
		await fetch(`/api/folders/${id}`, { method: 'DELETE' });
		if (selectedPath === id || selectedPath.startsWith(`${id}/`)) {
			selectedPath = '';
			editorContent = '';
		}
		await loadTree();
	}

	let filename = $derived(selectedPath.split('/').pop() ?? '');

	onMount(() => {
		loadTree();
		import('$lib/Editor.svelte').then(m => {
			Editor = m.default;
		});
	});
</script>

<svelte:window onkeydown={handleKeydown} />

<div class="layout">
	<!-- Mobile overlay -->
	{#if sidebarOpen}
		<button class="overlay" onclick={() => sidebarOpen = false}></button>
	{/if}

	<aside class="sidebar" class:open={sidebarOpen}>
		<div class="sidebar-header">
			<span class="logo">✍️ edith</span>
			<button class="add-btn" title="Add folder" onclick={() => { addingFolder = !addingFolder; folderError = ''; }}>+</button>
		</div>
		{#if addingFolder}
			<form class="add-folder" onsubmit={(e) => { e.preventDefault(); addFolder(); }}>
				<!-- svelte-ignore a11y_autofocus -->
				<input
					type="text"
					placeholder="/absolute/path/to/folder"
					bind:value={newFolderPath}
					autocomplete="off"
					spellcheck="false"
					autofocus
				/>
				{#if folderError}<span class="folder-error">{folderError}</span>{/if}
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
					<span class="status">✓</span>
				{/if}
				{#if dirty}
					<span class="unsaved">●</span>
				{/if}
			</div>
		</header>
		{#if selectedPath}
			<div class="editor-area">
				{#if Editor}
					<Editor
						content={editorContent}
						onchange={handleChange}
						key={editorKey}
					/>
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
