# Changelog

## Unreleased

The old `(#N)` references pointed at the private development history and are removed; the public issues numbered #1 to #13 are the roadmap, not these changes.

### Performance

- Server-render the folder tree and the selected file, so the first paint shows content without client fetches.
- Walk filesystem folders concurrently, bounded to 32 levels and 20,000 entries.
- Switching files saves the previous file and fetches the next one at the same time.
- Prefetch a file's content on hover, with a small in-memory cache.

### UX

- The editor opens in preview-inline mode: markers hidden, shown back in the construct at the caret, always editable.

- The open file lives in the URL as `?f=`, so reloads and deep links keep it open.
- The tree row and filename update the moment a file is clicked.
- The editor gains focus when a file opens.
- A skeleton shows while the editor code loads.
- Fade and slide transitions on status glyphs, the mobile overlay, the add-folder form and tree collapse. Disabled under `prefers-reduced-motion`.
- Collapsing a parent folder no longer forgets which children were collapsed.

- `GET /version` reports the package version, git commit and build time of the running server.

### Fixes

- The caret was invisible: Aragonite's theme stylesheet, which sizes and colours the drawn caret, was never loaded.

- Filenames containing `#`, `%` or `?` now open and save.
- Leaving the page with unsaved edits asks for confirmation.
- Autosave could write the previous file's text under the newly opened file's name.
- Removed the `/api/status` endpoint; the backend kind comes from the page load.
