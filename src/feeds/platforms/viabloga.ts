import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type ViablogaUrl = { kind: 'blog' } | { kind: 'category'; category: string }

const domains = ['viabloga.com']

// A category page is `/{category}.shtml`, and its feed `/{category}.xml`.
const categoryRegex = /^\/([^/.]+)\.shtml$/i

const feeds = definePlatformFeeds(
  [
    { key: 'viabloga:posts', template: '{scheme}://{host}/index.xml', format: 'rss' },
    { key: 'viabloga:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
    { key: 'viabloga:posts', template: '{scheme}://{host}/atom', format: 'atom' },
    { key: 'viabloga:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
    { key: 'viabloga:comments', template: '{scheme}://{host}/comments.xml', format: 'rss' },
    { key: 'viabloga:wiki', template: '{scheme}://{host}/wiki.rdf', format: 'rdf' },
    // A category serves the same items with full text at `{category}_full.xml`. These rows go
    // after the named files above.
    { key: 'viabloga:category', template: '{scheme}://{host}/{category}.xml', format: 'rss' },
    { key: 'viabloga:category', template: '{scheme}://{host}/{category}_full.xml', format: 'rss' },
  ],
  { domains },
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
        page.getFeedEntry('viabloga:category', { category: parsed.category }, 'rss'),
        page.getFeedEntry('viabloga:posts', {}, 'rss'),
        page.getFeedEntry('viabloga:posts', {}, 'atom'),
        page.getFeedEntry('viabloga:posts', {}, 'rdf'),
        page.getFeedEntry('viabloga:comments', {}, 'rss'),
        page.getFeedEntry('viabloga:wiki', {}, 'rdf'),
      ]
    }

    return [
      page.getFeedEntry('viabloga:posts', {}, 'rss'),
      page.getFeedEntry('viabloga:posts', {}, 'atom'),
      page.getFeedEntry('viabloga:posts', {}, 'rdf'),
      page.getFeedEntry('viabloga:comments', {}, 'rss'),
      page.getFeedEntry('viabloga:wiki', {}, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
