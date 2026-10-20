export const DOMUtils = {
	getArticleContent() {
		return (
			document.querySelector('article.md-content__inner') ||
			document.querySelector('.md-content__inner') ||
			document.querySelector('article')
		);
	},

	isInputElement(el) {
		if (!el) return false;

		// Direct check
		if (el.isContentEditable) return true;

		if (el.tagName) {
			const tag = el.tagName.toUpperCase();
			if (tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT') {
				return true;
			}
		}

		if (typeof el.getAttribute === 'function') {
			const role = el.getAttribute('role');
			if (role === 'textbox' || role === 'searchbox' || role === 'combobox') {
				return true;
			}
			const contentEditable = el.getAttribute('contenteditable');
			if (contentEditable !== null && contentEditable !== 'false') {
				return true;
			}
		}

		// Ancestor check
		if (typeof el.closest === 'function') {
			if (
				el.closest(
					'input, textarea, select, [contenteditable]:not([contenteditable="false"]), [role="textbox"], [role="searchbox"], [role="combobox"], [data-md-component="search"], .md-search, [role="search"]'
				)
			) {
				return true;
			}
		}

		return false;
	},

	isInputActive(event) {
		if (event && event.isComposing) return true;

		// 1. Check event target
		if (event && this.isInputElement(event.target)) return true;

		// 2. Check composedPath for shadow DOM or nested elements
		if (event && typeof event.composedPath === 'function') {
			const path = event.composedPath();
			for (let i = 0; i < path.length; i++) {
				if (this.isInputElement(path[i])) return true;
			}
		}

		// 3. Check document.activeElement
		if (typeof document !== 'undefined' && document.activeElement) {
			const active = document.activeElement;
			if (active !== document.body && active !== document.documentElement) {
				if (this.isInputElement(active)) return true;
			}
		}

		// 4. Check if Zensical / Material search modal or dialog is open
		if (typeof document !== 'undefined') {
			const searchToggle =
				document.getElementById('__search') ||
				document.querySelector('[data-md-toggle="search"]');
			if (searchToggle && searchToggle.checked) return true;

			if (
				document.querySelector(
					'.md-search--active, .md-search[aria-expanded="true"], [data-md-component="search"][aria-expanded="true"], dialog[open]'
				)
			) {
				return true;
			}
		}

		return false;
	}
};
