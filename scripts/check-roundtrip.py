# /// script
# requires-python = ">=3.14"
# dependencies = ["playwright"]
# ///
# Opens files in the built app (`bun run build` first), types at the end of one, and checks the
# saved bytes are the original plus only what was typed. Milkdown rewrote these; Aragonite must not.
import os
import subprocess
import tempfile
import time
import urllib.request
from pathlib import Path

from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parent.parent
PORT = 5391
TYPED = ' typed'
TRICKY = """---
title: Round trip
---

Setext heading
==============

* star bullet
* another

1) paren list
2) second

__bold__ and *em* and <kbd>html</kbd>

| a | b |
|---|---|
| 1 | 2 |

[ref link][r]

[r]: https://example.com
Last line"""
OTHER = '# Other\n\nSecond file.\n'


def wait_for_server():
	for _ in range(50):
		try:
			urllib.request.urlopen(f'http://127.0.0.1:{PORT}/api/status')
			return
		except OSError:
			time.sleep(0.2)
	raise SystemExit('server did not start')


def main():
	tmp = Path(tempfile.mkdtemp(prefix='markito-roundtrip-'))
	notes = tmp / 'notes'
	notes.mkdir()
	tricky = notes / 'tricky.md'
	other = notes / 'other.md'
	tricky.write_text(TRICKY)
	other.write_text(OTHER)
	env = {
		**os.environ,
		'PORT': str(PORT),
		'HOST': '127.0.0.1',
		'MARKITO_CONFIG': str(tmp / 'config.json'),
		'MARKITO_FOLDERS': str(notes),
	}
	server = subprocess.Popen(['node', str(ROOT / 'build')], env=env)
	try:
		wait_for_server()
		with sync_playwright() as p:
			page = p.chromium.launch().new_page()
			page.goto(f'http://127.0.0.1:{PORT}')
			page.get_by_role('button', name='other.md').click()
			page.get_by_text('Second file.').wait_for()
			page.get_by_role('button', name='tricky.md').click()
			page.get_by_text('Last line').click()
			page.keyboard.press('End')
			page.keyboard.type(TYPED)
			page.locator('.unsaved').wait_for()
			page.keyboard.press('Meta+s')
			page.wait_for_function('() => !document.querySelector(".unsaved")')
			time.sleep(0.5)
		saved = tricky.read_text()
		assert saved == TRICKY + TYPED, f'saved bytes differ:\n{saved!r}'
		assert other.read_text() == OTHER, 'opening a file without editing rewrote it'
		print('round trip: saved bytes are the original plus the typed text')
	finally:
		server.terminate()


if __name__ == '__main__':
	main()
