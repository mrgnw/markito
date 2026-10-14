<script>
	import '@fontsource-variable/lora/wght.css';
	import '@fontsource-variable/lora/wght-italic.css';
	import '@fontsource-variable/martian-mono/wght.css';
	let { children } = $props();
</script>

{@render children()}

<style>
	:global(:root) {
		--font-prose: 'Lora Variable', Georgia, serif;
		--font-code: 'Martian Mono Variable', ui-monospace, 'SFMono-Regular', Menlo, monospace;
	}
</style>
