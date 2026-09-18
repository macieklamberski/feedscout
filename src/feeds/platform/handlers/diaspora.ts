import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Discoverable without handler.

const profileRegex = /^\/(?:u|public|people)\/([^/]+)/

export const isDiasporaHtml = (content: string): boolean => {
  return content.includes('Diaspora.Page')
}

export const diasporaHandler: PlatformHandler = {
  match: (url, content) => {
    try {
      if (!content || !isDiasporaHtml(content)) {
        return false
      }

      return profileRegex.test(new URL(url).pathname)
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
          uri: `${origin}/public/${match[1]}`,
          hint: composeHint('diaspora:posts'),
        },
      ]
    } catch {}

    return []
  },
}
