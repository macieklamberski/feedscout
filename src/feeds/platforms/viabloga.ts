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
    const page = feeds.forUrl(url)

    if (!blog || !page) {
      return []
    }

    return [
      page.getFeedEntry('viabloga:posts', { blog }, 'rss'),
      page.getFeedEntry('viabloga:posts', { blog }, 'atom'),
      page.getFeedEntry('viabloga:posts', { blog }, 'rdf'),
      page.getFeedEntry('viabloga:comments', { blog }, 'rss'),
      page.getFeedEntry('viabloga:wiki', { blog }, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
