import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers profile.

const profileRegex = /^\/users\/([^/]+)/i
const pleromaApiRegex = /\/api\/pleroma\//i

export const isPleromaHtml = (content: string): boolean => {
  return pleromaApiRegex.test(content)
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isPleromaHtml })) {
      return false
    }

    return profileRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(profileRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `${origin}/users/${match[1]}/feed.atom`,
        hint: composeHint('pleroma:posts', 'atom'),
      },
      {
        uri: `${origin}/users/${match[1]}/feed.rss`,
        hint: composeHint('pleroma:posts', 'rss'),
      },
    ]
  },
}
