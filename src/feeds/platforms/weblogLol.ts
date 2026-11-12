import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeblogLolUrl = { kind: 'blog' }

const domains = ['weblog.lol']

// The http spellings redirect to the blog's https home page, not to the feed.
const feeds = definePlatformFeeds([
  { key: 'weblog-lol:posts', template: 'https://{blog}.weblog.lol/rss.xml', format: 'rss' },
  { key: 'weblog-lol:posts', template: 'https://{blog}.weblog.lol/atom.xml', format: 'atom' },
  { key: 'weblog-lol:posts', template: 'https://{blog}.weblog.lol/feed.json', format: 'json' },
])

export const parseWeblogLolUrl = (url: string): WeblogLolUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'blog' }
}

export const weblogLolHandler: PlatformHandler = {
  match: (url) => {
    return parseWeblogLolUrl(url) !== undefined
  },

  resolve: (url) => {
    const blog = getTenantSubdomain(url, domains)

    if (!blog) {
      return []
    }

    return [
      feeds.getFeedEntry('weblog-lol:posts', { blog }, 'rss'),
      feeds.getFeedEntry('weblog-lol:posts', { blog }, 'atom'),
      feeds.getFeedEntry('weblog-lol:posts', { blog }, 'json'),
    ]
  },

  getFeedKey: feeds.getFeedKey,
}
