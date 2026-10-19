# ClearBlock

A modern, transparent, privacy-first ad and tracker blocker for Chrome and other Chromium browsers.

ClearBlock is a clean Manifest V3 rebuild of an archived AdBlock 6.49.0 package. It removes legacy account, payment, telemetry, remote-service, and promotional code and replaces it with a small, auditable extension.

## Features

- **205,000+ packaged network rules** for advertising, tracking, and common annoyances
- Master pause/resume control
- Independent ad, tracker, and annoyance rulesets
- YouTube network filtering plus cleanup of clearly identified rendered ad containers
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

## YouTube behavior and reference review

ClearBlock keeps its packaged network rules active on YouTube and removes clearly identified rendered ad containers. The earlier compatibility option was removed because it overrode those rules and could allow ads through. YouTube serves some video ads from the same infrastructure as requested media, so a Manifest V3 extension cannot honestly guarantee that every in-stream ad will always be blocked without risking playback.

ClearBlock is not a YouTube client modification. It does **not** spoof page globals, force playback, reload around detection, download videos, bypass access controls, or unlock paid Premium features.

Three requested repositories were reviewed:

- [`TheRealJoelmatic/RemoveAdblockThing`](https://github.com/TheRealJoelmatic/RemoveAdblockThing) is MIT-licensed, but its core behavior bypasses YouTube's ad-block enforcement through page-global manipulation, forced refreshes, DOM removal, and a remote update check. None of that code is included.
- [`Gryphonulbeam/YouTube-Premium-Mod-2026`](https://github.com/Gryphonulbeam/YouTube-Premium-Mod-2026) does not contain an extension or desktop client implementation. It is an unlicensed download landing page whose configuration points to an obfuscated third-party domain. No code, assets, downloads, or claims from it are included.
- [`Tonwalter888/YouMod`](https://github.com/Tonwalter888/YouMod) is GPL-3.0, but it is an Objective-C/Logos tweak injected into the native iOS YouTube app, not a Chromium extension. Its ad-removal and downloader code relies on private app classes, decrypted IPA modification, signed playback requests, and native media processing that are unavailable to Chrome extensions. It is reference-only; no source was copied.

## Contributing and security

See [CONTRIBUTING.md](CONTRIBUTING.md) and [SECURITY.md](SECURITY.md). Bug reports and focused pull requests are welcome.

## License

GPL-3.0. See [LICENSE](LICENSE). Third-party attribution is in [NOTICE](NOTICE), and notices for the archived predecessor remain inside its directory.
