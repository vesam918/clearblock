# ClearBlock

A modern, transparent, privacy-first ad and tracker blocker for Chrome and other Chromium browsers.

ClearBlock is a clean Manifest V3 rebuild of an archived AdBlock 6.49.0 package. It removes legacy account, payment, telemetry, remote-service, and promotional code and replaces it with a small, auditable extension.

## Features

- **205,000+ packaged network rules** for advertising, tracking, and common annoyances
- Master pause/resume control
- Independent ad, tracker, and annoyance rulesets
- Optional YouTube compatibility profile that relaxes filtering for YouTube-owned page resources
- Per-site allowlist from the popup
- Custom domain blocklist
- Local blocked-request statistics and per-tab badge
- Settings export
- Light/dark theme, keyboard focus states, and responsive options UI
- No account, analytics, telemetry, affiliate links, remote code, or backend

## Install from source

1. Run `npm ci` and `npm run build`.
2. Open `chrome://extensions`.
3. Enable **Developer mode**.
4. Choose **Load unpacked** and select this repository's `dist/` directory.
5. Pin ClearBlock to the toolbar.

> Chrome Web Store publication is separate from GitHub distribution and requires a developer account and policy review.

## Development

Requires Node.js 22 or later.

```bash
npm ci
npm test
npm run lint
npm run validate
npm run build
npm run package
```

`npm run check` runs linting, tests, package validation, and a clean build. The release ZIP is written to `release/`.

## Architecture

- `src/manifest.json` — least-privilege Manifest V3 configuration
- `src/background.js` — settings, ruleset control, allow/block rules, and local statistics
- `src/core.js` — pure validation and rule-building helpers
- `src/popup.*` — current-site and master controls
- `src/options.*` — full settings, lists, statistics, and export
- `src/rules/` — packaged Declarative Net Request rules
- `tests/` — Node test suite
- `scripts/` — deterministic validation, build, packaging, and icon tasks
- `legacy-adblock-6.49.0/` — local predecessor snapshot for audit only; excluded from releases and from the public Git repository

## Filter provenance

The packaged rules are generated from the GPL-3.0-only `@adguard/dnr-rulesets` project:

- AdGuard Base filter (`ruleset_2`)
- AdGuard Tracking Protection filter (`ruleset_3`)
- AdGuard Cookie Notices, Popups, Mobile App Banners, Other Annoyances, and Widgets filters (`ruleset_18`–`ruleset_22`)

The rules are copied into the extension at development time; the installed extension does not fetch or execute remote code. See [NOTICE](NOTICE).

## Privacy and permissions

ClearBlock uses:

- `declarativeNetRequest` to apply packaged and user-created rules
- `declarativeNetRequestFeedback` to count matched rules locally
- `storage` to retain settings locally
- `tabs` to identify/reload the active tab and maintain its badge
- `<all_urls>` host access to apply filtering on websites

Read the full [privacy policy](PRIVACY.md).

## YouTube compatibility and reference review

The optional compatibility profile is deliberately narrow: it lets YouTube-owned page and subresource requests bypass ClearBlock so users can recover stable playback without disabling protection globally. It does **not** remove YouTube enforcement messages, spoof page globals, force playback, reload around detection, download videos, or unlock paid Premium features.

Two requested repositories were reviewed before this profile was added:

- [`TheRealJoelmatic/RemoveAdblockThing`](https://github.com/TheRealJoelmatic/RemoveAdblockThing) is MIT-licensed, but its core behavior deliberately bypasses YouTube's ad-block enforcement through page-global manipulation, forced refreshes, DOM removal, and a remote update check. None of that code is included.
- [`Gryphonulbeam/YouTube-Premium-Mod-2026`](https://github.com/Gryphonulbeam/YouTube-Premium-Mod-2026) does not contain an extension or desktop client implementation. It is an unlicensed download landing page whose configuration points to an obfuscated third-party domain. No code, assets, downloads, or claims from it are included.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Bug reports and focused pull requests are welcome.

## License

GPL-3.0. See [LICENSE](LICENSE). Third-party attribution is in [NOTICE](NOTICE), and notices for the archived predecessor remain inside its directory.
