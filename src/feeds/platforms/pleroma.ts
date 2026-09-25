import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers profile.

const profileRegex = /^\/users\/([^/]+)/
const pleromaApiRegex = /\/api\/pleroma\//i

export const isPleromaHtml = (content: string): boolean => {
  return pleromaApiRegex.test(content)
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isPleromaHtml(content)) {
      return false
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    const { pathname } = parsedUrl

    return profileRegex.test(pathname)
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
