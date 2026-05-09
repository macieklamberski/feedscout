import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../../common/utils.js'

// Discoverable without handler.

const profileRegex = /^\/user\/([^/]+)/

export const isBookwyrmHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'BookWyrm')
}

export const bookwyrmHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isBookwyrmHtml(content)) {
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
          uri: `${origin}/user/${match[1]}/rss`,
          hint: composeHint('bookwyrm:reviews'),
        },
      ]
    } catch {}

    return []
  },
}
