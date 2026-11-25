import { wpengine } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeWordpressFeeds, parseWordpressPage, type WordpressUrl } from './wordpress.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, post-comments.
// Handler needed for: posts.

export type WpengineUrl = WordpressUrl

export const parseWpengineUrl = (url: string): WpengineUrl | undefined => {
  if (wpengine.pages.readUrl(url) === undefined) {
    return
  }

  return parseWordpressPage(url)
}

export const wpengineHandler: PlatformHandler = {
  match: (url) => {
    return parseWpengineUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseWpengineUrl(url)

    if (!parsed) {
      return []
    }

    return composeWordpressFeeds(url, parsed)
  },

  getFeedHint: withHintLabels(wpengine.feeds).getFeedHint,
}
