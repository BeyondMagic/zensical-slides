import { describe, expect, test } from 'bun:test';
import { DOMUtils } from '../src/zensical_slides/javascript/dom.mjs';
import { KeyboardNavigator } from '../src/zensical_slides/javascript/keyboard.mjs';
import { PresentationController } from '../src/zensical_slides/javascript/controller.mjs';
import { StorageManager } from '../src/zensical_slides/javascript/storage.mjs';

describe('DOMUtils.isInputElement & isInputActive', () => {
	test('identifies standard input elements', () => {
		const input = { tagName: 'INPUT', isContentEditable: false };
		const textarea = { tagName: 'TEXTAREA', isContentEditable: false };
		const select = { tagName: 'SELECT', isContentEditable: false };
		const div = { tagName: 'DIV', isContentEditable: false };

		expect(DOMUtils.isInputElement(input)).toBe(true);
		expect(DOMUtils.isInputElement(textarea)).toBe(true);
		expect(DOMUtils.isInputElement(select)).toBe(true);
		expect(DOMUtils.isInputElement(div)).toBe(false);
		expect(DOMUtils.isInputElement(null)).toBe(false);
	});

	test('identifies contenteditable elements', () => {
		const editable = { tagName: 'DIV', isContentEditable: true };
		expect(DOMUtils.isInputElement(editable)).toBe(true);

		const editableAttr = {
			tagName: 'DIV',
			isContentEditable: false,
			getAttribute: (attr) => (attr === 'contenteditable' ? 'true' : null),
		};
		expect(DOMUtils.isInputElement(editableAttr)).toBe(true);
	});

	test('identifies ARIA role combobox, searchbox, and textbox', () => {
		const combobox = {
			tagName: 'INPUT',
			getAttribute: (attr) => (attr === 'role' ? 'combobox' : null),
		};
		const searchbox = {
			tagName: 'DIV',
			getAttribute: (attr) => (attr === 'role' ? 'searchbox' : null),
		};
		const textbox = {
			tagName: 'SPAN',
			getAttribute: (attr) => (attr === 'role' ? 'textbox' : null),
		};

		expect(DOMUtils.isInputElement(combobox)).toBe(true);
		expect(DOMUtils.isInputElement(searchbox)).toBe(true);
		expect(DOMUtils.isInputElement(textbox)).toBe(true);
	});

	test('identifies element inside search container via closest', () => {
		const childInSearch = {
			tagName: 'SPAN',
			isContentEditable: false,
			closest: (sel) => (sel.includes('.md-search') ? {} : null),
		};
		expect(DOMUtils.isInputElement(childInSearch)).toBe(true);
	});

	test('isInputActive detects composedPath, activeElement, and composing state', () => {
		// Event with isComposing
		expect(DOMUtils.isInputActive({ isComposing: true })).toBe(true);

		// Event with target as input
		const inputEvent = {
			isComposing: false,
			target: { tagName: 'INPUT' },
		};
		expect(DOMUtils.isInputActive(inputEvent)).toBe(true);

		// Event with target as plain div but composedPath containing input
		const shadowEvent = {
			isComposing: false,
			target: { tagName: 'CUSTOM-SEARCH' },
			composedPath: () => [{ tagName: 'INPUT' }, { tagName: 'CUSTOM-SEARCH' }],
		};
		expect(DOMUtils.isInputActive(shadowEvent)).toBe(true);

		// Normal key event on body
		const normalEvent = {
			isComposing: false,
			target: { tagName: 'BODY' },
			composedPath: () => [{ tagName: 'BODY' }],
		};
		expect(DOMUtils.isInputActive(normalEvent)).toBe(false);
	});
});

describe('KeyboardNavigator', () => {
	test('does not toggle or capture keys when in an input field', () => {
		let toggled = false;
		let nextCalled = false;
		const mockController = {
			isActive: true,
			toggle: () => { toggled = true; },
			next: () => { nextCalled = true; },
			prev: () => {},
			exit: () => {},
			toggleFullscreen: () => {},
		};

		const nav = new KeyboardNavigator(mockController);

		// Event from an input
		let prevented = false;
		const inputEvent = {
			key: 'p',
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			target: { tagName: 'INPUT' },
			preventDefault: () => { prevented = true; },
		};

		nav.handleKeyDown(inputEvent);
		expect(toggled).toBe(false);
		expect(prevented).toBe(false);

		// ArrowRight in an input
		const arrowEvent = {
			key: 'ArrowRight',
			target: { tagName: 'INPUT' },
			preventDefault: () => { prevented = true; },
		};
		nav.handleKeyDown(arrowEvent);
		expect(nextCalled).toBe(false);
		expect(prevented).toBe(false);

		// Normal event on body triggers toggle
		const bodyEvent = {
			key: 'p',
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			target: { tagName: 'BODY' },
			preventDefault: () => { prevented = true; },
		};
		nav.handleKeyDown(bodyEvent);
		expect(toggled).toBe(true);
		expect(prevented).toBe(true);
	});

	test('does not toggle or prevent default on mobile viewport', () => {
		let toggled = false;
		let prevented = false;
		const mockController = {
			isActive: false,
			isSupportedViewport: () => false,
			toggle: () => { toggled = true; },
		};

		const nav = new KeyboardNavigator(mockController);
		const bodyEvent = {
			key: 'p',
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			target: { tagName: 'BODY' },
			preventDefault: () => { prevented = true; },
		};

		nav.handleKeyDown(bodyEvent);
		expect(toggled).toBe(false);
		expect(prevented).toBe(false);
	});
});

describe('PresentationController viewport detection', () => {
	test('isSupportedViewport returns false for max-width matching mobile query', () => {
		const controller = new PresentationController();

		// Save original matchMedia
		const originalMatchMedia = globalThis.window?.matchMedia;

		try {
			globalThis.window = {
				matchMedia: (query) => ({
					matches: query.includes('max-width: 44.984375em'),
				}),
			};
			expect(controller.isSupportedViewport()).toBe(false);

			globalThis.window = {
				matchMedia: (query) => ({
					matches: false,
				}),
			};
			expect(controller.isSupportedViewport()).toBe(true);
		} finally {
			if (originalMatchMedia) {
				globalThis.window.matchMedia = originalMatchMedia;
			}
		}
	});

	test('KeyboardNavigator ignores P toggle while still blocking propagation when navigation is pending', () => {
		let toggled = false;
		let prevented = false;
		let stopped = false;
		let immediateStopped = false;
		const nav = new KeyboardNavigator({
			isActive: false,
			isSupportedViewport: () => true,
			isNavigationPending: () => true,
			toggle: () => { toggled = true; },
		});

		nav.handleKeyDown({
			key: 'p',
			ctrlKey: false,
			metaKey: false,
			altKey: false,
			target: { tagName: 'BODY' },
			preventDefault: () => { prevented = true; },
			stopPropagation: () => { stopped = true; },
			stopImmediatePropagation: () => { immediateStopped = true; },
		});

		expect(toggled).toBe(false);
		expect(prevented).toBe(true);
		expect(stopped).toBe(true);
		expect(immediateStopped).toBe(true);
	});

	test('KeyboardNavigator stops event propagation on P and active slide keys so Zensical prev shortcut cannot fire', () => {
		let toggled = 0;
		let exited = 0;
		const nav = new KeyboardNavigator({
			isActive: true,
			isSupportedViewport: () => true,
			isNavigationPending: () => false,
			toggle: () => { toggled += 1; },
			exit: () => { exited += 1; },
			next: () => {},
			prev: () => {},
			toggleFullscreen: () => {},
		});

		for (const key of ['p', 'Escape']) {
			let prevented = false;
			let stopped = false;
			let immediateStopped = false;
			nav.handleKeyDown({
				key,
				ctrlKey: false,
				metaKey: false,
				altKey: false,
				target: { tagName: 'BODY' },
				preventDefault: () => { prevented = true; },
				stopPropagation: () => { stopped = true; },
				stopImmediatePropagation: () => { immediateStopped = true; },
			});
			expect(prevented).toBe(true);
			expect(stopped).toBe(true);
			expect(immediateStopped).toBe(true);
		}

		expect(toggled).toBe(1);
		expect(exited).toBe(1);
	});

	test('KeyboardNavigator registers and removes keydown listener in capture phase', () => {
		const prevDocument = globalThis.document;
		const calls = [];
		globalThis.document = {
			addEventListener: (type, fn, options) => calls.push(['add', type, fn, options]),
			removeEventListener: (type, fn, options) => calls.push(['remove', type, fn, options]),
		};

		try {
			const nav = new KeyboardNavigator({});
			nav.bind();
			nav.unbind();
			expect(calls).toEqual([
				['add', 'keydown', nav.onKeyDown, true],
				['remove', 'keydown', nav.onKeyDown, true],
			]);
		} finally {
			globalThis.document = prevDocument;
		}
	});
});

function withBrowserMocks(fn) {
	const prevWindow = globalThis.window;
	const prevDocument = globalThis.document;
	const prevSessionStorage = globalThis.sessionStorage;

	const store = new Map();
	const listeners = { popstate: [], keydown: [], media: [] };
	const replaceStateCalls = [];
	const bodyClasses = new Set();
	const rootClasses = new Set();

	const makeHeading = (text) => {
		const attrs = new Map();
		return {
			tagName: 'H1',
			textContent: text,
			style: {},
			setAttribute: (k, v) => attrs.set(k, String(v)),
			getAttribute: (k) => (attrs.has(k) ? attrs.get(k) : null),
			querySelector: () => null,
			scrollIntoView: () => {},
		};
	};

	let article = {
		children: [makeHeading('Page 1 Slide')],
	};

	const elementsById = new Map();
	const makeClassList = (set) => ({
		add: (c) => set.add(c),
		remove: (c) => set.delete(c),
		contains: (c) => set.has(c),
	});

	const mockLocation = {
		href: 'https://example.test/page1/',
		pathname: '/page1/',
		search: '',
		hash: '',
	};

	const setLocation = (urlStr) => {
		const parsed = new URL(urlStr, 'https://example.test');
		mockLocation.href = parsed.href;
		mockLocation.pathname = parsed.pathname;
		mockLocation.search = parsed.search;
		mockLocation.hash = parsed.hash;
	};

	globalThis.sessionStorage = {
		getItem: (k) => (store.has(k) ? store.get(k) : null),
		setItem: (k, v) => store.set(k, String(v)),
		removeItem: (k) => store.delete(k),
	};

	globalThis.window = {
		location: mockLocation,
		history: {
			state: { x: 0, y: 120 },
			replaceState(state, title, url) {
				replaceStateCalls.push({ state, title, url });
				this.state = state;
				if (url) setLocation(url);
			},
		},
		scrollTo: () => {},
		matchMedia: () => ({
			matches: false,
			addEventListener: (_type, cb) => listeners.media.push(cb),
		}),
		addEventListener: (type, cb) => {
			if (type === 'popstate') listeners.popstate.push(cb);
		},
	};

	globalThis.document = {
		body: {
			classList: makeClassList(bodyClasses),
			appendChild: (el) => { if (el.id) elementsById.set(el.id, el); },
		},
		documentElement: {
			classList: makeClassList(rootClasses),
			dataset: {},
		},
		getElementById: (id) => elementsById.get(id) || null,
		querySelector: (sel) => (sel.includes('article') || sel.includes('md-content__inner') ? article : null),
		querySelectorAll: () => [],
		createElement: () => ({
			id: '',
			className: '',
			innerHTML: '',
			style: {},
			setAttribute: () => {},
			addEventListener: () => {},
			classList: makeClassList(new Set()),
			appendChild: () => {},
		}),
		addEventListener: (type, cb) => {
			if (type === 'keydown') listeners.keydown.push(cb);
		},
	};

	try {
		return fn({
			setLocation,
			setArticleHeading: (text) => {
				article = { children: [makeHeading(text)] };
			},
			store,
			listeners,
			replaceStateCalls,
			bodyClasses,
		});
	} finally {
		globalThis.window = prevWindow;
		globalThis.document = prevDocument;
		globalThis.sessionStorage = prevSessionStorage;
	}
}

describe('Slow navigation / instant SPA guards', () => {
	test('blocks enter/toggle while instant navigation URL has updated ahead of DOM init()', () => {
		withBrowserMocks(({ setLocation, setArticleHeading, store, replaceStateCalls }) => {
			const controller = new PresentationController();
			controller.init();

			// Page 1 works normally
			controller.enter();
			expect(controller.isActive).toBe(true);
			controller.exit();
			expect(controller.isActive).toBe(false);

			const callsBeforeSlowNav = replaceStateCalls.length;

			// Simulate Zensical instant nav pushing Page 2 URL while XHR is still slow
			setLocation('https://example.test/page2/');
			expect(controller.isNavigationPending()).toBe(true);

			// Pressing P / clicking toggle mid-load must NOT parse Page 1 DOM or pollute Page 2 state
			controller.toggle();
			expect(controller.isActive).toBe(false);
			expect(store.has('zensical-slides:/page2/')).toBe(false);
			expect(replaceStateCalls.length).toBe(callsBeforeSlowNav);

			// Once Page 2 DOM swaps in and document$ triggers init(), enter() works again
			setArticleHeading('Page 2 Slide');
			controller.init();
			expect(controller.isNavigationPending()).toBe(false);

			controller.enter();
			expect(controller.isActive).toBe(true);
			expect(controller.deck.currentSlide.title).toBe('Page 2 Slide');
			expect(store.get('zensical-slides:/page2/')).toContain('"active":true');
		});
	});

	test('init() resets stale active state cleanly and binds global listeners once', () => {
		withBrowserMocks(({ setLocation, setArticleHeading, listeners, bodyClasses }) => {
			const controller = new PresentationController();
			controller.init();
			controller.enter();
			expect(controller.isActive).toBe(true);
			expect(bodyClasses.has('presentation-mode')).toBe(true);

			// Navigate to Page 2 with no saved state
			setLocation('https://example.test/page2/');
			setArticleHeading('Page 2 Slide');
			controller.init();

			expect(controller.isActive).toBe(false);
			expect(bodyClasses.has('presentation-mode')).toBe(false);
			expect(listeners.popstate.length).toBe(1);
			expect(listeners.media.length).toBe(1);
		});
	});

	test('popstate during pending navigation deactivates visuals without mutating destination URL or storage', () => {
		withBrowserMocks(({ setLocation, store, listeners, replaceStateCalls }) => {
			const controller = new PresentationController();
			controller.init();
			controller.enter();
			expect(controller.isActive).toBe(true);

			const callsBefore = replaceStateCalls.length;
			setLocation('https://example.test/page2/?slide=2');
			listeners.popstate[0]();

			expect(controller.isActive).toBe(false);
			expect(replaceStateCalls.length).toBe(callsBefore);
			expect(store.has('zensical-slides:/page2/')).toBe(false);
		});
	});

	test('StorageManager.syncUrl preserves history.state and skips redundant replaceState', () => {
		withBrowserMocks(({ replaceStateCalls }) => {
			StorageManager.syncUrl({ active: true, slideIndex: 1 });
			expect(replaceStateCalls.length).toBe(1);
			expect(replaceStateCalls[0].state).toEqual({ x: 0, y: 120 });
			expect(replaceStateCalls[0].url).toBe('/page1/?slide=2');

			// Calling again with identical state does not invoke replaceState
			StorageManager.syncUrl({ active: true, slideIndex: 1 });
			expect(replaceStateCalls.length).toBe(1);

			StorageManager.syncUrl({ active: false });
			expect(replaceStateCalls.length).toBe(2);
			expect(replaceStateCalls[1].state).toEqual({ x: 0, y: 120 });
			expect(replaceStateCalls[1].url).toBe('/page1/');
		});
	});
});
