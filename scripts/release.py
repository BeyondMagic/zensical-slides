#!/usr/bin/env python3
"""Release automation helper script for zensical-slides."""

from __future__ import annotations

import argparse
import re
import subprocess
import sys
from pathlib import Path


def parse_semver(v: str) -> tuple[int, int, int]:
    """Parse a semver string like '1.0.5' or 'v1.0.5' into a (major, minor, patch) tuple."""
    v = v.strip().lstrip("v")
    match = re.match(r"^(\d+)\.(\d+)\.(\d+)", v)
    if not match:
        raise ValueError(f"Invalid semver string: {v!r}")
    return int(match.group(1)), int(match.group(2)), int(match.group(3))


def get_latest_version(cwd: Path | None = None) -> str:
    """Find the latest semver git tag in the repository."""
    try:
        proc = subprocess.run(
            ["git", "tag", "-l"],
            cwd=cwd,
            capture_output=True,
            text=True,
            check=True,
        )
        tags = [t.strip() for t in proc.stdout.splitlines() if t.strip()]
    except Exception:
        tags = []

    valid_tags: list[tuple[tuple[int, int, int], str]] = []
    for tag in tags:
        try:
            parsed = parse_semver(tag)
            valid_tags.append((parsed, tag.lstrip("v")))
        except ValueError:
            continue

    if not valid_tags:
        return "1.0.5"

    valid_tags.sort(key=lambda item: item[0])
    return valid_tags[-1][1]


def bump_version(current: str, bump_type: str = "patch") -> str:
    """Bump a version string by patch, minor, or major."""
    major, minor, patch = parse_semver(current)
    b = bump_type.strip().lower()
    if b == "major":
        return f"{major + 1}.0.0"
    if b == "minor":
        return f"{major}.{minor + 1}.0"
    return f"{major}.{minor}.{patch + 1}"


def resolve_version(commit_title: str, latest_version: str | None = None) -> str:
    """Resolve target release version from a commit title like 'feat(release): 1.0.6' or 'feat(release): patch'."""
    pattern = re.compile(r"^feat\(release\)\s*:\s*(.*)$", re.IGNORECASE)
    match = pattern.match(commit_title.strip())

    if match:
        spec = match.group(1).strip()
    else:
        spec = commit_title.strip()

    if not latest_version:
        latest_version = get_latest_version()

    if not spec or spec.lower() in ("patch", "release", "auto"):
        return bump_version(latest_version, "patch")
    if spec.lower() in ("minor", "major"):
        return bump_version(latest_version, spec.lower())

    semver_match = re.match(r"^v?(\d+\.\d+\.\d+.*)$", spec)
    if semver_match:
        return semver_match.group(1).lstrip("v")

    return bump_version(latest_version, "patch")


def extract_release_notes(commit_message: str) -> str:
    """Extract release notes body from a full commit message (omits first line/header)."""
    lines = commit_message.strip().splitlines()
    if len(lines) <= 1:
        return ""

    body_lines = lines[1:]
    while body_lines and not body_lines[0].strip():
        body_lines.pop(0)

    return "\n".join(body_lines).strip()


def update_documentation_links(new_version: str, files: list[Path]) -> list[Path]:
    """Update versioned jsDelivr CDN links in documentation and README files (preserves @latest)."""
    cdn_pattern = re.compile(
        r"(https://cdn\.jsdelivr\.net/gh/BeyondMagic/zensical-slides@)(v?\d+\.\d+\.\d+[^/]*)(/dist/)"
    )

    updated: list[Path] = []
    for f in files:
        if not f.is_file():
            continue
        original = f.read_text(encoding="utf-8")
        replaced = cdn_pattern.sub(rf"\g<1>{new_version}\g<3>", original)
        if replaced != original:
            f.write_text(replaced, encoding="utf-8")
            updated.append(f)

    return updated


def main(argv: list[str] | None = None) -> int:
    parser = argparse.ArgumentParser(description="Zensical Slides Release Helper")
    subparsers = parser.add_subparsers(dest="command", required=True)

    # resolve-version
    p_ver = subparsers.add_parser("resolve-version", help="Resolve new version from commit message")
    p_ver.add_argument("--message", required=True, help="Commit message header or full message")
    p_ver.add_argument("--latest", default=None, help="Latest existing version (optional)")

    # update-docs
    p_docs = subparsers.add_parser("update-docs", help="Update versioned links in documentation")
    p_docs.add_argument("--version", required=True, help="Target release version")
    p_docs.add_argument(
        "--files",
        nargs="*",
        default=["README.md", "documentation/content/index.md"],
        help="Files to update",
    )

    # extract-notes
    p_notes = subparsers.add_parser("extract-notes", help="Extract release notes from commit message")
    p_notes.add_argument("--message", required=True, help="Full commit message")

    args = parser.parse_args(argv)

    if args.command == "resolve-version":
        ver = resolve_version(args.message, args.latest)
        sys.stdout.write(ver)
        return 0

    if args.command == "update-docs":
        target_files = [Path(p) for p in args.files]
        updated = update_documentation_links(args.version, target_files)
        for u in updated:
            print(f"Updated: {u}")
        return 0

    if args.command == "extract-notes":
        notes = extract_release_notes(args.message)
        sys.stdout.write(notes)
        return 0

    return 1


if __name__ == "__main__":
    sys.exit(main())

