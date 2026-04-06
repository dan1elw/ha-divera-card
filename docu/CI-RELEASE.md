# CI and Release Process

This document describes the GitHub Actions workflows, branch strategy, commit conventions, and release mechanics for this repository.

---

## Branch strategy

| Branch    | Purpose                                                                                  |
| --------- | ---------------------------------------------------------------------------------------- |
| `main`    | Stable integration branch; tests run on push                                             |
| `develop` | Ongoing development; target for Renovate PRs and feature merges; produces RC prereleases |
| `release` | Triggers stable releases when pushed                                                     |
| `feat/*`  | Feature branches; merged into `develop` via PR                                           |

**Typical flow:**

```
feat/my-feature  →  develop  →  release  →  (tagged GitHub release)
```

---

## GitHub Actions workflows

### `test.yml` — Pytest

Runs on every **pull request** and on **push to `main`**.

- Python 3.12
- Installs `requirements.txt`
- Runs `pytest tests/ --cov=custom_components/divera --cov-report=term-missing -v`

### `lint.yml` — Pre-commit

Runs on every **pull request**.

- Python 3.12
- Executes all [pre-commit](https://pre-commit.com/) hooks defined in `.pre-commit-config.yaml`
- Covers: `ruff` (lint + import sort), `black` (Python formatting), `prettier` (JS/JSON/YAML formatting), `pylint`

### `validate.yml` — Integration validation

Runs on **pull requests targeting `main`, `develop`, `release`, or `feat/*`**.

Two parallel jobs:

| Job        | Tool                              | What it checks                                                |
| ---------- | --------------------------------- | ------------------------------------------------------------- |
| `hassfest` | `home-assistant/actions/hassfest` | HA integration manifest, translations, and platform structure |
| `hacs`     | `hacs/action`                     | HACS compatibility (category: `integration`)                  |

### `pr-title.yml` — Semantic PR title

Runs on PR **open, edit, and synchronize** events.

- Validates the PR title follows the [Conventional Commits](https://www.conventionalcommits.org/) format using `amannn/action-semantic-pull-request`
- Configured in [`.github/semantic.yml`](../.github/semantic.yml) with `titleOnly: true` (commit messages are not validated individually, only the PR title)

### `release.yml` — Semantic Release

Runs on **push to `release`** or **manual workflow dispatch**.

Steps:

1. Checkout with full history (`fetch-depth: 0`)
2. Setup Node.js LTS
3. `npm clean-install`
4. `npx semantic-release`

---

## Commit message conventions

Commits must follow the **Conventional Commits** specification. The type determines the release section and version bump:

| Type       | Release section                 | Version bump    |
| ---------- | ------------------------------- | --------------- |
| `feat`     | Features :sparkles:             | Minor (`x.Y.0`) |
| `feature`  | Features :sparkles:             | Minor           |
| `fix`      | Bug Fixes :bug:                 | Patch (`x.y.Z`) |
| `docs`     | Documentation :books:           | Patch           |
| `refactor` | Code Refactoring :hammer:       | Patch           |
| `test`     | Tests :umbrella:                | Patch           |
| `ci`       | Continuous Integration :wrench: | Patch           |
| `style`    | _(no release section)_          | No release      |
| `chore`    | _(no release section)_          | No release      |

A `BREAKING CHANGE` footer on any commit triggers a **major** version bump (`X.0.0`).

**Examples:**

```
feat: add calendar entity for upcoming events
fix(simulator): align mock data with real attribute structure
docs: update setup guide for native vehicle entities
refactor!: switch alarm entity to binary_sensor

BREAKING CHANGE: alarm_entity config must now point to binary_sensor.*_active_alarm
```

---

## Release process

### Stable release (`release` branch)

1. Merge `develop` into `release` (or push directly)
2. The `release.yml` workflow triggers `semantic-release`
3. Semantic Release:
   a. Analyzes commits since the last tag to determine the next version
   b. Runs `./scripts/prepare-release.sh <version>` which:
   - Updates `"version"` in `custom_components/divera/manifest.json`
   - Creates `custom_components/divera/divera.zip` (the installable archive)
     c. Commits the updated `manifest.json` back to the repository
     d. Creates a GitHub Release with the changelog and attaches `divera.zip` as a release asset
     e. Comments on released issues and pull requests

### Pre-release (`develop` branch)

Pushing to `develop` produces a release candidate tagged `x.y.z-rc.N`.

- The `divera.zip` asset is attached to the prerelease
- Issue/PR comments and release labels are **suppressed** for prereleases
- The `manifest.json` is **not** committed back (prerelease only)

---

## Dependency management (Renovate)

[Renovate](https://docs.renovatebot.com/) is configured in [`.github/renovate.json`](../.github/renovate.json).

| Setting             | Value                                                |
| ------------------- | ---------------------------------------------------- |
| Target branch       | `develop`                                            |
| Timezone            | `Europe/Berlin`                                      |
| Minor/patch updates | Auto-merged, labeled `dependencies`                  |
| Major updates       | Not auto-merged, labeled `dependencies` + `breaking` |

All dependency PRs land on `develop`, not `main`, so they go through the normal develop → release flow before shipping.

---

## Local development setup

Install Python dev dependencies:

```bash
pip install -r requirements.txt
```

Install pre-commit hooks (runs automatically before each commit):

```bash
pre-commit install
```

Run tests with coverage:

```bash
pytest tests/ --cov=custom_components/divera --cov-report=term-missing -v
```

Run linters manually:

```bash
ruff check custom_components/divera/
black --check custom_components/divera/
```
