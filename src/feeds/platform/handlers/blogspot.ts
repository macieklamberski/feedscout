import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

export const blogspotHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'blogspot.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/feeds/posts/default`, `${origin}/feeds/posts/default?alt=rss`]
  },
}
