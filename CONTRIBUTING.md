# Contributing to SoonerSlot

Thanks for helping make interview hunting less painful. Bug reports, ideas and pull requests are all welcome.

## Reporting a bug

Open an [issue](https://github.com/UzairJIqbal/soonerslot/issues/new/choose) using the bug report template. The most useful reports include:

- your Chrome version and operating system,
- the program and search settings you used (leave out your ZIP code if you prefer),
- what you expected and what happened instead,
- any errors from the service worker console (`chrome://extensions` → SoonerSlot → **Service worker**).

## Proposing a change

For anything larger than a small fix, please open an issue first so we can agree on the approach before you spend time on it.

1. Fork the repository and create a branch from `main`.
2. Load your copy with **Load unpacked** in `chrome://extensions` and test the change by hand.
3. Run `npm run check` and make sure it passes.
4. If you changed an entry point, a step or a call site, update [docs/FLOW.md](docs/FLOW.md) and mark what changed.
5. Open a pull request that explains what changed and why, with a screenshot for any UI change.

## Ground rules

These keep SoonerSlot trustworthy and fair to CBP's servers. Pull requests that break them won't be merged.

- **No automated booking.** SoonerSlot alerts people; they book for themselves on the official site.
- **Stay polite to the API.** No checks more often than once a minute, and keep the per-check request cap.
- **No data collection.** No analytics, remote logging or third-party services that receive user data.
- **No CBP or DHS branding**, and nothing that suggests the extension is official.
- **No runtime dependencies or build step** unless there's a strong reason. Plain modules keep the code easy to audit.

## Code style

- Plain ES modules, tabs for indentation in JavaScript, two spaces elsewhere (see `.editorconfig`).
- Build DOM with `textContent` and `createElement`, never `innerHTML` with data.
- Write UI copy in plain, sentence-case language. Errors say what went wrong and what to do next.

By contributing, you agree that your contributions are licensed under the [MIT License](LICENSE).
