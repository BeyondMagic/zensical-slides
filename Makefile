.PHONY: install test lint build

install:
	pip install -e ".[dev]"

test:
	pytest

lint:
	ruff check .

build:
	python -m build
