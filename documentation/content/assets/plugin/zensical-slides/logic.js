/**
 * Zensical Slides - Focus-slide presentation widget for Zensical.
 *
 * Modular Architecture:
 * - DOMUtils: Article content resolution and DOM helper functions.
 * - SlideParser: Identifies slide boundaries and tags article child elements.
 * - SlideDeck: Encapsulates slide state, bounds, and visibility toggling.
 * - ControlsUI: Manages floating trigger button and presentation controls overlay.
 * - FullscreenManager: Handles browser fullscreen requests and exits.
 * - MermaidIntegration: Safely initializes and renders Mermaid diagrams.
 * - KeyboardNavigator: Handles keyboard shortcuts while ignoring input fields.
 * - PresentationController: Orchestrates the presentation lifecycle.
 */
(() => {
	const DOMUtils = {
		getArticleContent() {
			return (
				document.querySelector('article.md-content__inner') ||
				document.querySelector('.md-content__inner') ||
				document.querySelector('article')
			);
		},

		isInputElement(target) {
			if (!target || !target.tagName) return false;
			const tag = target.tagName.toUpperCase();
			return tag === 'INPUT' || tag === 'TEXTAREA' || tag === 'SELECT' || target.isContentEditable;
		}
	};

	const SlideParser = {
		parse(article) {
			if (!article) return [];

			const groups = [];
			let currentGroup = [];
			const children = Array.from(article.children);

			for (let i = 0; i < children.length; i++) {
				const el = children[i];
				if (el.id === 'pres-controls') continue;

				if (el.tagName === 'H2') {
					if (currentGroup.length > 0) {
						groups.push(currentGroup);
					}
					currentGroup = [el];
				} else {
					currentGroup.push(el);
				}
			}

			if (currentGroup.length > 0) {
				groups.push(currentGroup);
			}

			groups.forEach((group, gIdx) => {
				group.forEach(el => {
					el.setAttribute('data-pres-slide', String(gIdx));
				});
			});

			return groups.map((elements, index) => ({
				index,
				elements,
				title: this.extractTitle(elements)
			}));
		},

		extractTitle(elements) {
			const heading = elements.find(el => el.tagName === 'H2' || el.tagName === 'H1');
			return heading ? heading.textContent.replace('¶', '').trim() : '';
		}
	};

	class SlideDeck {
		constructor() {
			this.slides = [];
			this.currentIndex = 0;
			this.active = false;
		}

		setSlides(slides) {
			this.slides = slides || [];
			this.currentIndex = 0;
		}

		get count() {
			return this.slides.length;
		}

		get currentSlide() {
			return this.slides[this.currentIndex] || null;
		}

		get isFirst() {
			return this.currentIndex === 0;
		}

		get isLast() {
			return this.currentIndex >= this.count - 1;
		}

		show(index, article) {
			if (this.count === 0) return null;
			this.currentIndex = Math.max(0, Math.min(this.count - 1, index));

			if (!article) return this.currentSlide;

			const children = Array.from(article.children);
			children.forEach(el => {
				if (el.id === 'pres-controls') return;
				const slideAttr = el.getAttribute('data-pres-slide');
				if (slideAttr === null) return;

				if (this.active) {
					el.style.display = slideAttr === String(this.currentIndex) ? '' : 'none';
				} else {
					el.style.display = '';
				}
			});

			window.scrollTo({ top: 0, behavior: 'instant' });
			return this.currentSlide;
		}

		reset(article) {
			if (!article) return;
			const children = Array.from(article.children);
			children.forEach(el => {
				if (el.id !== 'pres-controls') {
					el.style.display = '';
				}
			});
		}
	}

	const FullscreenManager = {
		isFullscreen() {
			return Boolean(document.fullscreenElement);
		},

		toggle() {
			if (!document.fullscreenElement) {
				document.documentElement.requestFullscreen().catch(() => {});
			} else if (document.exitFullscreen) {
				document.exitFullscreen().catch(() => {});
			}
		}
	};

	class ControlsUI {
		constructor(handlers = {}) {
			this.handlers = handlers;
			this.controlsEl = null;
			this.floatingBtn = null;
		}

		ensureFloatingButton(onToggle) {
			let btn = document.getElementById('pres-toggle-btn');
			if (!btn) {
				btn = document.createElement('button');
				btn.id = 'pres-toggle-btn';
				btn.innerHTML = '&#9654; Show';
				btn.title = 'Entrar no modo apresentacao (tecla P)';
				btn.addEventListener('click', onToggle);
				document.body.appendChild(btn);
			}
			this.floatingBtn = btn;
			return btn;
		}

		ensureControls() {
			let controls = document.getElementById('pres-controls');
			if (!controls) {
				controls = document.createElement('div');
				controls.id = 'pres-controls';
				controls.innerHTML =
					'<button id="pres-prev-btn" class="pres-nav-btn pres-left" title="Slide anterior (Seta esquerda)">&#8249;</button>' +
					'<button id="pres-next-btn" class="pres-nav-btn pres-right" title="Proximo slide (Seta direita)">&#8250;</button>' +
					'<div id="pres-bottom-bar">' +
					'<span id="pres-current-title"></span>' +
					'<div class="pres-right-actions">' +
					'<span id="pres-counter"></span>' +
					'<button id="pres-fullscreen-btn" title="Tela cheia">&#x26F6;</button>' +
					'<button id="pres-exit-btn" title="Sair da apresentacao (Esc)">&#10005; Sair</button>' +
					'</div>' +
					'</div>';
				document.body.appendChild(controls);

				document.getElementById('pres-prev-btn')?.addEventListener('click', () => this.handlers.onPrev?.());
				document.getElementById('pres-next-btn')?.addEventListener('click', () => this.handlers.onNext?.());
				document.getElementById('pres-fullscreen-btn')?.addEventListener('click', () => this.handlers.onFullscreen?.());
				document.getElementById('pres-exit-btn')?.addEventListener('click', () => this.handlers.onExit?.());
			}
			this.controlsEl = controls;
			return controls;
		}

		show() {
			const controls = this.ensureControls();
			controls.style.display = 'block';
		}

		hide() {
			if (this.controlsEl) {
				this.controlsEl.style.display = 'none';
			}
		}

		update({ currentIndex, total, title, isFirst, isLast }) {
			const prevBtn = document.getElementById('pres-prev-btn');
			const nextBtn = document.getElementById('pres-next-btn');
			const counter = document.getElementById('pres-counter');
			const titleEl = document.getElementById('pres-current-title');

			if (prevBtn) {
				prevBtn.disabled = isFirst;
				prevBtn.style.opacity = isFirst ? '0.2' : '0.85';
			}

			if (nextBtn) {
				nextBtn.disabled = isLast;
				nextBtn.style.opacity = isLast ? '0.2' : '0.85';
			}

			if (counter) {
				counter.textContent = `${currentIndex + 1} / ${total}`;
			}

			if (titleEl) {
				titleEl.textContent = title || '';
			}
		}
	}

	const MermaidIntegration = {
		init(retries = 25) {
			if (typeof mermaid !== 'undefined') {
				try {
					mermaid.initialize({
						startOnLoad: false,
						theme: 'default',
						securityLevel: 'loose',
						flowchart: { useMaxWidth: true, htmlLabels: true }
					});
					const nodes = document.querySelectorAll('.mermaid:not([data-processed="true"])');
					if (nodes.length > 0) {
						mermaid.run({ nodes });
					}
				} catch (err) {
					console.error('Mermaid render error:', err);
				}
			} else if (retries > 0) {
				setTimeout(() => this.init(retries - 1), 150);
			}
		}
	};

	class KeyboardNavigator {
		constructor(controller) {
			this.controller = controller;
			this.onKeyDown = this.handleKeyDown.bind(this);
		}

		bind() {
			document.addEventListener('keydown', this.onKeyDown);
		}

		unbind() {
			document.removeEventListener('keydown', this.onKeyDown);
		}

		handleKeyDown(e) {
			if (DOMUtils.isInputElement(e.target)) return;

			if (e.key === 'p' || e.key === 'P') {
				if (!e.ctrlKey && !e.metaKey && !e.altKey) {
					this.controller.toggle();
					e.preventDefault();
					return;
				}
			}

			if (!this.controller.isActive) return;

			if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
				this.controller.next();
				e.preventDefault();
			} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
				this.controller.prev();
				e.preventDefault();
			} else if (e.key === 'Escape') {
				this.controller.exit();
				e.preventDefault();
			} else if (e.key === 'f' || e.key === 'F') {
				this.controller.toggleFullscreen();
				e.preventDefault();
			}
		}
	}

	class PresentationController {
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

	const controller = new PresentationController();

	function setup() {
		controller.init();
	}

	if (window.document$) {
		window.document$.subscribe(setup);
	} else if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setup);
	} else {
		setup();
	}

	window.ZensicalSlides = controller;
})();