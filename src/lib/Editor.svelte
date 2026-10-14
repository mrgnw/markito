<script lang="ts">
	import { onMount } from 'svelte';
	import { Editor, type EditorInstance } from '@voithos-labs/aragonite';
	import '@voithos-labs/aragonite/styles/editor-theme.css';
	import { detailsPlugin } from '@voithos-labs/aragonite/plugins/details';
	import { footnotesPlugin } from '@voithos-labs/aragonite/plugins/footnotes';
	import { slashCommandsPlugin } from '@voithos-labs/aragonite/plugins/slash-commands';

	let {
		source,
		onchange
	}: {
		source: string;
		onchange?: (markdown: string) => void;
	} = $props();

	// Aragonite installs plugins once per process, first set wins.
	const plugins = [slashCommandsPlugin(), footnotesPlugin(), detailsPlugin()];

	let editor: EditorInstance;

	onMount(() => editor.getEvents().on('edit', () => onchange?.(editor.getSource())));

	export function focus() {
		const start = { path: [0], offset: 0 };
		editor.setSelection({ anchor: start, focus: start });
	}
</script>

<div class="editor-host">
	<Editor
		bind:this={editor}
		{source}
		{plugins}
		theme="light"
		presentationMode="preview-inline"
		placeholder="Start typing…"
	/>
</div>

<style>
	.editor-host {
		flex: 1;
		min-height: 0;
		min-width: 0;
		display: flex;
		flex-direction: column;
		--font-editor: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		--font-ui: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
		--font-code: ui-monospace, 'SFMono-Regular', Menlo, monospace;
		--editor-font-size: 15px;
		--radius-ui: 4px;
		--radius-surface: 6px;
		--color-bg: #ffffff;
		--color-surface: #f6f8fa;
		--color-text-primary: #1f2328;
		--color-text-secondary: #1f2328;
		--color-ui-muted: #656d76;
		--color-ui-dulled: #8c959f;
		--color-accent: #0969da;
		--color-selection: #0969da;
		--color-border: #d0d7de;
		--color-error: #cf222e;
	}
	.editor-host > :global(*) {
		flex: 1;
		min-height: 0;
	}
	/* The inset sits on the editor itself so clicks in the side margins still place the caret. */
	.editor-host > :global(.editor) {
		box-sizing: border-box;
		padding-inline: max(1.5rem, calc((100% - 48rem) / 2));
	}

	@media (max-width: 640px) {
		.editor-host {
			--editor-font-size: 14px;
		}
	}
</style>
