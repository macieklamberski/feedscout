import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isSubdomainOf } from '../../../common/utils.js'

const tagPathRegex = /^\/tagged\/([^/]+)/

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, 'tumblr.com')
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    // Tagged posts: /tagged/{tag}
    const tagMatch = pathname.match(tagPathRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [`${origin}/tagged/${tag}/rss`]
    }

    return [`${origin}/rss`]
  },
}
