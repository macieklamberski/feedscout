import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

export const wordpressHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'wordpress.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      `${origin}/feed/`,
      `${origin}/feed/rss2/`,
      `${origin}/feed/rdf/`,
      `${origin}/feed/atom/`,
      `${origin}/comments/feed/`,
    ]
  },
}
