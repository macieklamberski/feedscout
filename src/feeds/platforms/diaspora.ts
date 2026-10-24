import { encodePathSegment, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, formatSuffixRegex, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const profileRegex = /^\/(?<route>u|public|people)\/(?<segment>[^/]+)/i
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
  const { route, segment } = pathname.match(profileRegex)?.groups ?? {}

  if (!segment) {
    return
  }

  // `/public/alice.atom` is the feed, while `/u/` reads the whole segment, which may hold a dot.
  const pathUsername = isAnyOf(route, 'u') ? segment : segment.replace(formatSuffixRegex, '')

  if (!pathUsername) {
    return
  }

  if (!peoplePathRegex.test(pathname)) {
    return { username: pathUsername }
  }

  const linkedUsername = content?.match(diasporaIdRegex)?.[1]

  if (!linkedUsername) {
    return { username: pathUsername }
  }

  // The id is page text, which can hold a `/`.
  return { username: encodePathSegment(linkedUsername) }
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
