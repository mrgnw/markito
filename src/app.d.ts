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
				R2_ACCOUNT_ID?: string;
				R2_ACCESS_KEY_ID?: string;
				R2_SECRET_ACCESS_KEY?: string;
				MARKITO_CONFIG_JSON?: string;
			};
		}
	}
}

export {};
