import { vitepress } from 'ogier/adapters'
import { dark } from 'ogier/themes'
import { defineConfig } from 'vitepress'

const indexMdRegex = /index\.md$/
const mdRegex = /\.md$/
const trailingSlashRegex = /\/$/

const hostname = 'https://feedscout.dev'
const og = vitepress({
  site: { hostname, favicon: { file: new URL('../public/favicon.svg', import.meta.url) } },
  card: {
    header: {
      text: 'feedscout',
      icon: { file: new URL('../public/favicon.svg', import.meta.url) },
    },
    footer: {
      text: 'macieklamberski/feedscout',
      icon: { file: new URL('./github.svg', import.meta.url) },
    },
  },
  style: { theme: { ...dark, accent: '#a2e57b' }, background: { pattern: 'dots' } },
})

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
  buildEnd: og.buildEnd,
  transformHead: (context) => {
    const canonicalUrl = `${hostname}/${context.pageData.relativePath}`
      .replace(indexMdRegex, '')
      .replace(mdRegex, '')
      .replace(trailingSlashRegex, '')

    return [['link', { rel: 'canonical', href: canonicalUrl }], ...og.transformHead(context)]
  },
  head: [
    ['link', { rel: 'icon', href: '/favicon.svg', type: 'image/svg+xml' }],
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
        defer: '',
        src: '/beat.js',
        'data-domain': 'feedscout.dev',
        'data-api': '/beat.json',
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
      {
        text: 'v2.x',
        items: [
          { text: 'v2.x (Latest)', link: 'https://feedscout.dev', target: '_self' },
          { text: 'v1.x', link: 'https://v1.feedscout.dev', target: '_self' },
        ],
      },
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
