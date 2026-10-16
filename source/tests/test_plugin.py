import tomllib
from pathlib import Path

from zensical_slides import SlidesPlugin, install, main


def test_plugin_asset_paths_exist() -> None:
    plugin = SlidesPlugin()
    assert plugin.get_js_path().is_file()
    assert plugin.get_js_path().name == "logic.js"
    assert plugin.get_css_path().is_file()
    assert plugin.get_css_path().name == "ui.css"
    assert len(plugin.get_js_files()) >= 1
    assert len(plugin.get_css_files()) >= 1


def test_install_with_docs_dir_and_idempotency(tmp_path: Path) -> None:
    docs_dir = tmp_path / "content"
    docs_dir.mkdir()
    config_file = tmp_path / "zensical.toml"
    config_file.write_text(
        '[project]\n'
        'site_name = "test"\n'
        'docs_dir = "content"\n'
        'extra_css = [\n'
        '\t"assets/stylesheet/typography.css"\n'
        ']\n'
        'extra_javascript = []\n',
        encoding="utf-8",
    )

    assets_dir = install(config_file)
    expected_dir = docs_dir / "assets" / "plugin" / "zensical-slides"
    assert assets_dir == expected_dir
    assert (expected_dir / "logic.js").is_file()
    assert (expected_dir / "ui.css").is_file()

    parsed = tomllib.loads(config_file.read_text(encoding="utf-8"))
    assert parsed["project"]["extra_css"] == [
        "assets/stylesheet/typography.css",
        "assets/plugin/zensical-slides/ui.css",
    ]
    assert parsed["project"]["extra_javascript"] == [
        "assets/plugin/zensical-slides/logic.js",
    ]

    # Running install a second time should be idempotent
    content_after_first = config_file.read_text(encoding="utf-8")
    install(tmp_path)
    assert config_file.read_text(encoding="utf-8") == content_after_first


def test_install_without_docs_dir_via_cli(tmp_path: Path) -> None:
    config_file = tmp_path / "zensical.toml"
    config_file.write_text(
        '[project]\n'
        'site_name = "minimal"\n',
        encoding="utf-8",
    )

    rc = main(["install", str(tmp_path)])
    assert rc == 0

    expected_dir = tmp_path / "assets" / "plugin" / "zensical-slides"
    assert (expected_dir / "logic.js").is_file()
    assert (expected_dir / "ui.css").is_file()

    parsed = tomllib.loads(config_file.read_text(encoding="utf-8"))
    assert parsed["project"]["extra_css"] == [
        "assets/plugin/zensical-slides/ui.css",
    ]
    assert parsed["project"]["extra_javascript"] == [
        "assets/plugin/zensical-slides/logic.js",
    ]


def test_language_configuration(tmp_path: Path) -> None:
    from zensical_slides import get_configured_language

    assert get_configured_language({"project": {"theme": {"language": "ja"}}}) == "ja"
    assert get_configured_language({"project": {"theme": {"language": "ja-JP"}}}) == "ja"
    assert get_configured_language({"project": {"theme": {"language": "pt"}}}) == "pt"
    assert get_configured_language({"project": {"theme": {"language": "pt-BR"}}}) == "pt"
    assert get_configured_language({"project": {"theme": {"language": "en"}}}) == "en"
    assert get_configured_language({"project": {"theme": {"language": "fr"}}}) == "en"
    assert get_configured_language({}) == "en"

    config_file = tmp_path / "zensical.toml"
    config_file.write_text(
        '[project]\n'
        'site_name = "test-ja"\n'
        '[project.theme]\n'
        'language = "ja"\n',
        encoding="utf-8",
    )

    assets_dir = install(config_file)
    config_js = assets_dir / "config.js"
    assert config_js.is_file()
    assert 'language: "ja"' in config_js.read_text(encoding="utf-8")

