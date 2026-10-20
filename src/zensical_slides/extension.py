from __future__ import annotations

import json
from pathlib import Path
from typing import Any

from markdown import Markdown
from markdown.extensions import Extension
from markdown.postprocessors import Postprocessor
from markdown.preprocessors import Preprocessor
from markdown.treeprocessors import Treeprocessor


class _SlidesTreeMarker(Treeprocessor):
    """Mark when ElementTree parsing and all treeprocessors (including TOC) are complete."""

    def run(self, root: Any) -> Any:
        self.md._slides_tree_done = True
        return root


class _SlidesPreReset(Preprocessor):
    """Reset the tree-done marker at the start of conversion."""

    def run(self, lines: list[str]) -> list[str]:
        self.md._slides_tree_done = False
        return lines


class ZensicalSlidesExtension(Extension):
    """Python-Markdown extension for Zensical Slides."""

    def __init__(self, **kwargs: Any) -> None:
        self.config = {
            "progress_bar": ["top", "Position of the slide progress bar ('top' or 'bottom')"],
            "language": ["en", "Language code for the slide UI ('en', 'pt', 'ja')"],
            "assets": [
                "local",
                "Asset loading mode: 'local' (bundled inline), 'cdn', or 'none'",
            ],
            "cdn_version": ["latest", "GitHub release tag for CDN assets"],
            "css_url": ["", "Custom CSS stylesheet URL (overrides default asset injection)"],
            "js_url": ["", "Custom JavaScript module URL (overrides default asset injection)"],
        }
        super().__init__(**kwargs)

    def extendMarkdown(self, md: Markdown) -> None:
        md.registerExtension(self)
        md.preprocessors.register(_SlidesPreReset(md), "zensical_slides_pre", 100)
        md.treeprocessors.register(_SlidesTreeMarker(md), "zensical_slides_tree", -100)
        md.postprocessors.register(
            SlidesAssetInjector(md, self.getConfigs()),
            "zensical_slides",
            25,
        )


class SlidesAssetInjector(Postprocessor):
    """Postprocessor to inject Zensical Slides CSS, JavaScript, and runtime configuration."""

    def __init__(self, md: Markdown, config: dict[str, Any]) -> None:
        super().__init__(md)
        self.config = config

    def _get_css(self) -> str:
        css_url = self.config.get("css_url", "")
        if css_url:
            return f'<link rel="stylesheet" href="{css_url}">'

        mode = self.config.get("assets", "local")
        if mode == "none":
            return ""

        if mode == "cdn":
            version = self.config.get("cdn_version", "latest")
            url = f"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@{version}/dist/zensical-slides.min.css"
            return f'<link rel="stylesheet" href="{url}">'

        # "local" mode: Try to inline local bundled minified CSS
        dist_css = Path(__file__).parent / "dist" / "zensical-slides.min.css"
        if dist_css.is_file():
            content = dist_css.read_text(encoding="utf-8")
            return f"<style>{content}</style>"

        # Fallback to CDN if local bundle is not found
        version = self.config.get("cdn_version", "latest")
        url = f"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@{version}/dist/zensical-slides.min.css"
        return f'<link rel="stylesheet" href="{url}">'

    def _get_js(self) -> str:
        js_url = self.config.get("js_url", "")
        if js_url:
            return f'<script type="module" src="{js_url}"></script>'

        mode = self.config.get("assets", "local")
        if mode == "none":
            return ""

        if mode == "cdn":
            version = self.config.get("cdn_version", "latest")
            url = f"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@{version}/dist/zensical-slides.min.mjs"
            return f'<script type="module" src="{url}"></script>'

        # "local" mode: Try to inline local bundled minified JS
        dist_js = Path(__file__).parent / "dist" / "zensical-slides.min.mjs"
        if dist_js.is_file():
            content = dist_js.read_text(encoding="utf-8")
            return f'<script type="module">{content}</script>'

        # Fallback to CDN if local bundle is not found
        version = self.config.get("cdn_version", "latest")
        url = f"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@{version}/dist/zensical-slides.min.mjs"
        return f'<script type="module" src="{url}"></script>'

    def _get_config_script(self) -> str:
        cfg = {
            "progress_bar": self.config.get("progress_bar", "top"),
            "language": self.config.get("language", "en"),
        }
        return f"<script>window.ZENSICAL_SLIDES_CONFIG = {json.dumps(cfg)};</script>"

    def run(self, text: str) -> str:
        # Only run on full converted document, avoiding intermediate TOC heading runs
        if not getattr(self.md, "_slides_tree_done", False):
            return text
        if "window.ZENSICAL_SLIDES_CONFIG" in text:
            return text

        self.md._slides_tree_done = False

        css_tag = self._get_css()
        js_tag = self._get_js()
        config_script = self._get_config_script()

        # Build injection blocks
        head_block = css_tag
        body_parts = [p for p in (config_script, js_tag) if p]
        body_block = "\n".join(body_parts)

        # Inject into HTML if full document exists, else wrap/append to Markdown fragment
        if "</head>" in text and head_block:
            text = text.replace("</head>", f"{head_block}\n</head>", 1)
        elif head_block:
            text = f"{head_block}\n{text}"

        if "</body>" in text and body_block:
            text = text.replace("</body>", f"{body_block}\n</body>", 1)
        elif body_block:
            text = f"{text}\n{body_block}"

        return text


def makeExtension(**kwargs: Any) -> ZensicalSlidesExtension:
    """Return an instance of ZensicalSlidesExtension."""
    return ZensicalSlidesExtension(**kwargs)

