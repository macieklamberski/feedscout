import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isSubdomainOf } from '../../../common/utils.js'

// Discoverable without handler.

export const domains = ['tumblr.com']

const tagRegex = /^\/tagged\/([^/]+)/

export const tumblrHandler: PlatformHandler = {
  match: (url) => {
    return isSubdomainOf(url, domains)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)

    // Tagged posts: /tagged/{tag}
    const tagMatch = pathname.match(tagRegex)

    if (tagMatch?.[1]) {
      const tag = tagMatch[1]

      return [{ uri: `${origin}/tagged/${tag}/rss`, hint: composeHint('tumblr:tag') }]
    }

    return [{ uri: `${origin}/rss`, hint: composeHint('tumblr:posts') }]
  },
}
