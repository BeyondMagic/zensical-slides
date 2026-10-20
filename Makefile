.PHONY: install test lint build minify

install:
	pip install -e ".[dev]"

test:
	pytest tests/test_plugin.py
	bun test tests/test_keyboard.test.js

lint:
	ruff check .

build:
	python -m build

minify:
	bun build src/zensical_slides/javascript/logic.mjs --minify --outfile=dist/zensical-slides.min.mjs
	bun build src/zensical_slides/stylesheet/ui.css --minify --outfile=dist/zensical-slides.min.css
