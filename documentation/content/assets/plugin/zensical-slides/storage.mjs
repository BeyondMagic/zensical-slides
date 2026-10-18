/**
 * Zensical Slides - Slide state persistence & URL synchronization
 */
export const StorageManager = {
	getStorageKey() {
		const path = typeof window !== 'undefined' && window.location ? window.location.pathname : '/';
		return `zensical-slides:${path}`;
	},

	getSavedState() {
		try {
			if (typeof sessionStorage === 'undefined') return null;
			const raw = sessionStorage.getItem(this.getStorageKey());
			if (!raw) return null;
			const parsed = JSON.parse(raw);
			if (parsed && typeof parsed === 'object') {
				return {
					active: Boolean(parsed.active),
					slideIndex: typeof parsed.slideIndex === 'number' && parsed.slideIndex >= 0 ? parsed.slideIndex : 0
				};
			}
		} catch {
			// Fallback if sessionStorage is restricted or corrupted
		}
		return null;
	},

	saveState({ active, slideIndex }) {
		try {
			if (typeof sessionStorage === 'undefined') return;
			const state = {
				active: Boolean(active),
				slideIndex: typeof slideIndex === 'number' && slideIndex >= 0 ? slideIndex : 0,
				timestamp: Date.now()
			};
			sessionStorage.setItem(this.getStorageKey(), JSON.stringify(state));
		} catch {
			// Ignore quota or security exceptions
		}
	},

	clearState() {
		try {
			if (typeof sessionStorage === 'undefined') return;
			sessionStorage.removeItem(this.getStorageKey());
		} catch {
			// Ignore
		}
	},

	getUrlSlideParam() {
		try {
			if (typeof window === 'undefined' || !window.location || !window.location.search) return null;
			const params = new URLSearchParams(window.location.search);
			const slideVal = params.get('slide');
			if (slideVal !== null) {
				const num = parseInt(slideVal, 10);
				if (!isNaN(num) && num >= 1) {
					// 1-based in URL, convert to 0-based for internal slide deck
					return num - 1;
				}
			}
		} catch {
			// Ignore
		}
		return null;
	},

	syncUrl({ active, slideIndex }) {
		try {
			if (typeof window === 'undefined' || !window.history || !window.location) return;
			const url = new URL(window.location.href);
			if (active) {
				const displayIndex = typeof slideIndex === 'number' && slideIndex >= 0 ? slideIndex + 1 : 1;
				url.searchParams.set('slide', String(displayIndex));
			} else {
				url.searchParams.delete('slide');
			}
			const newUrl = url.pathname + url.search + url.hash;
			window.history.replaceState(null, '', newUrl);
		} catch {
			// Ignore
		}
	}
};
