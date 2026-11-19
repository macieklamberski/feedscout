import { diaspora } from 'feedintel'
import { isAnyOf, startsWithAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { formatSuffixRegex, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const profileRegex = /^\/(?<route>u|public|people)\/(?<segment>[^/]+)/i
const diasporaIdRegex = /"diaspora_id":"([^"@]+)@/

const feeds = withHintLabels(diaspora.feeds)

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

  // A `/people/{guid}` page is keyed by guid, and the feed by username. The page carries the
  // username in its diaspora ID.
  if (!startsWithAnyOf(pathname, '/people/')) {
    return { username: pathUsername }
  }

  const linkedUsername = content?.match(diasporaIdRegex)?.[1]

  if (!linkedUsername) {
    return { username: pathUsername }
  }

  // The id is page text, which can hold a `/`, so the table encodes it as one segment.
  return { username: linkedUsername }
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
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('posts', { username: page.username })]
  },
}
