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

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'atom'),
      page.getFeedEntry('posts', {}, 'json'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
