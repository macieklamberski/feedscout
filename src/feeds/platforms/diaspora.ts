import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const profileRegex = /^\/(?:u|public|people)\/([^/.]+)/i
// A `/people/{guid}` page is keyed by guid, and the feed by username. The page
// carries the username in its diaspora ID.
const peoplePathRegex = /^\/people\//i
const diasporaIdRegex = /"diaspora_id":"([^"@]+)@/

export const isDiasporaHtml = (content: string): boolean => {
  return content.includes('Diaspora.Page')
}

export type DiasporaPage = { username: string }

const getDiasporaPage = (url: string, content: string | undefined): DiasporaPage | undefined => {
  const { pathname } = new URL(url)
  const pathUsername = pathname.match(profileRegex)?.[1]

  if (!pathUsername) {
    return
  }

  if (!peoplePathRegex.test(pathname)) {
    return { username: pathUsername }
  }

  return { username: content?.match(diasporaIdRegex)?.[1] ?? pathUsername }
}

export const diasporaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isDiasporaHtml })) {
      return false
    }

    return profileRegex.test(new URL(url).pathname)
  },

  resolve: (url, content) => {
    const page = getDiasporaPage(url, content)

    if (!page) {
      return []
    }

    const { origin } = new URL(url)

    return [
      {
        uri: `${origin}/public/${page.username}.atom`,
        hint: composeHint('diaspora:posts'),
      },
    ]
  },
}
