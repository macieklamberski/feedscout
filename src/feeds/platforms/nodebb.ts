import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type NodebbUrl =
  | { kind: 'topic'; topicId: string; categoryId?: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'forum' }

const nodebbRegex = /nodebb/i
const categoryRegex = /\/category\/(\d+)/i
const topicRegex = /\/topic\/(\d+)/i

export const isNodebbHeaders = (headers: Headers): boolean => {
  return nodebbRegex.test(headers.get('x-powered-by') ?? '')
}

export const parseNodebbUrl = (url: string): NodebbUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { pathname } = parsedUrl
  const categoryId = pathname.match(categoryRegex)?.[1]
  const topicId = pathname.match(topicRegex)?.[1]

  if (topicId) {
    return { kind: 'topic', topicId, categoryId }
  }

  if (categoryId) {
    return { kind: 'category', categoryId }
  }

  return { kind: 'forum' }
}

export const nodebbHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isNodebbHeaders })) {
      return false
    }

    return parseNodebbUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNodebbUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'topic') {
      uris.push({
        uri: `${origin}/topic/${parsed.topicId}.rss`,
        hint: composeHint('nodebb:topic'),
      })
    }

    if (parsed.kind !== 'forum' && parsed.categoryId) {
      uris.push({
        uri: `${origin}/category/${parsed.categoryId}.rss`,
        hint: composeHint('nodebb:category'),
      })
    }

    uris.push({ uri: `${origin}/recent.rss`, hint: composeHint('nodebb:recent') })
    uris.push({ uri: `${origin}/popular.rss`, hint: composeHint('nodebb:popular') })

    return uris
  },
}
