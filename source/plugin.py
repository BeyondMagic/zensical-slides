from pathlib import Path

class ApresentationPlugin:
    """A Zensical plugin that provides the 'apresentation' focus-slide widget."""

    def __init__(self):
        self.javascript_dir = Path(__file__).parent / "javascript"
        self.stylesheet_dir = Path(__file__).parent / "styleshset"

    def get_js_path(self) -> Path:
        """Return the path to the JavaScript asset."""
        return self.javascript_dir / "apresentation.js"

    def get_css_path(self) -> Path:
        """Return the path to the CSS asset."""
        return self.stylesheet_dir / "apresentation.css"
