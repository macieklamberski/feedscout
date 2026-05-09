import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const profileRegex = /^\/profile\/([^/]+)/

export const isFriendicaHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'Friendica')
}

export const friendicaHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isFriendicaHtml(content)) {
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
          uri: `${origin}/feed/${match[1]}`,
          hint: composeHint('friendica:posts'),
        },
      ]
    } catch {}

    return []
  },
}
