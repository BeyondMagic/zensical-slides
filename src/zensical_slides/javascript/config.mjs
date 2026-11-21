const normalizeHeadingLevel = (val) => {
	if (val === undefined || val === null || val === '') return 2;
	const raw = typeof val === 'string' ? val.trim().replace(/^h/i, '') : val;
	const parsed = Number(raw);
	return Number.isInteger(parsed) && parsed >= 2 && parsed <= 6 ? parsed : 2;
};

const getRuntimeConfig = () =>
	(typeof window !== 'undefined' &&
		(window.ZensicalSlidesConfig || window.ZENSICAL_SLIDES_CONFIG)) ||
	{};

export const config = {
	get language() {
		return getRuntimeConfig().language || 'en';
	},
	get progressBar() {
		return (
			getRuntimeConfig().progress_bar ||
			getRuntimeConfig().progressBar ||
			'top'
		);
	},
	get maxHeadingLevel() {
		const runtime = getRuntimeConfig();
		const datasetLevel =
			typeof document !== 'undefined' &&
			document.documentElement?.dataset?.slidesLevel;
		return normalizeHeadingLevel(
			runtime.max_heading_level ??
				runtime.maxHeadingLevel ??
				runtime.split_level ??
				runtime.splitLevel ??
				datasetLevel
		);
	}
};
