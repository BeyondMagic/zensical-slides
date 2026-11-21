import { config } from './config.mjs';

const PAGE_LEVEL_DIRECTIVE_RE =
	/^slides:\s*(?:max[-_]?heading[-_]?level|max[-_]?level|split[-_]?level|level|split)\s*=\s*(h?[2-6])$/i;
const MANUAL_BREAK_DIRECTIVE_RE = /^(?:slide(?:\s*:\s*break|\s+break)?|split)$/i;

function clampHeadingLevel(raw) {
	if (raw === undefined || raw === null || raw === '') return null;
	const cleaned = typeof raw === 'string' ? raw.trim().replace(/^h/i, '') : raw;
	const parsed = Number(cleaned);
	return Number.isInteger(parsed) && parsed >= 2 && parsed <= 6 ? parsed : null;
}

export const SlideParser = {
	getHeadingLevel(el) {
		if (!el || typeof el.tagName !== 'string') return null;
		const match = el.tagName.match(/^H([1-6])$/i);
		return match ? Number(match[1]) : null;
	},

	hasClass(el, className) {
		if (!el) return false;
		if (typeof el.classList?.contains === 'function' && el.classList.contains(className)) {
			return true;
		}
		if (typeof el.getAttribute === 'function') {
			const attr = el.getAttribute('class');
			if (typeof attr === 'string' && attr.split(/\s+/).includes(className)) {
				return true;
			}
		}
		return false;
	},

	hasAttr(el, attrName) {
		if (!el || typeof el.getAttribute !== 'function') return false;
		const val = el.getAttribute(attrName);
		return val !== null && val !== undefined && val !== 'false';
	},

	hasSlideClass(el) {
		return this.hasClass(el, 'slide') || this.hasAttr(el, 'data-slide');
	},

	hasNoSlide(el) {
		return this.hasClass(el, 'no-slide') || this.hasAttr(el, 'data-no-slide');
	},

	parseCommentDirective(text) {
		if (typeof text !== 'string') return null;
		const trimmed = text.trim();
		if (!trimmed) return null;

		const levelMatch = trimmed.match(PAGE_LEVEL_DIRECTIVE_RE);
		if (levelMatch) {
			const level = clampHeadingLevel(levelMatch[1]);
			return level ? { type: 'level', level } : null;
		}

		if (MANUAL_BREAK_DIRECTIVE_RE.test(trimmed)) {
			return { type: 'break' };
		}

		return null;
	},

	resolveMaxHeadingLevel(nodes, article, options = {}) {
		let maxLevel =
			clampHeadingLevel(
				options.maxHeadingLevel ??
					options.max_heading_level ??
					options.splitLevel ??
					config.maxHeadingLevel
			) ?? 2;

		const articleLevel =
			typeof article?.getAttribute === 'function'
				? clampHeadingLevel(article.getAttribute('data-slides-level'))
				: null;
		if (articleLevel !== null) {
			maxLevel = articleLevel;
		}

		for (let i = 0; i < nodes.length; i++) {
			const node = nodes[i];
			if (node && node.nodeType === 8) {
				const dir = this.parseCommentDirective(node.nodeValue ?? node.textContent ?? '');
				if (dir && dir.type === 'level') {
					maxLevel = dir.level;
				}
			} else if (
				node &&
				typeof node.getAttribute === 'function' &&
				(node.nodeType === 1 || !node.nodeType)
			) {
				const elLevel = clampHeadingLevel(node.getAttribute('data-slides-level'));
				if (elLevel !== null) {
					maxLevel = elLevel;
				}
			}
		}

		return maxLevel;
	},

	isMetadataElement(el) {
		if (!el || typeof el.tagName !== 'string') return false;
		const tag = el.tagName.toUpperCase();
		if (tag === 'HR') return true;
		if (el.id === '__skip' || this.hasClass(el, 'md-content__button')) return true;
		if (tag === 'P') {
			if (this.hasClass(el, 'apresentador')) return true;
			if ((el.textContent || '').trim() === '' && (!el.children || el.children.length === 0)) {
				return true;
			}
		}
		return false;
	},

	isHeaderOnlyGroup(group) {
		if (!group || group.length === 0) return false;
		let hasSectionHeading = false;
		for (let i = 0; i < group.length; i++) {
			const el = group[i];
			const level = this.getHeadingLevel(el);
			if (level === 1) return false;
			if (level !== null && level >= 2) {
				hasSectionHeading = true;
				continue;
			}
			if (this.isMetadataElement(el)) continue;
			return false;
		}
		return hasSectionHeading;
	},

	parse(article, options = {}) {
		if (!article) return [];

		const rawNodes = Array.from(article.childNodes || article.children || []);
		const maxLevel = this.resolveMaxHeadingLevel(rawNodes, article, options);

		const groups = [];
		let currentGroup = null;
		let pendingManualBreak = false;
		let lastH2Title = '';
		let lastContextTitle = '';

		const startNewGroup = (initialElements, parentTitle, rootLevel) => ({
			elements: initialElements,
			parentH2Title: parentTitle,
			rootLevel
		});

		for (let i = 0; i < rawNodes.length; i++) {
			const node = rawNodes[i];
			if (!node) continue;

			if (node.nodeType === 8) {
				const dir = this.parseCommentDirective(node.nodeValue ?? node.textContent ?? '');
				if (dir && dir.type === 'break') {
					pendingManualBreak = true;
				}
				continue;
			}

			// Ignore text nodes (inter-element whitespace in DOM childNodes)
			const isElement = node.nodeType === 1 || (!node.nodeType && typeof node.tagName === 'string');
			if (!isElement) continue;

			if (node.id === 'pres-controls') continue;

			const headingLevel = this.getHeadingLevel(node);
			const noSlide = this.hasNoSlide(node);
			const isAutoHeadingBreak =
				headingLevel !== null && headingLevel >= 2 && headingLevel <= maxLevel && !noSlide;
			const isClassBreak = this.hasSlideClass(node) && !noSlide;
			const isHr = typeof node.tagName === 'string' && node.tagName.toUpperCase() === 'HR';
			const isManualBreak = pendingManualBreak && !isHr;
			const shouldSplit = isManualBreak || isAutoHeadingBreak || isClassBreak;

			if (shouldSplit) {
				const canMergeUnderParentHeading =
					!isManualBreak &&
					!isClassBreak &&
					currentGroup !== null &&
					headingLevel !== null &&
					currentGroup.rootLevel !== null &&
					headingLevel > currentGroup.rootLevel &&
					this.isHeaderOnlyGroup(currentGroup.elements);

				if (canMergeUnderParentHeading) {
					currentGroup.elements.push(node);
				} else {
					if (currentGroup && currentGroup.elements.length > 0) {
						groups.push(currentGroup);
					}
					const parentCtx =
						headingLevel === null && !isClassBreak && lastContextTitle
							? lastContextTitle
							: lastH2Title;
					currentGroup = startNewGroup([node], parentCtx, headingLevel);
				}
				pendingManualBreak = false;
			} else {
				if (!currentGroup) {
					currentGroup = startNewGroup([], lastH2Title, headingLevel === 1 ? 1 : null);
				}
				currentGroup.elements.push(node);
				if (currentGroup.rootLevel === null && headingLevel !== null) {
					currentGroup.rootLevel = headingLevel;
				}
			}

			if (headingLevel === 2) {
				lastH2Title = this.extractHeadingText(node);
				lastContextTitle = lastH2Title;
				if (currentGroup) {
					currentGroup.parentH2Title = lastH2Title;
				}
			} else if (headingLevel !== null && headingLevel >= 3) {
				const sub = this.extractHeadingText(node);
				lastContextTitle = lastH2Title && sub ? `${lastH2Title} › ${sub}` : sub || lastH2Title;
			}
		}

		if (currentGroup && currentGroup.elements.length > 0) {
			groups.push(currentGroup);
		}

		groups.forEach((group, gIdx) => {
			group.elements.forEach((el) => {
				el.setAttribute('data-pres-slide', String(gIdx));
			});
		});

		return groups.map((group, index) => ({
			index,
			elements: group.elements,
			title: this.extractTitle(group.elements, group.parentH2Title)
		}));
	},

	extractHeadingText(heading) {
		if (!heading || typeof heading.textContent !== 'string') return '';
		return heading.textContent.replace('¶', '').trim();
	},

	extractTitle(elements, parentH2Title = '') {
		const h2 = elements.find((el) => el.tagName === 'H2');
		if (h2) return this.extractHeadingText(h2);

		const h1 = elements.find((el) => el.tagName === 'H1');
		if (h1) return this.extractHeadingText(h1);

		const subHeading = elements.find((el) => {
			const lvl = this.getHeadingLevel(el);
			return lvl !== null && lvl >= 3;
		});
		if (subHeading) {
			const subTitle = this.extractHeadingText(subHeading);
			if (parentH2Title && subTitle && parentH2Title !== subTitle) {
				return `${parentH2Title} › ${subTitle}`;
			}
			return subTitle;
		}

		return parentH2Title || '';
	}
};
