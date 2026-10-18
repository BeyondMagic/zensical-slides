<p align="center">
  <a href="https://beyondmagic.github.io/zensical-slides/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_white.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_black.png">
      <img alt="Zensical Slides" src="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype.png" width="600">
    </picture>
  </a>
</p>

<p align="center">
  <strong>
    A <a href="https://github.com/BeyondMagic/zensical-slides">Zensical</a> plugin that provides a focus-slide widget, see <a href="https://beyondmagic.github.io/zensical-slides">live-example</a>.
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

### Option 1: Direct URL (No installation required)

Add the minified assets directly to your `zensical.toml`:

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
	"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@1.0.5/dist/zensical-slides.min.css",
]
extra_javascript = [
	"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@1.0.5/dist/zensical-slides.min.mjs",
]
```

### Option 2: Local installation via `pip`

```sh
$ pip install zensical-slides
```

```sh
$ zensical-slides install
```

## Configuration

Configure settings in `zensical.toml`:

```toml
[project.theme]
language = "en" # "en" (English), "ja" (Japanese), or "pt" (Portuguese)

[project.extra.slides]
progress_bar = "top" # "top" (default), "bottom", or "none"
```

Run `zensical-slides install` to regenerate client assets whenever configuration changes.

___

# License

This project is licensed under [LGPLv3](./LICENSE).
