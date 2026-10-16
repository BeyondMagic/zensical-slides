import { DOMUtils } from './dom.js';
import { SlideParser } from './parser.js';
import { SlideDeck } from './deck.js';
import { FullscreenManager } from './fullscreen.js';
import { ControlsUI } from './controls.js';
import { MermaidIntegration } from './mermaid.js';
import { KeyboardNavigator } from './keyboard.js';

export class PresentationController {
	constructor() {
		this.deck = new SlideDeck();
		this.controls = new ControlsUI({
			onPrev: () => this.prev(),
			onNext: () => this.next(),
			onFullscreen: () => this.toggleFullscreen(),
			onExit: () => this.exit()
		});
		this.keyboard = new KeyboardNavigator(this);
	}

	get isActive() {
		return this.deck.active;
	}

	init() {
		this.controls.ensureFloatingButton(() => this.toggle());
		this.keyboard.bind();
		MermaidIntegration.init();
	}

	enter() {
		const article = DOMUtils.getArticleContent();
		if (!article) return;

		const slides = SlideParser.parse(article);
		if (slides.length === 0) return;

		this.deck.setSlides(slides);
		this.deck.active = true;

		document.body.classList.add('presentation-mode');
		document.documentElement.classList.add('presentation-mode');

		this.controls.show();
		this.goTo(0);
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
