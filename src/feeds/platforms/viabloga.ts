import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: category, comments, wiki.

export type ViablogaUrl = { kind: 'blog' } | { kind: 'category'; category: string }

const domains = ['viabloga.com']

// A category page is `/{category}.shtml`, and its feed `/{category}.xml`.
const categoryRegex = /^\/([^/.]+)\.shtml$/i

const feeds = definePlatformFeeds(
  'viabloga',
  [
    { key: 'posts', main: '{scheme}://{host}/index.xml', format: 'rss' },
    {
      key: 'posts',
      main: '{scheme}://{host}/atom.xml',
      format: 'atom',
      aliases: ['{scheme}://{host}/atom'],
    },
    { key: 'posts', main: '{scheme}://{host}/index.rdf', format: 'rdf' },
    { key: 'comments', main: '{scheme}://{host}/comments.xml', format: 'rss' },
    { key: 'wiki', main: '{scheme}://{host}/wiki.rdf', format: 'rdf' },
    // A category serves the same items with full text at `{category}_full.xml`. These rows go
    // after the named files above.
    {
      key: 'category',
      main: '{scheme}://{host}/{category}.xml',
      format: 'rss',
      aliases: ['{scheme}://{host}/{category}_full.xml'],
    },
  ],
  { hosts: { tenants: domains } },
)

export const parseViablogaUrl = (url: string): ViablogaUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const category = categoryRegex.exec(new URL(url).pathname)?.[1]

  if (category) {
    return { kind: 'category', category }
  }

  return { kind: 'blog' }
}

export const viablogaHandler: PlatformHandler = {
  match: (url) => {
    return parseViablogaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseViablogaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { category: parsed.category }, 'rss'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('posts', {}, 'rdf'),
        page.getFeedEntry('comments', {}, 'rss'),
        page.getFeedEntry('wiki', {}, 'rdf'),
      ]
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'atom'),
      page.getFeedEntry('posts', {}, 'rdf'),
      page.getFeedEntry('comments', {}, 'rss'),
      page.getFeedEntry('wiki', {}, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
