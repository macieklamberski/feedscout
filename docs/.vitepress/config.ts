import { defineConfig } from 'vitepress'

const hostname = 'https://feedscout.dev'

export default defineConfig({
  title: 'Feedscout',
  titleTemplate: ':title',
  description:
    'Advanced feed autodiscovery for JavaScript. Collect feed information from any webpage using multiple discovery methods.',
  lastUpdated: true,
  cleanUrls: true,
  sitemap: {
    hostname,
  },
  transformHead: ({ pageData }) => {
    const canonicalUrl = `${hostname}/${pageData.relativePath}`
      .replace(/index\.md$/, '')
      .replace(/\.md$/, '')
      .replace(/\/$/, '')

    return [['link', { rel: 'canonical', href: canonicalUrl }]]
  },
  head: [
    ['meta', { property: 'og:site_name', content: 'Feedscout' }],
    [
      'script',
      { type: 'application/ld+json' },
      JSON.stringify({
        '@context': 'https://schema.org',
        '@type': 'WebSite',
        name: 'Feedscout',
        url: hostname,
      }),
    ],
    [
      'script',
      {
        async: '',
        src: 'https://stats.lamberski.com/script.js',
        'data-website-id': '5c218e6f-78ec-473e-9936-5e2dda0ddc67',
      },
    ],
  ],
  themeConfig: {
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: 'Quick Start', link: '/quick-start' },
      { text: 'Discover Feeds', link: '/feeds' },
      { text: 'Customization', link: '/customization/data-fetching' },
    ],
    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quick Start', link: '/quick-start' },
        ],
      },
      {
        text: 'Discover Feeds',
        items: [
          { text: 'Overview', link: '/feeds' },
          {
            text: 'Methods',
            collapsed: false,
            items: [
              { text: 'Platform', link: '/feeds/platform' },
              { text: 'HTML', link: '/feeds/html' },
              { text: 'Headers', link: '/feeds/headers' },
              { text: 'Guess', link: '/feeds/guess' },
            ],
          },
        ],
      },
      {
        text: 'Discover More',
        items: [
          { text: 'Blogrolls', link: '/other/blogrolls' },
          { text: 'Favicons', link: '/other/favicons' },
          { text: 'WebSub Hubs', link: '/other/hubs' },
        ],
      },
      {
        text: 'Customization',
        items: [
          { text: 'Data Fetching', link: '/customization/data-fetching' },
          { text: 'Data Extraction', link: '/customization/data-extraction' },
          { text: 'URL Resolution', link: '/customization/url-resolution' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/reference' },
          { text: 'discoverFeeds', link: '/reference/discover-feeds' },
          { text: 'discoverBlogrolls', link: '/reference/discover-blogrolls' },
          { text: 'discoverFavicons', link: '/reference/discover-favicons' },
          { text: 'discoverHubs', link: '/reference/discover-hubs' },
          { text: 'Types', link: '/reference/types' },
          { text: 'TypeScript', link: '/reference/typescript' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/feedscout',
      },
      {
        icon: 'github',
        link: 'https://github.com/macieklamberski/feedscout',
      },
      {
        icon: 'x',
        link: 'https://x.com/macieklamberski',
      },
    ],
  },
})
