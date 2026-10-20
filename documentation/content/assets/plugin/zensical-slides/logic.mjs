/**
 * Zensical Slides - Entry point
 */
import { PresentationController } from './controller.mjs';

let controller = typeof window !== 'undefined' ? window.ZensicalSlides : null;

if (!controller) {
	controller = new PresentationController();

	function setup() {
		controller.init();
	}

	if (typeof window !== 'undefined' && window.document$) {
		window.document$.subscribe(setup);
	} else if (typeof document !== 'undefined' && document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', setup);
	} else {
		setup();
	}

	if (typeof window !== 'undefined') {
		window.ZensicalSlides = controller;
	}
}

export default controller;