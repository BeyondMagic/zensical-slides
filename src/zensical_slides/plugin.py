from __future__ import annotations

import argparse
import re
import shutil
import sys
import tomllib
from pathlib import Path

PLUGIN_ASSET_SUBDIR = Path("assets") / "plugin" / "zensical-slides"


class SlidesPlugin:
    """A Zensical plugin that provides the 'slides' focus-slide widget."""

    def __init__(self) -> None:
        base_dir = Path(__file__).parent
        self.javascript_dir = base_dir / "javascript"
        self.stylesheet_dir = base_dir / "stylesheet"

    def get_js_path(self) -> Path:
        """Return the path to the primary JavaScript asset."""
        return self.javascript_dir / "logic.mjs"

    def get_css_path(self) -> Path:
        """Return the path to the primary CSS asset."""
        return self.stylesheet_dir / "ui.css"

    def get_js_files(self) -> list[Path]:
        """Return all JavaScript / module files provided by the plugin."""
        return sorted(self.javascript_dir.glob("*.mjs"))

    def get_css_files(self) -> list[Path]:
        """Return all CSS files provided by the plugin."""
        return sorted(self.stylesheet_dir.glob("*.css"))


# NOTE:
# Zensical's compatibility docs state explicitly that they are
# "holding back on releasing a public API" to allow it to mature,
# and the module system that will replace MkDocs-style plugins is still in progress.
# This means a custom Python plugin cannot currently hook into Zensical's
# build lifecycle to receive its configuration.
# The on_config, on_page_markdown, on_post_build hooks
# you'd normally use in MkDocs are not exposed.
ApresentationPlugin = SlidesPlugin
def find_config_file(target: Path | str | None = None) -> Path:
    """Locate zensical.toml from an explicit file/directory path or current working directory."""
    if target is not None:
        target_path = Path(target)
        if target_path.is_file():
            return target_path.resolve()
        if target_path.is_dir():
            for candidate in (
                target_path / "zensical.toml",
                target_path / "documentation" / "zensical.toml",
            ):
                if candidate.is_file():
                    return candidate.resolve()
        raise FileNotFoundError(f"Could not find zensical.toml in {target_path}")

    cwd = Path.cwd()
    for candidate in (cwd / "zensical.toml", cwd / "documentation" / "zensical.toml"):
        if candidate.is_file():
            return candidate.resolve()

    raise FileNotFoundError(
        "Could not find zensical.toml in the current directory or ./documentation/zensical.toml"
    )


def _add_items_to_toml_list(toml_text: str, key: str, new_items: list[str]) -> str:
    """Ensure `new_items` exist in `[project].<key>` array inside `toml_text`."""
    parsed = tomllib.loads(toml_text)
    project_table = parsed.get("project", {})
    existing_items = list(project_table.get(key, []))

    missing_items = [item for item in new_items if item not in existing_items]
    if not missing_items:
        return toml_text

    pattern = re.compile(
        rf"(^[ \t]*{re.escape(key)}[ \t]*=[ \t]*\[)(.*?)(\])",
        re.MULTILINE | re.DOTALL,
    )
    match = pattern.search(toml_text)
    if match:
        prefix, body, suffix = match.groups()
        body_stripped = body.strip()
        if not body_stripped:
            formatted_items = "".join(f'\n\t"{item}",' for item in missing_items)
            replacement = f"{prefix}{formatted_items}\n{suffix}"
        elif "\n" in body:
            trimmed_body = body.rstrip()
            if not trimmed_body.endswith(","):
                trimmed_body += ","
            formatted_items = "".join(f'\n\t"{item}",' for item in missing_items)
            replacement = f"{prefix}{trimmed_body}{formatted_items}\n{suffix}"
        else:
            trimmed_body = body_stripped.rstrip(",")
            appended = ", ".join(f'"{item}"' for item in missing_items)
            replacement = f"{prefix}{trimmed_body}, {appended}{suffix}"

        return toml_text[: match.start()] + replacement + toml_text[match.end() :]

    # If the key does not exist yet, insert it into [project]
    project_header = re.search(r"^\[project\][ \t]*$", toml_text, re.MULTILINE)
    formatted_list = (
        f"{key} = [\n"
        + "".join(f'\t"{item}",\n' for item in missing_items)
        + "]\n"
    )
    if project_header:
        insert_pos = project_header.end()
        return toml_text[:insert_pos] + "\n" + formatted_list + toml_text[insert_pos:]

    return f"[project]\n{formatted_list}\n{toml_text}"


SUPPORTED_LANGUAGES = {"en", "ja", "pt"}
SUPPORTED_PROGRESS_BAR_POSITIONS = {"top", "bottom", "none"}


def get_configured_language(config_data: dict) -> str:
    """Read and normalize project.theme.language from zensical.toml.

    Supported options: 'en' (English), 'ja' (Japanese), and 'pt' (Portuguese).
    Defaults to 'en' if missing or not supported.
    """
    lang = config_data.get("project", {}).get("theme", {}).get("language", "en")
    if not isinstance(lang, str):
        return "en"
    normalized = lang.strip().lower().split("-")[0].split("_")[0]
    return normalized if normalized in SUPPORTED_LANGUAGES else "en"


def get_configured_progress_bar(config_data: dict) -> str:
    """Read progress_bar position from zensical.toml.

    Supported options: 'top' (default), 'bottom' (above the bottom bar), or 'none'.
    Checks:
      - [project.extra.slides] progress_bar = "top" | "bottom" | "none"
      - [project.theme.slides] progress_bar = "top" | "bottom" | "none"
      - [project.extra] slides_progress_bar = ...
    """
    project_cfg = config_data.get("project", {})
    extra_cfg = project_cfg.get("extra", {})
    slides_cfg = extra_cfg.get("slides")
    if not isinstance(slides_cfg, dict):
        slides_cfg = project_cfg.get("theme", {}).get("slides")

    pos = None
    if isinstance(slides_cfg, dict):
        pos = slides_cfg.get("progress_bar")
    if pos is None:
        pos = extra_cfg.get("slides_progress_bar")

    if isinstance(pos, bool):
        return "top" if pos else "none"
    if isinstance(pos, str):
        normalized = pos.strip().lower()
        if normalized in SUPPORTED_PROGRESS_BAR_POSITIONS:
            return normalized
        if normalized in ("off", "false", "disabled", "hidden"):
            return "none"
        if normalized in ("on", "true", "enabled"):
            return "top"
    return "top"


def install(target: Path | str | None = None) -> Path:
    """Copy plugin JS/CSS assets into the target Zensical docs_dir and register them in zensical.toml."""
    config_file = find_config_file(target)
    raw_toml = config_file.read_text(encoding="utf-8")
    config_data = tomllib.loads(raw_toml)

    project_cfg = config_data.get("project", {})
    docs_dir_setting = project_cfg.get("docs_dir")
    if docs_dir_setting:
        docs_dir = (config_file.parent / docs_dir_setting).resolve()
    else:
        docs_dir = config_file.parent.resolve()

    plugin_assets = docs_dir / PLUGIN_ASSET_SUBDIR
    plugin_assets.mkdir(parents=True, exist_ok=True)

    plugin = SlidesPlugin()
    css_rel_paths: list[str] = []
    js_rel_paths: list[str] = []

    for css_file in plugin.get_css_files():
        dest = plugin_assets / css_file.name
        shutil.copy2(css_file, dest)
        if css_file.name == plugin.get_css_path().name:
            css_rel_paths.append(dest.relative_to(docs_dir).as_posix())

    for js_file in plugin.get_js_files():
        dest = plugin_assets / js_file.name
        shutil.copy2(js_file, dest)
        if js_file.name == plugin.get_js_path().name:
            js_rel_paths.append(dest.relative_to(docs_dir).as_posix())

    # Write the configuration resolved from zensical.toml
    language = get_configured_language(config_data)
    progress_bar = get_configured_progress_bar(config_data)
    config_mjs = plugin_assets / "config.mjs"
    config_mjs.write_text(
        f'export const config = {{\n\tlanguage: "{language}",\n\tprogressBar: "{progress_bar}"\n}};\n',
        encoding="utf-8",
    )

    updated_toml = raw_toml
    if css_rel_paths:
        updated_toml = _add_items_to_toml_list(updated_toml, "extra_css", css_rel_paths)
    if js_rel_paths:
        updated_toml = _add_items_to_toml_list(
            updated_toml, "extra_javascript", js_rel_paths
        )

    # Validate that the resulting TOML parses cleanly before writing
    tomllib.loads(updated_toml)
    if updated_toml != raw_toml:
        config_file.write_text(updated_toml, encoding="utf-8")

    return plugin_assets


def main(argv: list[str] | None = None) -> int:
    """CLI entrypoint for `zensical-slides`."""
    parser = argparse.ArgumentParser(
        prog="zensical-slides",
        description="Install and manage the zensical-slides plugin.",
    )
    subparsers = parser.add_subparsers(dest="command")

    install_parser = subparsers.add_parser(
        "install",
        help="Copy plugin assets into docs_dir and register them in zensical.toml.",
    )
    install_parser.add_argument(
        "path",
        nargs="?",
        default=None,
        help="Optional path to zensical.toml or the project directory.",
    )

    args = parser.parse_args(argv)
    if args.command == "install":
        assets_dir = install(args.path)
        print(f"Installed zensical-slides assets to {assets_dir}")
        return 0

    parser.print_help()
    return 1


if __name__ == "__main__":
    sys.exit(main())
