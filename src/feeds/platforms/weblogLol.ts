import { weblogLol } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type WeblogLolUrl = { kind: 'blog' }

const feeds = withHintLabels(weblogLol.feeds)

export const parseWeblogLolUrl = (url: string): WeblogLolUrl | undefined => {
  if (!weblogLol.pages.read(url)) {
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
      page.getFeedEntry('posts', params, 'rss'),
      page.getFeedEntry('posts', params, 'atom'),
      page.getFeedEntry('posts', params, 'json'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
