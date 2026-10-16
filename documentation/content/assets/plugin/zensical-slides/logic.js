/**
 * Zensical Slides - Entry point
 *
 * Bootstraps the PresentationController across classic script tags and
 * native ES module contexts.
 */

function boot(PresentationController) {
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
	return controller;
}

const scriptSrc = typeof document !== 'undefined' && document.currentScript ? document.currentScript.src : null;
const moduleUrl = scriptSrc
	? new URL('controller.js', scriptSrc).href
	: new URL('./controller.js', import.meta.url).href;

import(moduleUrl)
	.then(({ PresentationController }) => {
		boot(PresentationController);
	})
	.catch((err) => {
		console.error('Failed to load Zensical Slides:', err);
	});