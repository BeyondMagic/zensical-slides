import { DOMUtils } from './dom.mjs';
import { SlideParser } from './parser.mjs';
import { SlideDeck } from './deck.mjs';
import { FullscreenManager } from './fullscreen.mjs';
import { ControlsUI } from './controls.mjs';
import { MermaidIntegration } from './mermaid.mjs';
import { KeyboardNavigator } from './keyboard.mjs';
import { StorageManager } from './storage.mjs';

export class PresentationController {
	constructor() {
		this.deck = new SlideDeck();
		this.controls = new ControlsUI({
			onPrev: () => this.prev(),
			onNext: () => this.next(),
			onFullscreen: () => this.toggleFullscreen(),
			onExit: () => this.exit(),
			onGoTo: (index) => this.goTo(index)
		});
		this.keyboard = new KeyboardNavigator(this);
	}

	get isActive() {
		return this.deck.active;
	}

	isSupportedViewport() {
		if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
			return true;
		}
		return !window.matchMedia('(max-width: 44.984375em)').matches;
	}

	init() {
		this.controls.ensureFloatingButton(() => this.toggle());
		this.keyboard.bind();
		MermaidIntegration.init();

		// Auto-restore slide state from URL param or sessionStorage if supported
		if (this.isSupportedViewport()) {
			const urlSlide = StorageManager.getUrlSlideParam();
			const savedState = StorageManager.getSavedState();

			if (urlSlide !== null) {
				this.enter(urlSlide);
			} else if (savedState && savedState.active) {
				this.enter(savedState.slideIndex);
			}
		}

		if (typeof window !== 'undefined') {
			window.addEventListener('popstate', () => {
				const param = StorageManager.getUrlSlideParam();
				if (param !== null) {
					if (!this.isActive) {
						this.enter(param);
					} else if (param !== this.deck.currentIndex) {
						this.goTo(param);
					}
				} else if (this.isActive) {
					this.exit();
				}
			});

			if (typeof window.matchMedia === 'function') {
				const mql = window.matchMedia('(max-width: 44.984375em)');
				const handleMediaChange = (e) => {
					if (e.matches && this.isActive) {
						this.exit();
					}
				};
				if (typeof mql.addEventListener === 'function') {
					mql.addEventListener('change', handleMediaChange);
				} else if (typeof mql.addListener === 'function') {
					mql.addListener(handleMediaChange);
				}
			}
		}
	}

	enter(initialIndex = 0) {
		if (!this.isSupportedViewport()) return;

		const article = DOMUtils.getArticleContent();
		if (!article) return;

		const slides = SlideParser.parse(article);
		if (slides.length === 0) return;

		this.deck.setSlides(slides);
		this.deck.active = true;

		document.body.classList.add('presentation-mode');
		document.documentElement.classList.add('presentation-mode');

		this.controls.show();
		const targetIndex = Math.max(0, Math.min(slides.length - 1, initialIndex));
		this.goTo(targetIndex);
	}

	exit() {
		if (!this.deck.active) return;

		const lastSlide = this.deck.currentSlide;
		this.deck.active = false;

		document.body.classList.remove('presentation-mode');
		document.documentElement.classList.remove('presentation-mode');

		this.controls.hide();

		const article = DOMUtils.getArticleContent();
		this.deck.reset(article);

		StorageManager.clearState();
		StorageManager.syncUrl({ active: false });

		if (lastSlide && lastSlide.elements && lastSlide.elements[0]) {
			lastSlide.elements[0].scrollIntoView({ behavior: 'smooth' });
		}
	}

	toggle() {
		this.isActive ? this.exit() : this.enter();
	}

	goTo(index) {
		const article = DOMUtils.getArticleContent();
		const slide = this.deck.show(index, article);
		if (!slide) return;

		this.controls.update({
			currentIndex: this.deck.currentIndex,
			total: this.deck.count,
			title: slide.title,
			isFirst: this.deck.isFirst,
			isLast: this.deck.isLast
		});

		StorageManager.saveState({ active: true, slideIndex: this.deck.currentIndex });
		StorageManager.syncUrl({ active: true, slideIndex: this.deck.currentIndex });
	}

	next() {
		this.goTo(this.deck.currentIndex + 1);
	}

	prev() {
		this.goTo(this.deck.currentIndex - 1);
	}

	toggleFullscreen() {
		FullscreenManager.toggle();
	}
}
