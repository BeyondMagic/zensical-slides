<p align="center">
  <a href="https://beyondmagic.github.io/zensical-slides/">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_white.png">
      <source media="(prefers-color-scheme: light)" srcset="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype_black.png">
      <img alt="Zensical Slides" src="https://raw.githubusercontent.com/BeyondMagic/zensical-slides/master/documentation/content/assets/logotype.png" width="600">
    </picture>
  </a>
</p>

# Project purpose

<!-- This project will be used as live example of the plugin working. -->

A [Zensical](https://zensical.org/) plugin that provides a focus-slide widget, see [live-example](https://beyondmagic.github.io/zensical-slides)

## Installation

```sh
$ pip install zensical-slides
```
<!--
The following will:
1. Set constant `plugin_assets` as `zensical.toml:docs_dir` (if docs_dir is not set, get the folder `zensical.toml`) + `assets/plugin/zensical-slides`;
1. Copy `source/{javascript,stylesheet}/*` to new or existing at `plugin_assets`;
2. Check and add relative path of `plugin_assets/*` to `zensical.toml:extra_javascript`.
-->

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
