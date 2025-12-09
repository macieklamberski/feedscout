import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'tumblr.com')
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [`${origin}/rss`]
  },
}
