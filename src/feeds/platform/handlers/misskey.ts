import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const profileRegex = /^\/@([^/.]+)/

export const isMisskeyHtml = (content: string): boolean => {
  return hasMetaContent(content, 'application-name', 'Misskey')
}

export const misskeyHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isMisskeyHtml(content)) {
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
          uri: `${origin}/@${match[1]}.atom`,
          hint: composeHint('misskey:posts'),
        },
      ]
    } catch {}

    return []
  },
}
