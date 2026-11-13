# Contributing

Bug reports, documentation fixes, and small pull requests are welcome. Start with the [good first issues](https://github.com/mrgnw/markito/issues?q=is%3Aissue%20is%3Aopen%20label%3A%22good%20first%20issue%22). For larger changes, discuss the approach in an issue first. The [roadmap](ROADMAP.md) keeps safety work and planned features visible.

## Local setup

Follow the [from-source quick start](README.md#30-second-quick-start) for prerequisites, installation, and running the app. Use a disposable folder with made-up notes while developing. Keep the server on localhost.

## Before a pull request

Keep each pull request focused on one concern. Follow the existing TypeScript and Svelte style, including tabs. Add a regression test for behavior changes. Include reproduction steps for bug fixes and a screenshot or short recording for UI changes.

Run the type check:

```sh
bun run check
```

Build the Node app:

```sh
bun run build
```

Run the tests, including the browser round trip that checks saved bytes. This requires [uv](https://docs.astral.sh/uv/) and Playwright Chromium. Install the browser once:

```sh
uvx playwright install chromium
```

```sh
bun run test
```

The type check currently reports two known warnings tracked in [#12](https://github.com/mrgnw/markito/issues/12). Mention any failures or unverified checks in the pull request.

## Reports and contributions

Use the issue templates and include only made-up notes. Remove private paths, credentials, and note content from logs and media. Describe your operating system, browser, Node and Bun versions, and storage backend.

AI-assisted contributions are welcome. Review the result, verify its behavior, and disclose substantial assistance in the pull request. Contributions use the project's [MIT license](LICENSE).
