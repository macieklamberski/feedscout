import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverable without handler.

const profileRegex = /^\/users\/([^/]+)/
const pleromaApiRegex = /\/api\/pleroma\//i

export const isPleromaHtml = (content: string): boolean => {
  return pleromaApiRegex.test(content)
}

export const pleromaHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isPleromaHtml(content)) {
        return false
      }

      const { pathname } = new URL(url)

      return profileRegex.test(pathname)
    } catch {}

    return false
  },

  resolve: (url) => {
    try {
      const { origin, pathname } = new URL(url)
      const match = pathname.match(profileRegex)

      if (!match?.[1]) {
        return []
      }

      return [
        {
          uri: `${origin}/users/${match[1]}/feed.atom`,
          hint: composeHint('pleroma:posts'),
        },
      ]
    } catch {}

    return []
  },
}
