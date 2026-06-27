import adapterNode from '@sveltejs/adapter-node';
import adapterCloudflare from '@sveltejs/adapter-cloudflare';

// Two deployment targets from one codebase:
//   default        -> adapter-node      (local fs folders; the md.example.com service)
//   ADAPTER=cloudflare -> adapter-cloudflare (Workers; R2 folders)
const adapter = process.env.ADAPTER === 'cloudflare' ? adapterCloudflare() : adapterNode();

/** @type {import('@sveltejs/kit').Config} */
const config = {
	compilerOptions: {
		runes: ({ filename }) => (filename.split(/[/\\]/).includes('node_modules') ? undefined : true)
	},
	kit: {
		adapter
	}
};

export default config;
