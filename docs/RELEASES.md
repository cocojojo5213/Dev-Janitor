# Release and Build History

This document records the repository release line, GitHub tag state, and Actions history that should be checked before publishing a new Dev Janitor release.

## Current Release State

- Latest published release: `v2.5.0`
- Published at: `2026-07-21T08:37:12Z`
- Release URL: https://github.com/cocojojo5213/Dev-Janitor/releases/tag/v2.5.0
- Published asset count: 22
- Current app version in this checkout: `2.5.0` (published)
- Current toolchain baseline: Node.js 24, pnpm 11.15.1, Rust 1.97.1

The repository had historical draft releases left by failed or repeated release runs. Those stale drafts were deleted on 2026-06-05. During the `v2.4.2` publish, the first tag run created an empty draft release before a Windows CI test failure was fixed; that draft was deleted before the tag was moved to the fixed commit and the final release was published.
The `v2.4.3` publish completed successfully on the first tag run after hardening cache cleanup target validation.
The `v2.5.0` publish completed successfully on the first tag run after the CI, updater, AI CLI catalog, dependency, and runtime responsiveness refresh. The published release contains 22 assets, including `latest.json`.

## Version Tags

Recent v2 tags from the local repository after `git fetch --all --tags --prune`:

| Tag | Date | Commit | Subject |
| --- | --- | --- | --- |
| `v2.5.0` | 2026-07-21 | `2febb53` | Dev Janitor v2.5.0 |
| `v2.4.3` | 2026-06-08 | `c8a2983` | fix: harden cache cleanup targets |
| `v2.4.2` | 2026-06-06 | `2b9685e` | fix: make AI cleanup tests portable on Windows |
| `v2.4.1` | 2026-06-02 | `ddfa6b1` | Dev Janitor v2.4.1 |
| `v2.4.0` | 2026-06-02 | `21990c0` | Dev Janitor v2.4.0 |
| `v2.3.7` | 2026-05-05 | `e931153` | Dev Janitor v2.3.7 |
| `v2.3.6` | 2026-04-16 | `79f80d4` | v2.3.6 |
| `v2.3.5` | 2026-03-07 | `9074852` | release: v2.3.5 |
| `v2.3.4` | 2026-03-07 | `e2b583a` | v2.3.4 |
| `v2.3.3` | 2026-03-07 | `ddf7741` | v2.3.3 |
| `v2.3.2` | 2026-03-07 | `6e256ba` | v2.3.2 |
| `v2.3.1` | 2026-03-06 | `af02e5e` | Release v2.3.1 |
| `v2.2.9` | 2026-02-21 | `fd80850` | chore: bump version to 2.2.9 |
| `v2.2.7.2` | 2026-02-05 | `3f595f4` | fix: resolve USERPROFILE path for Claude uninstall on Windows |
| `v2.2.7.1` | 2026-02-05 | `cb506ce` | fix: remove nul pattern and add Windows reserved name check |
| `v2.2.7` | 2026-02-05 | `cb506ce` | fix: remove nul pattern and add Windows reserved name check |
| `v2.2.6` | 2026-01-31 | `d1b8ecd` | v2.2.6 |
| `v2.2.5` | 2026-01-31 | `faeeda6` | fix: clippy Path ref in config scan |
| `v2.2.4` | 2026-01-30 | `8f5ca5d` | chore: release v2.2.4 |
| `v2.2.3` | 2026-01-28 | `420f10d` | chore: bump version to 2.2.3 - Add command timeout protection |
| `v2.2.2` | 2026-01-27 | `df2639b` | v2.2.2: fix version sync & TypeScript types |
| `v2.2.1` | 2026-01-27 | `97a0c67` | v2.2.1 - AI Security Scan Module |
| `v2.2.0` | 2026-01-27 | `9311d0d` | v2.2.0 - AI Security Scan Module |
| `v2.1.1` | 2026-01-26 | `4012073` | fix: correct portable exe path detection in CI |
| `v2.1.0` | 2026-01-25 | `6a9fbe1` | Release v2.1.0: AI Chat History Management |
| `v2.0.5` | 2026-01-25 | `ec3f47f` | Release v2.0.5 |
| `v2.0.4` | 2026-01-25 | `b3456e0` | Release v2.0.4 |
| `v2.0.3` | 2026-01-25 | `2c02159` | chore: release v2.0.3 - fix AI CLI detection on Windows, add state persistence for all views |
| `v2.0.2` | 2026-01-25 | `1589b06` | fix: Clippy warning and AI cleanup state persistence (v2.0.2) |
| `v2.0.1` | 2026-01-24 | `1a8c607` | chore: bump version 2.0.1 |
| `v2.0.0` | 2026-01-24 | `b0b0eec` | fix: add lint script, workflow permissions and macos builds |

Useful commands:

```bash
git fetch --all --tags --prune
git tag --sort=-creatordate --format='%(refname:short)|%(creatordate:short)|%(objectname:short)|%(subject)'
gh release list --limit 50
```

## Recent GitHub Actions History

Recent workflow runs reviewed on 2026-07-28:

| Run | Created | Workflow | Result | Branch/tag | Commit | Title |
| --- | --- | --- | --- | --- | --- | --- |
| `29814378880` | 2026-07-21T08:27:48Z | Release | success | `v2.5.0` | `2febb53` | Dev Janitor v2.5.0 |
| `29814352315` | 2026-07-21T08:27:23Z | CI | success | `main` | `2febb53` | Dev Janitor v2.5.0 |
| `27112913909` | 2026-06-08T02:39:04Z | Release | success | `v2.4.3` | `c8a2983` | fix: harden cache cleanup targets |
| `27112906682` | 2026-06-08T02:38:47Z | CI | success | `main` | `c8a2983` | fix: harden cache cleanup targets |
| `27062356326` | 2026-06-06T12:30:50Z | CI | success | `main` | `5c5eaff` | tools: validate release artifacts |
| `27062074009` | 2026-06-06T12:17:25Z | CI | success | `main` | `703c0eb` | ci: pin migrated Windows runner |
| `27061869156` | 2026-06-06T12:07:39Z | CI | success | `main` | `5ac7506` | ci: share release version validation |
| `27061228310` | 2026-06-06T11:36:36Z | CI | success | `main` | `d39d943` | docs: record v2.4.2 release validation |
| `27060734403` | 2026-06-06T11:12:38Z | Release | success | `v2.4.2` | `2b9685e` | fix: make AI cleanup tests portable on Windows |
| `27060715941` | 2026-06-06T11:11:45Z | CI | success | `main` | `2b9685e` | fix: make AI cleanup tests portable on Windows |
| `27060229556` | 2026-06-06T10:48:06Z | Release | cancelled | `v2.4.2` | `3cbcffa` | release: v2.4.2 |
| `27060226770` | 2026-06-06T10:47:57Z | CI | failure | `main` | `3cbcffa` | release: v2.4.2 |
| `27019662876` | 2026-06-05T14:06:35Z | CI | success | `main` | `42b868d` | docs: refresh release maintenance state |
| `26799354343` | 2026-06-02T04:57:15Z | Release | success | `v2.4.1` | `284a556` | release: v2.4.1 |
| `26799353770` | 2026-06-02T04:57:13Z | CI | success | `main` | `284a556` | release: v2.4.1 |
| `26795628941` | 2026-06-02T03:00:45Z | Release | success | `v2.4.0` | `9856a54` | release: v2.4.0 |
| `26795616629` | 2026-06-02T03:00:24Z | CI | success | `main` | `9856a54` | release: v2.4.0 |
| `25360531320` | 2026-05-05T06:02:37Z | CI | success | `main` | `3fa87c6` | fix Windows clippy lint |
| `25360073283` | 2026-05-05T05:47:24Z | Release | success | `v2.3.7` | `58b6171` | align Tauri JS packages for release |
| `25360068703` | 2026-05-05T05:47:14Z | CI | failure | `main` | `58b6171` | align Tauri JS packages for release |
| `25359905339` | 2026-05-05T05:41:35Z | Release | failure | `v2.3.7` | `5b00161` | fix Windows PATH diagnostics |
| `25359899455` | 2026-05-05T05:41:23Z | CI | failure | `main` | `5b00161` | fix Windows PATH diagnostics |
| `24513756435` | 2026-04-16T13:45:01Z | CI | success | `main` | `ab28117` | ci: upgrade node24 workflow actions |
| `24512891710` | 2026-04-16T13:27:18Z | Release | success | `v2.3.6` | `aab2f2b` | release: v2.3.6 |
| `24512890862` | 2026-04-16T13:27:17Z | CI | success | `main` | `aab2f2b` | release: v2.3.6 |
| `23003055459` | 2026-03-12T12:56:39Z | CI | success | `main` | `582c4f3` | docs: polish repository metadata and community files |
| `23002480742` | 2026-03-12T12:41:49Z | CI | success | `main` | `e88b2f5` | license: switch repository to MIT |
| `22793721992` | 2026-03-07T06:20:44Z | Release | success | `v2.3.5` | `9074852` | release: v2.3.5 |
| `22793721679` | 2026-03-07T06:20:42Z | CI | success | `main` | `9074852` | release: v2.3.5 |

Failure causes observed from `gh run view --log-failed`:

- `25359905339` failed because the release build had a Tauri Rust/JS minor mismatch: Rust `tauri` 2.10.3 versus `@tauri-apps/api` 2.11.0.
- `25359899455` failed for the same release-candidate commit, before the Tauri version alignment landed.
- `25360068703` failed on Windows Clippy because Rust 1.94 flagged a `needless_return` in `src-tauri/src/config/mod.rs`.
- `25360073283` then published `v2.3.7` successfully after Tauri package alignment.
- `25360531320` then made `main` green after the Windows Clippy fix.
- `27060226770` failed on Windows tests because new path assertions used POSIX separators and one Goose install-command assertion did not account for the Windows manual-install path.
- `27060229556` was cancelled after preflight/create-release because it was building the failed `3cbcffa` commit. The empty draft release was deleted, then `v2.4.2` was moved to `2b9685e`.
- `27060715941` and `27060734403` then completed successfully for the fixed `v2.4.2` release.

Useful commands:

```bash
gh run list --limit 50 --json databaseId,displayTitle,workflowName,event,status,conclusion,headBranch,headSha,createdAt,updatedAt,url
gh run view <run-id> --log-failed
gh release view v2.4.3 --json tagName,name,isDraft,isPrerelease,publishedAt,createdAt,url,assets
```

## Release Checklist

Before tagging:

```bash
corepack pnpm install --frozen-lockfile
corepack pnpm lint
corepack pnpm validate:release
corepack pnpm validate:ai-catalog
corepack pnpm build
corepack pnpm test
cargo fmt --check --manifest-path src-tauri/Cargo.toml
cargo clippy --manifest-path src-tauri/Cargo.toml --all-targets -- -D warnings
cargo test --manifest-path src-tauri/Cargo.toml --locked
cargo check --manifest-path src-tauri/Cargo.toml --target x86_64-pc-windows-gnu
git diff --check
```

Version fields that must agree:

- `package.json`
- `src-tauri/Cargo.toml`
- `src-tauri/tauri.conf.json`
- `src/i18n/en.json`
- `src/i18n/zh.json`
- `CHANGELOG.md`

The release workflow runs on `v*` tag pushes. Manual runs must provide an existing tag through `release_tag`; this prevents accidentally building a release from `main` or another branch name.

The release workflow also runs a preflight job before creating the draft release. It checks that the tag matches every version field, then runs the frontend lint/build and Rust format/test/clippy checks on Ubuntu. If this job fails, no release assets are built and no new draft release is created.

Windows CI and release builds use the explicit `windows-2025-vs2026` runner label, matching the June 2026 GitHub-hosted runner migration instead of relying on the moving `windows-latest` alias.

After a successful release:

1. Confirm the release is published, not draft.
2. Confirm `latest.json` exists for the updater.
3. Confirm Windows `.msi`, `.exe`, portable ZIP, macOS `.dmg`, Linux AppImage, `.deb`, `.rpm`, and signatures are present.
4. Review stale draft releases and delete obsolete ones from GitHub Releases.

Download and inspect the published artifacts locally:

```bash
artifact_dir=/tmp/dev-janitor-v2.4.3
rm -rf "$artifact_dir"
mkdir -p "$artifact_dir"
gh release download v2.4.3 --dir "$artifact_dir"
corepack pnpm validate:artifacts -- --dir "$artifact_dir" --version 2.4.3
find "$artifact_dir" -maxdepth 1 -type f -printf '%f\n' | sort
sha256sum "$artifact_dir"/*
file "$artifact_dir"/*
python3 -m json.tool "$artifact_dir/latest.json" >/dev/null
python3 - <<'PY'
import json
from pathlib import Path

data = json.loads(Path("/tmp/dev-janitor-v2.4.3/latest.json").read_text())
assert data["version"] == "2.4.3", data
assert data["platforms"], data
PY
unzip -l "$artifact_dir/Dev-Janitor_2.4.3_x64_portable.zip"
dpkg-deb -I "$artifact_dir/"*.deb
```

## v2.5.0 Artifact Validation

GitHub release metadata was rechecked on 2026-07-28:

- Confirmed Release workflow run `29814378880` completed successfully for tag `v2.5.0`, including preflight, release creation, four platform build jobs, and publication.
- Confirmed CI workflow run `29814352315` completed successfully for `main` at `2febb53`.
- Confirmed the release was published at `2026-07-21T08:37:12Z`, is not a draft or prerelease, and has 22 assets.
- Confirmed `latest.json`, Windows installers and portable ZIP, macOS DMGs and app archives, Linux AppImage, Debian and RPM packages, and updater signatures are present.
- This metadata refresh did not repeat the full local archive, package-format, or checksum inspection documented for earlier releases.

## v2.4.3 Artifact Validation

The `v2.4.3` artifacts were downloaded to `/tmp/dev-janitor-v2.4.3` after the release was published.

Validation completed on 2026-06-08:

- Confirmed the Release workflow run `27112913909` completed successfully for tag `v2.4.3`, including preflight, create-release, four platform build jobs, and publish-release.
- Confirmed the CI workflow run `27112906682` completed successfully for `main` at `c8a2983`.
- Confirmed the GitHub release is published, not draft, not prerelease, and has 22 uploaded assets.
- Confirmed `latest.json` exists and the repository artifact validator passed: `Release artifact validation passed for v2.4.3: 22 files in /tmp/dev-janitor-v2.4.3`.
- Confirmed Windows `.msi`, `.exe`, portable ZIP, macOS `.dmg` and `.app.tar.gz`, Linux AppImage, `.deb`, `.rpm`, all expected signatures, and updater `latest.json` are present.

## v2.4.2 Artifact Validation

The `v2.4.2` artifacts were downloaded to `/tmp/dev-janitor-v2.4.2` after the release was published.

Validation completed on 2026-06-06:

- Confirmed 22 release assets were present and non-empty.
- Confirmed `latest.json` parses as JSON, reports version `2.4.2`, and includes 11 updater platform entries.
- Generated SHA-256 hashes for every downloaded asset.
- Verified the Windows portable ZIP with `unzip -t`; contents were `.portable`, `dev-janitor-v2.exe`, and `README.txt`.
- Confirmed Windows NSIS setup EXE and localized MSI packages are recognizable installer formats with `file` and `7z`.
- Confirmed macOS x64/aarch64 DMGs contain `Dev Janitor.app`, `Info.plist`, icon resources, and the app binary.
- Confirmed macOS x64/aarch64 `.app.tar.gz` files pass gzip/tar integrity checks and contain `Info.plist`, icon resources, and the app binary.
- Confirmed the Debian package metadata reports `Package: dev-janitor`, `Version: 2.4.2`, `Architecture: amd64`, and includes `/usr/bin/dev-janitor-v2`.
- Confirmed the RPM payload contains `/usr/bin/dev-janitor-v2`, the desktop file, and app icons.
- Confirmed the AppImage is an x86-64 ELF AppImage, contains a valid SquashFS payload, and extracts `AppRun` plus `usr/bin/dev-janitor-v2`.
- Confirmed all `.sig` files are present and non-empty.
