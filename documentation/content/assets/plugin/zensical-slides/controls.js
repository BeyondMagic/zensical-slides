export class ControlsUI {
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
