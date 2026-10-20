<p align="center">
  <a href="https://beyondmagic.github.io/zensical-slides/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_white.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_black.png">
      <img alt="Zensical Slides" src="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_white-background_black-foreground.png" width="600">
    </picture>
  </a>
</p>

<p align="center">
  <strong>
    A <a href="https://github.com/BeyondMagic/zensical-slides">Zensical</a> and MkDocs plugin that provides a focus-slide widget, see <a href="https://beyondmagic.github.io/zensical-slides">live-example</a>.
  </strong>
</p>

<p align="center">
  <a href="https://github.com/BeyondMagic/zensical-slides/actions/workflows/publish.yml"><img
    src="https://github.com/BeyondMagic/zensical-slides/actions/workflows/publish.yml/badge.svg?event=release"
    alt="Publish to PyPI"
  /></a>
  <a href="https://github.com/BeyondMagic/zensical-slides/actions/workflows/docs.yml"><img
    src="https://github.com/BeyondMagic/zensical-slides/actions/workflows/docs.yml/badge.svg?event=push"
    alt="Documentation"
  /></a>
</p>

<p align="center">
  <strong>Instant Slide Deck</strong>
  &middot;
  <strong>Automatic Sectioning</strong>
  &middot;
  <strong>Progression Bar</strong>
  &middot;
  <strong>URL Sync & Reload Persistence</strong>
  &middot;
  <strong>Keyboard Controls</strong>
  &middot;
  <strong>Mermaid Diagrams</strong>
  &middot;
  <strong>Multilingual</strong>
</p>

## Purpose

To avoid creating slides in a separate presentation software, this plugin provides a focus-slide widget that allows you to create slides directly in your project documentation.

<p align="center">
  <a href="https://beyondmagic.github.io/zensical-slides/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/image.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/image.png">
      <img alt="Zensical Slides" src="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/image.png">
    </picture>
  </a>
</p>

## Installation

### Option 1: Direct URL (Recommended for now, no installation required)

Because Zensical does not provide an official public plugin API module system yet, linking minified assets directly via CDN is the quickest method. No package installation is needed.

Add the assets to `zensical.toml` (or `mkdocs.yml`):

**Latest version:**

```toml
[project]
extra_css = [
	"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@latest/dist/zensical-slides.min.css",
]
extra_javascript = [
	"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@latest/dist/zensical-slides.min.mjs",
]
```

**Versioned (pinned):**

```toml
[project]
extra_css = [
	"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@1.0.6/dist/zensical-slides.min.css",
]
extra_javascript = [
	"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@1.0.6/dist/zensical-slides.min.mjs",
]
```

### Option 2: Markdown Extension (MkDocs and Zensical)

Install the Python package:

```sh
pip install zensical-slides
```

Enable `zensical_slides` in your markdown extensions. This works in both standard MkDocs and Zensical, inlining bundled assets directly with full offline support.

In `zensical.toml`:

```toml
[project.markdown_extensions.zensical_slides]
progress_bar = "top"  # "top" (default), "bottom", or "none"
language = "en"       # "en" (default), "ja", or "pt"
assets = "local"      # "local" (default, bundled offline), "cdn", or "none"
```

In `mkdocs.yml`:

```yaml
markdown_extensions:
  - zensical_slides:
      progress_bar: top
      language: en
      assets: local
```

### Option 3: Local CLI Installer (`zensical-slides install`)

This method copies assets into your project's `docs_dir` and configures them in `zensical.toml`. It is provided now for compatibility and ahead of future official Zensical module API support.

```sh
pip install zensical-slides
zensical-slides install
```

The command copies `logic.mjs` and `ui.css` into `<docs_dir>/assets/plugin/zensical-slides/` and adds them to `zensical.toml`:

```toml
[project]
extra_css = [
	"assets/plugin/zensical-slides/ui.css",
]
extra_javascript = [
	"assets/plugin/zensical-slides/logic.mjs",
]
```

When using Option 3, re-run `zensical-slides install` whenever you change settings in `[project.theme]` or `[project.extra.slides]`.

## Configuration

Depending on your installation method:

- **Option 1 (Direct URL)**: Configure the language via `[project.theme]` (`language = "en"`) or HTML document `lang` attributes.
- **Option 2 (Markdown Extension)**: Configure settings directly in `[project.markdown_extensions.zensical_slides]` (or `markdown_extensions` in `mkdocs.yml`).
- **Option 3 (CLI Installer)**: Configure settings in `[project.theme]` and `[project.extra.slides]`:

```toml
[project.theme]
language = "en" # "en" (English), "ja" (Japanese), or "pt" (Portuguese)

[project.extra.slides]
progress_bar = "top" # "top" (default), "bottom", or "none"
```

___

# License

This project is licensed under [LGPLv3](./LICENSE).
