from pathlib import Path

import pytest
from scripts.release import (
    bump_version,
    extract_release_notes,
    parse_semver,
    resolve_version,
    update_documentation_links,
)


def test_parse_semver() -> None:
    assert parse_semver("1.0.5") == (1, 0, 5)
    assert parse_semver("v1.2.3") == (1, 2, 3)
    assert parse_semver("  2.10.4-rc1 ") == (2, 10, 4)
    with pytest.raises(ValueError):
        parse_semver("invalid")


def test_bump_version() -> None:
    assert bump_version("1.0.5", "patch") == "1.0.6"
    assert bump_version("1.0.5", "minor") == "1.1.0"
    assert bump_version("1.0.5", "major") == "2.0.0"


def test_resolve_version() -> None:
    latest = "1.0.5"
    # Explicit version
    assert resolve_version("feat(release): 1.0.6", latest) == "1.0.6"
    assert resolve_version("feat(release): v1.0.6", latest) == "1.0.6"
    assert resolve_version("feat(release): 2.0.0", latest) == "2.0.0"

    # Keywords
    assert resolve_version("feat(release): patch", latest) == "1.0.6"
    assert resolve_version("feat(release): minor", latest) == "1.1.0"
    assert resolve_version("feat(release): major", latest) == "2.0.0"

    # Default / empty
    assert resolve_version("feat(release):", latest) == "1.0.6"
    assert resolve_version("feat(release): automated release", latest) == "1.0.6"


def test_extract_release_notes() -> None:
    msg_single = "feat(release): 1.0.6"
    assert extract_release_notes(msg_single) == ""

    msg_multi = "feat(release): 1.0.6\n\n### Changes\n- Fixed button\n- Added feature\n"
    assert extract_release_notes(msg_multi) == "### Changes\n- Fixed button\n- Added feature"

    msg_spaced = "feat(release): 1.0.6\n\n\n- Quick note\n"
    assert extract_release_notes(msg_spaced) == "- Quick note"


def test_update_documentation_links(tmp_path: Path) -> None:
    sample_content = (
        '# Demo\n'
        'extra_css = [\n'
        '\t"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@1.0.5/dist/zensical-slides.min.css",\n'
        ']\n'
        'extra_javascript = [\n'
        '\t"https://cdn.jsdelivr.net/gh/BeyondMagic/zensical-slides@1.0.5/dist/zensical-slides.min.mjs",\n'
        ']\n'
    )
    doc_file = tmp_path / "index.md"
    doc_file.write_text(sample_content, encoding="utf-8")

    updated = update_documentation_links("1.0.6", [doc_file])
    assert len(updated) == 1
    content = doc_file.read_text(encoding="utf-8")
    assert "@1.0.6/dist/zensical-slides.min.css" in content
    assert "@1.0.6/dist/zensical-slides.min.mjs" in content
    assert "@1.0.5" not in content

    # Running with same version should not modify
    updated_again = update_documentation_links("1.0.6", [doc_file])
    assert len(updated_again) == 0
