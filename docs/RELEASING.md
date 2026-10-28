# Release Engineering

This document describes how Berkelium Codex is versioned, validated, and published. It is written for maintainers.

**No release is ever published automatically.** CI validates the repository and can build an installable artifact, but publication to any registry is a manual, human-approved action. Do not add a publish step to any workflow without an explicit team decision and documented approval.

---

## 1. Distribution Status

Berkelium is currently **source-distributed only**. No Berkelium Codex package is published to the npm registry. The `@berkelium/*` manifests already carry the metadata needed for a future publication, but until that happens:

- `npm install -g @berkelium/cli` will fail because the package is not published.
- `npm install -g berkelium` installs a different, unrelated npm package, not this codebase.
- Installation instructions in the README apply to a git checkout.
- `docs/` and the README must not claim registry availability.

When the first registry release ships, update the README installation section in the same release.

---

## 2. Supported Versions

| Item | Supported |
| --- | --- |
| Node.js | 22.x, 24.x, 26.x (`>=22.13.0` enforced in `engines`) |
| pnpm | `>=11.7.0` |
| macOS | 12.0+ (Apple Silicon recommended, required for MLX acceleration) |
| Linux | Tested in CI on Ubuntu |
| Windows | Not supported and not tested |

CI (`.github/workflows/ci.yml`) runs typecheck, tests, build, CLI smoke tests, coverage, dependency audit, and secret scanning across macOS and Linux on every supported Node version.

---

## 3. Versioning

The project follows [Semantic Versioning 2.0.0](https://semver.org/spec/v2.0.0.html) and [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

- All workspace packages share one version. They are released together because the CLI and packages depend on each other through `workspace:*`.
- Breaking changes to any published public surface (`Provider`, `AgentEvent`, tool interfaces, CLI flags) require a major bump.
- New capabilities and non-breaking API additions require a minor bump.
- Safe fixes, documentation, and internal refactors require a patch bump.
- Pre-1.0 behavior: while the project is at `1.0.0`, treat public contracts as stable unless a changelog entry explicitly announces a break.

Update the version in every `package.json` (`packages/*`, `apps/cli`, and the root manifest) in a single commit. `pnpm version` is not used because it does not synchronize the workspace consistently.

---

## 4. Pre-Release Gate

Run these from a clean checkout of the release commit. Every command must exit `0`; do not release on a partially green run.

```bash
pnpm install --frozen-lockfile
pnpm run release:check
```

`release:check` runs:

1. `pnpm run typecheck` (`tsc -b`)
2. `pnpm test` (full Vitest suite)
3. `pnpm run build` (all packages and the CLI)
4. `pnpm audit --audit-level=high`
5. `pnpm -r --filter='./packages/*' --filter='./apps/*' publish --dry-run --no-git-checks`

`publish --dry-run` performs no network writes and no publication. It verifies manifest validity and that `workspace:*` dependencies resolve to concrete versions inside the tarballs.

Additionally verify manually:

- The secret scan in CI reported no credential material.
- `CHANGELOG.md` has a section for the version being released, with accurate entries in the right categories.
- The README installation instructions match the actual distribution method.
- No machine-specific paths, private endpoints, or credentials appear in `git diff`.

---

## 5. Artifact Verification

Before any publication, inspect at least one packed tarball:

```bash
pnpm --filter @berkelium/cli pack --pack-destination /tmp
tar -tzf /tmp/berkelium-cli-1.0.0.tgz
```

Requirements:

- The tarball contains `dist/`, `package.json`, and the license file.
- It does **not** contain `src/`, `tsconfig.json`, `tsconfig.tsbuildinfo`, test files, or local paths.
- `package.json` inside the tarball has no `workspace:*` specifiers; pnpm rewrites them to the release version.
- The `bin` entries (`berkelium`, `bk`) point at existing files under `dist/bin/`.
- `publishConfig.access` is `public` and the `license` field is `Apache-2.0`.

Install and smoke-test the built CLI from the workspace:

```bash
node apps/cli/dist/bin/berkelium.js --version
node apps/cli/dist/bin/berkelium.js --help
```

Installing the packed CLI tarball on its own only works after its `@berkelium/*` dependencies exist in the registry. Until the scope is published, that install will fail dependency resolution; this is expected and not an artifact defect. After publication, verify with the clean-install procedure in section 7.

---

## 6. Publication Procedure (Manual Only)

Prerequisites:

1. You own or are an authorized maintainer of the `@berkelium` npm scope. Verify with `npm whoami` and `npm access list packages @berkelium`. If the scope is unclaimed or you lack access, stop; do not attempt to publish. The scope is already registered and contains unrelated packages (`@berkelium/berkelium`, `@berkelium/grid`, `@berkelium/nlp-core`, `@berkelium/primordial-theme`), so ownership and the availability of `@berkelium/cli` must be confirmed before release.
2. Two-factor authentication is enabled on the publishing account.
3. The pre-release gate passed on the exact commit being released.
4. You have explicit approval to publish from the project maintainer(s).

Steps:

```bash
# 1. Confirm identity and scope ownership
npm whoami
npm access list packages @berkelium

# 2. Re-run the gate on the release commit
pnpm run release:check

# 3. Publish libraries first, then the CLI
pnpm -r --filter='./packages/*' publish --access public --no-git-checks
pnpm --filter @berkelium/cli publish --access public --no-git-checks

# 4. Tag the release commit
git tag -a v1.0.0 -m "v1.0.0"
git push origin v1.0.0
```

Publishing is irreversible in practice: npm does not allow republishing the same version. If a mistake is found after publication, deprecate rather than overwrite.

---

## 7. Post-Publish Verification

From a clean temporary directory, outside the monorepo:

```bash
npm install -g @berkelium/cli@1.0.0
berkelium --version
berkelium --help
```

Confirm that the reported version matches the tag and that no package resolution falls back to a git checkout. Then update `README.md` and `CHANGELOG.md` if the distribution status changed.

---

## 8. Deprecation and Rollback

- **Defective release**: publish a corrected patch version. Do not attempt to delete or replace the published version.
- **Broken release that must not be installed**: mark it deprecated with a message pointing at the fixed version:
  ```bash
  npm deprecate @berkelium/cli@1.0.0 "Broken release; use 1.0.1 or later"
  ```
- **Tarball integrity concern**: contact the registry support channel, rotate any exposed credentials immediately, and document the incident. Do not silently re-publish under a new version to hide the problem.
- Git tags for released versions are never moved or force-pushed.

---

## 9. What Not To Do

- Do not publish from a dirty working tree.
- Do not publish a version that skips the pre-release gate.
- Do not publish packages at mismatched versions.
- Do not add automated publishing, tag-triggered publishing, or release bots without explicit maintainer approval and documentation here.
- Do not claim a release exists until it is visible in the registry and verified by installation.
