<script lang="ts">
	import { onMount } from 'svelte';
	import { Crepe, CrepeFeature } from '@milkdown/crepe';
	import '@milkdown/crepe/theme/frame.css';

	let {
		content = '',
		onchange,
		key = ''
	}: {
		content: string;
		onchange?: (markdown: string) => void;
		key?: string;
	} = $props();

	let container: HTMLDivElement;
	let crepe: Crepe | null = null;
	let currentKey = '';

	async function initEditor(markdown: string) {
		if (crepe) {
			await crepe.destroy();
			crepe = null;
		}
		container.innerHTML = '';

		crepe = new Crepe({
			root: container,
			defaultValue: markdown,
			features: {
				[CrepeFeature.BlockEdit]: false,
				[CrepeFeature.Toolbar]: false,
				[CrepeFeature.TopBar]: false,
				[CrepeFeature.ImageBlock]: false,
				[CrepeFeature.Latex]: false,
				[CrepeFeature.Table]: false,
				[CrepeFeature.CodeMirror]: false,
			},
			featureConfigs: {
				[CrepeFeature.Placeholder]: {
					text: 'Start typing…',
				},
				[CrepeFeature.ListItem]: {
					bulletIcon: '<svg xmlns="http://www.w3.org/2000/svg" width="8" height="8" viewBox="0 0 8 8"><circle cx="4" cy="4" r="2.5" fill="currentColor"/></svg>',
				},
			},
		});

		crepe.on((listener) => {
			listener.markdownUpdated((_ctx, md, _prev) => {
				onchange?.(md);
			});
		});

		await crepe.create();
		currentKey = key;
	}

	onMount(() => {
		initEditor(content);
		return () => {
			crepe?.destroy();
		};
	});

	$effect(() => {
		if (key && key !== currentKey && container) {
			initEditor(content);
		}
	});
</script>

<div class="editor-wrap">
	<div bind:this={container} class="editor-container"></div>
</div>

<style>
	.editor-wrap {
		flex: 1;
		overflow: auto;
		display: flex;
		flex-direction: column;
	}
	.editor-container {
		flex: 1;
		min-height: 0;
	}

	/* Override Crepe theme variables */
	.editor-container :global(.milkdown) {
		--crepe-font-title: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		--crepe-font-default: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		--crepe-color-primary: #24292f;
		--crepe-color-on-background: #1f2328;
		--crepe-color-background: #ffffff;
		--crepe-color-outline: #d0d7de;
		--crepe-color-selected: #ddf4ff;
		--crepe-color-inline-code: #953800;
		height: 100%;
	}

	/* Clean typography */
	.editor-container :global(.ProseMirror) {
		padding: 2rem 2.5rem;
		min-height: 100%;
		outline: none;
		font-size: 15px;
		line-height: 1.65;
	}
	.editor-container :global(.ProseMirror h1) {
		font-size: 1.6em;
		font-weight: 600;
		line-height: 1.3;
		margin-top: 1.5em;
		margin-bottom: 0.5em;
		padding: 0;
	}
	.editor-container :global(.ProseMirror h2) {
		font-size: 1.3em;
		font-weight: 600;
		line-height: 1.35;
		margin-top: 1.4em;
		margin-bottom: 0.4em;
		padding: 0;
	}
	.editor-container :global(.ProseMirror h3) {
		font-size: 1.1em;
		font-weight: 600;
		line-height: 1.4;
		margin-top: 1.2em;
		margin-bottom: 0.3em;
		padding: 0;
	}
	.editor-container :global(.ProseMirror h4),
	.editor-container :global(.ProseMirror h5),
	.editor-container :global(.ProseMirror h6) {
		font-size: 1em;
		font-weight: 600;
		line-height: 1.45;
		margin-top: 1em;
		margin-bottom: 0.25em;
		padding: 0;
	}
	.editor-container :global(.ProseMirror p) {
		font-size: inherit;
		line-height: inherit;
		padding: 0;
		margin: 0.4em 0;
	}
	.editor-container :global(.ProseMirror > *:first-child) {
		margin-top: 0;
	}

	/* List items */
	.editor-container :global(.milkdown .milkdown-list-item-block li) {
		gap: 4px;
	}
	.editor-container :global(.milkdown .milkdown-list-item-block > .list-item) {
		display: flex;
		flex-direction: row;
		align-items: flex-start;
	}
	.editor-container :global(.milkdown .milkdown-list-item-block > .list-item > .children) {
		min-width: 0;
		flex: 1;
		overflow-wrap: break-word;
		word-break: break-word;
	}
	.editor-container :global(.milkdown .milkdown-list-item-block li .label-wrapper) {
		height: 25px;
		width: 16px;
		flex-shrink: 0;
		display: flex;
		align-items: center;
		justify-content: center;
		color: #636c76;
	}
	.editor-container :global(.milkdown .milkdown-list-item-block li .label-wrapper svg) {
		width: 8px;
		height: 8px;
		fill: #636c76;
	}
	.editor-container :global(.milkdown .milkdown-list-item-block li .label-wrapper .label) {
		height: 25px;
		width: 16px;
		padding: 0;
		display: flex;
		align-items: center;
		justify-content: center;
	}

	/* Blockquote */
	.editor-container :global(.ProseMirror blockquote) {
		padding-left: 1.2em;
		color: #656d76;
	}

	/* Code */
	.editor-container :global(.ProseMirror code) {
		font-size: 0.875em;
		padding: 0.15em 0.35em;
		border-radius: 3px;
	}

	/* HR */
	.editor-container :global(.ProseMirror hr) {
		margin: 1em 0;
	}

	@media (max-width: 640px) {
		.editor-container :global(.ProseMirror) {
			padding: 1.25rem 1rem;
			font-size: 14px;
		}
	}
</style>
