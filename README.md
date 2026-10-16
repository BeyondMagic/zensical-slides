# Project purpose

<!-- This project will be used as live example of the plugin working. -->

A [Zensical](https://zensical.org/) plugin that provides an apresentation focus-slide widget, see [live-example](https://beyondmagic.github.io/zensical-apresentation)

## Installation

```sh
$ pip install zensical-apresentation
```
<!--
The following will:
1. Set constant `plugin_assets` as `zensical.toml:docs_dir` (if docs_dir is not set, get the folder `zensical.toml`) + `assets/plugin/zensical-apresentation`;
1. Copy `source/{javascript,stylesheet}/*` to new or existing at `plugin_assets`;
2. Check and add relative path of `plugin_assets/*` to `zensical.toml:extra_javascript`.
-->

```sh
$ zensical-apresentation install
```

<!--

## Configuration

```toml
# Register the plugin setting
[project.plugins.apresentation]
# No options yet.
```

-->

___

# License

This project is licensed under [LGPLv3](./LICENSE).
