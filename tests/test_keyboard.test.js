import { describe, expect, test, beforeEach } from 'bun:test';
import { DOMUtils } from '../src/zensical_slides/javascript/dom.mjs';
import { KeyboardNavigator } from '../src/zensical_slides/javascript/keyboard.mjs';

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
});
