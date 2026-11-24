import { wpengine } from 'feedintel'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'
import {
  composeWordpressFeeds,
  getWordpressFeedHint,
  parseWordpressPage,
  type WordpressUrl,
} from './wordpress.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: comments, post-comments.
// Handler needed for: posts.

export type WpengineUrl = WordpressUrl

const domains = wpengine.hosts.tenants

export const parseWpengineUrl = (url: string): WpengineUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
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

  getFeedHint: (url) => {
    if (!getTenantSubdomain(url, domains)) {
      return
    }

    return getWordpressFeedHint(url)
  },
}
