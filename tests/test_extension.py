import markdown
from zensical_slides.extension import ZensicalSlidesExtension, makeExtension


def test_extension_default_config() -> None:
    ext = ZensicalSlidesExtension()
    assert ext.getConfig("progress_bar") == "top"
    assert ext.getConfig("language") == "en"
    assert ext.getConfig("assets") == "local"
    assert ext.getConfig("cdn_version") == "latest"


def test_extension_custom_config() -> None:
    ext = ZensicalSlidesExtension(
        progress_bar="bottom",
        language="pt",
        assets="cdn",
        cdn_version="v1.0.0",
    )
    assert ext.getConfig("progress_bar") == "bottom"
    assert ext.getConfig("language") == "pt"
    assert ext.getConfig("assets") == "cdn"
    assert ext.getConfig("cdn_version") == "v1.0.0"


def test_extension_markdown_conversion_local_inlined() -> None:
    md = markdown.Markdown(extensions=["toc", ZensicalSlidesExtension(progress_bar="bottom")])
    html = md.convert("# Title 1\n\nSlide content")

    # In local mode, CSS is inlined and config contains progress_bar=bottom
    assert '<style>' in html
    assert '#pres-toggle-btn' in html
    assert '<script type="module">' in html
    assert 'window.ZENSICAL_SLIDES_CONFIG = {"progress_bar": "bottom", "language": "en"}' in html

    # Verify TOC is not contaminated by style/script
    assert len(md.toc_tokens) == 1
    assert md.toc_tokens[0]["id"] == "title-1"
    assert md.toc_tokens[0]["name"] == "Title 1"


def test_extension_markdown_conversion_cdn() -> None:
    md = markdown.Markdown(extensions=[ZensicalSlidesExtension(assets="cdn", cdn_version="v1.2.0")])
    html = md.convert("# Title\n\nHello world")

    assert (
        '<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@v1.2.0/dist/zensical-slides.min.css">'
        in html
    )
    assert (
        '<script type="module" src="https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@v1.2.0/dist/zensical-slides.min.mjs"></script>'
        in html
    )


def test_extension_markdown_conversion_assets_none() -> None:
    md = markdown.Markdown(extensions=[ZensicalSlidesExtension(assets="none")])
    html = md.convert("# Title\n\nHello world")

    assert '<link rel="stylesheet"' not in html
    assert '<style>' not in html
    assert 'zensical-slides.min.mjs' not in html
    assert 'window.ZENSICAL_SLIDES_CONFIG' in html


def test_make_extension() -> None:
    ext = makeExtension(progress_bar="bottom")
    assert isinstance(ext, ZensicalSlidesExtension)
    assert ext.getConfig("progress_bar") == "bottom"

