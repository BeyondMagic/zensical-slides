import { describe, expect, test } from 'bun:test';
import { SlideParser } from '../src/zensical_slides/javascript/parser.mjs';

function makeEl(tag, text = '', { classes = [], attrs = {}, id = '' } = {}) {
	const attrMap = new Map(Object.entries(attrs));
	if (classes.length > 0 && !attrMap.has('class')) {
		attrMap.set('class', classes.join(' '));
	}
	const classSet = new Set(classes);
	return {
		nodeType: 1,
		tagName: tag.toUpperCase(),
		id,
		textContent: text,
		children: [],
		classList: {
			contains: (c) => classSet.has(c),
			add: (c) => classSet.add(c),
			remove: (c) => classSet.delete(c),
		},
		getAttribute: (k) => (attrMap.has(k) ? attrMap.get(k) : null),
		setAttribute: (k, v) => attrMap.set(k, String(v)),
	};
}

function makeComment(text) {
	return { nodeType: 8, nodeValue: text };
}

function makeText(text = '\n') {
	return { nodeType: 3, nodeValue: text };
}

describe('SlideParser sub-heading and marker splitting', () => {
	test('defaults to H2 splitting only and ignores H3 headings', () => {
		const article = {
			childNodes: [
				makeEl('h1', 'Capa'),
				makeEl('h2', 'Secao 1¶'),
				makeEl('p', 'Texto 1'),
				makeEl('h3', 'Subsecao 1.1¶'),
				makeEl('p', 'Texto 2'),
				makeEl('h2', 'Secao 2¶'),
			],
		};

		const slides = SlideParser.parse(article);
		expect(slides.length).toBe(3);
		expect(slides.map((s) => s.title)).toEqual(['Capa', 'Secao 1', 'Secao 2']);
	});

	test('splits H3 headings when <!-- slides: level=3 --> is present and builds breadcrumb title', () => {
		const article = {
			childNodes: [
				makeComment(' slides: level=3 '),
				makeText('\n'),
				makeEl('h1', 'Capa'),
				makeEl('h2', '4. Portfolio de ADRs¶'),
				makeEl('p', 'Resumo ADR 0004'),
				makeEl('h3', 'Gatilhos de revisao¶'),
				makeEl('p', 'Tabela de gatilhos'),
			],
		};

		const slides = SlideParser.parse(article);
		expect(slides.length).toBe(3);
		expect(slides.map((s) => s.title)).toEqual([
			'Capa',
			'4. Portfolio de ADRs',
			'4. Portfolio de ADRs › Gatilhos de revisao',
		]);
		expect(slides[2].elements.map((e) => e.tagName)).toEqual(['H3', 'P']);
	});

	test('absorbs empty H2 + presenter metadata into first H3 slide to prevent orphan header slide', () => {
		const article = {
			childNodes: [
				makeComment('slides: level=3'),
				makeEl('h2', '4. Portfolio de ADRs¶'),
				makeEl('p', 'Apresentacao: Joao V. Farias', { classes: ['apresentador'] }),
				makeEl('h3', 'Decisao da E4¶'),
				makeEl('p', 'Conteudo 1'),
				makeEl('h3', 'Gatilhos¶'),
				makeEl('p', 'Conteudo 2'),
			],
		};

		const slides = SlideParser.parse(article);
		expect(slides.length).toBe(2);
		expect(slides[0].title).toBe('4. Portfolio de ADRs');
		expect(slides[0].elements.map((e) => e.tagName)).toEqual(['H2', 'P', 'H3', 'P']);
		expect(slides[1].title).toBe('4. Portfolio de ADRs › Gatilhos');
		expect(slides[1].elements.map((e) => e.tagName)).toEqual(['H3', 'P']);
	});

	test('supports explicit <!-- slide --> comments and .slide heading class on level 2 pages', () => {
		const article = {
			childNodes: [
				makeEl('h2', 'Secao Longa¶'),
				makeEl('p', 'Bloco A'),
				makeComment(' slide '),
				makeEl('hr', ''),
				makeEl('p', 'Bloco B'),
				makeEl('h3', 'Subtitulo destacado¶', { classes: ['slide'] }),
				makeEl('p', 'Bloco C'),
			],
		};

		const slides = SlideParser.parse(article);
		expect(slides.length).toBe(3);
		expect(slides[0].title).toBe('Secao Longa');
		expect(slides[0].elements.map((e) => e.tagName)).toEqual(['H2', 'P', 'HR']);
		expect(slides[1].title).toBe('Secao Longa');
		expect(slides[1].elements.map((e) => e.tagName)).toEqual(['P']);
		expect(slides[2].title).toBe('Secao Longa › Subtitulo destacado');
		expect(slides[2].elements.map((e) => e.tagName)).toEqual(['H3', 'P']);
	});

	test('respects page override <!-- slides: level=2 --> over global options and .no-slide opt-out', () => {
		const articleOverride = {
			childNodes: [
				makeComment('slides: level=2'),
				makeEl('h2', 'Secao'),
				makeEl('h3', 'Sub 1'),
				makeEl('h3', 'Sub 2'),
			],
		};
		const overrideSlides = SlideParser.parse(articleOverride, { maxHeadingLevel: 3 });
		expect(overrideSlides.length).toBe(1);

		const articleNoSlide = {
			childNodes: [
				makeEl('h2', 'Secao'),
				makeEl('h3', 'Agrupado', { classes: ['no-slide'] }),
				makeEl('p', 'Junto do H2'),
			],
		};
		const noSlideRes = SlideParser.parse(articleNoSlide, { maxHeadingLevel: 3 });
		expect(noSlideRes.length).toBe(1);
		expect(noSlideRes[0].elements.length).toBe(3);
	});
});
