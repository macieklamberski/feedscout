import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type ViablogaUrl = { kind: 'blog' }

const domains = ['viabloga.com']

const feeds = definePlatformFeeds(
  [
    { key: 'viabloga:posts', template: '{scheme}://{host}/index.xml', format: 'rss' },
    { key: 'viabloga:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
    { key: 'viabloga:posts', template: '{scheme}://{host}/atom', format: 'atom' },
    { key: 'viabloga:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
    { key: 'viabloga:comments', template: '{scheme}://{host}/comments.xml', format: 'rss' },
    { key: 'viabloga:wiki', template: '{scheme}://{host}/wiki.rdf', format: 'rdf' },
  ],
  { domains },
)

export const parseViablogaUrl = (url: string): ViablogaUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const viablogaHandler: PlatformHandler = {
  match: (url) => {
    return parseViablogaUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!parseViablogaUrl(url) || !page) {
      return []
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
