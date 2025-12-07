import { defineConfig } from 'vitepress'
import llmstxt from 'vitepress-plugin-llms'

export default defineConfig({
  vite: {
    plugins: [llmstxt()],
  },
  title: 'Feedscout',
  description:
    'Advanced feed autodiscovery for JavaScript. Collect feed URIs from webpages using multiple discovery methods.',
  lastUpdated: true,
  cleanUrls: true,
  head: [
    [
      'script',
      {
        async: '',
        src: 'https://umami.lamberski.com/script.js',
        'data-website-id': 'f1c2e3d4-5a6b-7c8d-9e0f-1a2b3c4d5e6f',
      },
    ],
  ],
  themeConfig: {
    outline: {
      level: [2, 3],
    },
    nav: [
      { text: 'Quick Start', link: '/quick-start' },
      { text: 'Discover Feeds', link: '/feeds/' },
      { text: 'Advanced', link: '/advanced/http-adapters' },
    ],
    sidebar: [
      {
        text: 'Get Started',
        items: [
          { text: 'Introduction', link: '/' },
          { text: 'Quick Start', link: '/quick-start' },
          { text: 'TypeScript', link: '/typescript' },
        ],
      },
      {
        text: 'Discover Feeds',
        items: [
          { text: 'Overview', link: '/feeds/' },
          {
            text: 'Methods',
            collapsed: false,
            items: [
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
          { text: 'WebSub Hubs', link: '/other/hubs' },
        ],
      },
      {
        text: 'Advanced',
        items: [
          { text: 'HTTP Adapters', link: '/advanced/http-adapters' },
          { text: 'Custom Extractors', link: '/advanced/custom-extractors' },
          { text: 'URL Normalization', link: '/advanced/url-normalization' },
        ],
      },
      {
        text: 'API Reference',
        items: [
          { text: 'Overview', link: '/reference/' },
          { text: 'discoverFeeds', link: '/reference/discover-feeds' },
          { text: 'discoverBlogrolls', link: '/reference/discover-blogrolls' },
          { text: 'discoverHubs', link: '/reference/discover-hubs' },
          { text: 'Types', link: '/reference/types' },
        ],
      },
    ],
    search: {
      provider: 'local',
    },
    socialLinks: [
      {
        icon: 'github',
        link: 'https://github.com/macieklamberski/feedscout',
      },
      {
        icon: 'npm',
        link: 'https://www.npmjs.com/package/feedscout',
      },
    ],
  },
})
