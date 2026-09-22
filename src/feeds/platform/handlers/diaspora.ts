import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Unmeasured, handler emits no feed.

const profileRegex = /^\/(?:u|public|people)\/([^/]+)/

export const isDiasporaHtml = (content: string): boolean => {
  return content.includes('Diaspora.Page')
}

export const diasporaHandler: PlatformHandler = {
  match: (url, content) => {
    if (!content || !isDiasporaHtml(content)) {
      return false
    }

    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return false
    }

    return profileRegex.test(parsedUrl.pathname)
  },

  resolve: (url) => {
    const parsedUrl = parseUrl(url)

    if (!parsedUrl) {
      return []
    }

    const { origin, pathname } = parsedUrl
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
  },
}
