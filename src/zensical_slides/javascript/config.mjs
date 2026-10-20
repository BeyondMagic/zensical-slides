const getRuntimeConfig = () =>
	(typeof window !== 'undefined' && window.ZENSICAL_SLIDES_CONFIG) || {};

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
	}
};
