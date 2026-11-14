import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type WeblogLolUrl = { kind: 'blog' }

const domains = ['weblog.lol']

const feeds = definePlatformFeeds(
  [
    { key: 'weblog-lol:posts', template: '{scheme}://{host}/rss.xml', format: 'rss' },
    { key: 'weblog-lol:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
    { key: 'weblog-lol:posts', template: '{scheme}://{host}/feed.json', format: 'json' },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parseWeblogLolUrl(url) || !page) {
      return []
    }

    // The http spellings redirect to the blog's https home page, not to the feed.
    const params = { scheme: 'https' }

    return [
      page.getFeedEntry('weblog-lol:posts', params, 'rss'),
      page.getFeedEntry('weblog-lol:posts', params, 'atom'),
      page.getFeedEntry('weblog-lol:posts', params, 'json'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
