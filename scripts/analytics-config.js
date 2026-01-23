// Configuration for Cloudflare Web Analytics sites
export const sites = [
	{
		name: 'pathsim.org',
		hostname: 'pathsim.org',
		siteTag: process.env.CF_SITE_TAG_PATHSIM || '',
		color: '#377eb8' // PathSim brand color
	},
	{
		name: 'docs.pathsim.org',
		hostname: 'docs.pathsim.org',
		siteTag: process.env.CF_SITE_TAG_PATHSIM_DOCS || '',
		color: '#377eb8'
	},
	{
		name: 'view.pathsim.org',
		hostname: 'view.pathsim.org',
		siteTag: process.env.CF_SITE_TAG_PATHVIEW || '',
		color: '#377eb8'
	},
	{
		name: 'pysimhub.io',
		hostname: 'pysimhub.io',
		siteTag: process.env.CF_SITE_TAG_PYSIMHUB || '',
		color: '#6366f1' // PySimHub brand color
	},
	{
		name: 'milanrother.com',
		hostname: 'milanrother.com',
		siteTag: process.env.CF_SITE_TAG_MILANROTHER || '',
		color: '#00d9c0' // Teal brand color
	}
];

export const config = {
	accountId: process.env.CF_ACCOUNT_ID || '',
	apiToken: process.env.CF_API_TOKEN || '',
	graphqlEndpoint: 'https://api.cloudflare.com/client/v4/graphql',
	maxHistoryDays: 90 // Cloudflare keeps ~90 days
};
