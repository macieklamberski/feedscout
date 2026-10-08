import { isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeWordpressFeeds, parseWordpressPage, type WordpressUrl } from './wordpress.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, legacyBlog.

export type WpengineUrl = WordpressUrl

const domains = ['wpenginepowered.com', 'wpengine.com']

export const parseWpengineUrl = (url: string): WpengineUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
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

    return composeWordpressFeeds(new URL(url).origin, parsed)
  },
}
