import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const profileRegex = /^\/(?:u|public|people)\/([^/.]+)/i
// A `/people/{guid}` page is keyed by guid, and the feed by username. The page
// carries the username in its diaspora ID.
const peoplePathRegex = /^\/people\//i
const diasporaIdRegex = /"diaspora_id":"([^"@]+)@/

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

  resolve: (url, content) => {
    const { origin, pathname } = new URL(url)
    const match = pathname.match(profileRegex)

    if (!match?.[1]) {
      return []
    }

    const user = peoplePathRegex.test(pathname)
      ? (content?.match(diasporaIdRegex)?.[1] ?? match[1])
      : match[1]

    return [
      {
        uri: `${origin}/public/${user}.atom`,
        hint: composeHint('diaspora:posts'),
      },
    ]
  },
}
