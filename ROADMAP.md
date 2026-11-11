# Roadmap

Each item is a GitHub issue scoped to a few hours, with acceptance criteria.

## Already shipped

- Local folder editing with autosave and byte-preserving saves
- Cloudflare Workers build with R2 file storage and KV folder config
- Server-rendered tree and file, deep links, prefetch on hover

## Safety first

- [Show save failures instead of reporting "Saved"](https://github.com/mrgnw/markito/issues/1)
- [Detect external changes before overwriting a file](https://github.com/mrgnw/markito/issues/2)
- [Write files atomically and create missing parent directories](https://github.com/mrgnw/markito/issues/3)
- [Resolve symlinks in the folder path guard](https://github.com/mrgnw/markito/issues/4)
- [Optional access token for network exposure](https://github.com/mrgnw/markito/issues/8)

## Editing features

- [Create, rename and delete files and folders](https://github.com/mrgnw/markito/issues/5)
- [Filter the file tree by name](https://github.com/mrgnw/markito/issues/6)
- [Full-text search across folders](https://github.com/mrgnw/markito/issues/7)
- [Support .markdown and .mdx files and a configurable ignore list](https://github.com/mrgnw/markito/issues/13)
- [Fix svelte-check warnings and add a dark color scheme](https://github.com/mrgnw/markito/issues/12)

## Distribution and quality

- [Publish markito to npm so `npx markito` works](https://github.com/mrgnw/markito/issues/9)
- [Run the round-trip browser test in CI](https://github.com/mrgnw/markito/issues/10)
- [Add unit tests for the fs and R2 backends and the API routes](https://github.com/mrgnw/markito/issues/11)
