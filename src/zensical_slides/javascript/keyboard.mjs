import { DOMUtils } from './dom.mjs';

export class KeyboardNavigator {
	constructor(controller) {
		this.controller = controller;
		this.onKeyDown = this.handleKeyDown.bind(this);
	}

	bind() {
		document.addEventListener('keydown', this.onKeyDown, true);
	}

	unbind() {
		document.removeEventListener('keydown', this.onKeyDown, true);
	}

	consumeEvent(e) {
		e.preventDefault?.();
		e.stopPropagation?.();
		e.stopImmediatePropagation?.();
	}

	handleKeyDown(e) {
		if (DOMUtils.isInputActive(e)) return;

		if (e.key === 'P') {
			if (!e.ctrlKey && !e.metaKey && !e.altKey) {
				if (typeof this.controller.isSupportedViewport === 'function' && !this.controller.isSupportedViewport()) {
					return;
				}
				if (typeof this.controller.isNavigationPending === 'function' && this.controller.isNavigationPending()) {
					this.consumeEvent(e);
					return;
				}
				this.controller.toggle();
				this.consumeEvent(e);
				return;
			}
		}

		if (!this.controller.isActive) return;

		if (e.key === 'ArrowRight' || e.key === 'PageDown' || e.key === ' ') {
			this.controller.next();
			this.consumeEvent(e);
		} else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
			this.controller.prev();
			this.consumeEvent(e);
		} else if (e.key === 'Escape') {
			this.controller.exit();
			this.consumeEvent(e);
		} else if (e.key === 'f' || e.key === 'F') {
			this.controller.toggleFullscreen();
			this.consumeEvent(e);
		}
	}
}
