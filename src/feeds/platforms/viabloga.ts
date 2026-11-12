import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type ViablogaUrl = { kind: 'blog' }

const domains = ['viabloga.com']

const feeds = definePlatformFeeds(
  [
    { key: 'viabloga:posts', template: '{scheme}://{blog}.{domain}/index.xml', format: 'rss' },
    { key: 'viabloga:posts', template: '{scheme}://{blog}.{domain}/atom.xml', format: 'atom' },
    { key: 'viabloga:posts', template: '{scheme}://{blog}.{domain}/atom', format: 'atom' },
    { key: 'viabloga:posts', template: '{scheme}://{blog}.{domain}/index.rdf', format: 'rdf' },
    {
      key: 'viabloga:comments',
      template: '{scheme}://{blog}.{domain}/comments.xml',
      format: 'rss',
    },
    { key: 'viabloga:wiki', template: '{scheme}://{blog}.{domain}/wiki.rdf', format: 'rdf' },
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
    const blog = getTenantSubdomain(url, domains)

    if (!blog) {
      return []
    }

    const params = { scheme: new URL(url).protocol.slice(0, -1), blog, domain: domains[0] }

    return [
      feeds.getFeedEntry('viabloga:posts', params, 'rss'),
      feeds.getFeedEntry('viabloga:posts', params, 'atom'),
      feeds.getFeedEntry('viabloga:posts', params, 'rdf'),
      feeds.getFeedEntry('viabloga:comments', params, 'rss'),
      feeds.getFeedEntry('viabloga:wiki', params, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
