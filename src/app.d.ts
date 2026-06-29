// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		interface Platform {
			env?: {
				BUCKET?: import('@cloudflare/workers-types').R2Bucket;
				MARKITO_CONFIG_JSON?: string;
			};
		}
	}
}

export {};
