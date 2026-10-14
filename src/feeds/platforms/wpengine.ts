import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'
import { composeWordpressFeeds, parseWordpressPage, type WordpressUrl } from './wordpress.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, legacyBlog.

export type WpengineUrl = WordpressUrl

const domains = ['wpenginepowered.com', 'wpengine.com']
// The API, a redirect to the home page and the customer portal.
const excludedSubdomains = ['api', 'cdn', 'my']

export const parseWpengineUrl = (url: string): WpengineUrl | undefined => {
  if (!getTenantSubdomain(url, domains, excludedSubdomains)) {
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
