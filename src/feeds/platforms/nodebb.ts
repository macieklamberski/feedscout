import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers category (html), partly covers topic.
// Handler needed for: popular, recent.

export type NodebbUrl =
  | { kind: 'topic'; topicId: string; categoryId?: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'forum' }

const nodebbRegex = /nodebb/i
const categoryRegex = /\/category\/(\d+)/i
const topicRegex = /\/topic\/(\d+)/i
// The page config prints the install's sub-path, such as `/forum`, and an empty one at the root.
const relativePathRegex = /"relative_path":"(?<relativePath>\/[^"]*)"/

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

  resolve: (url, content) => {
    const parsed = parseNodebbUrl(url)

    if (!parsed) {
      return []
    }

    const relativePath = content?.match(relativePathRegex)?.groups?.relativePath ?? ''
    const siteUrl = `${new URL(url).origin}${relativePath}`
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'topic') {
      uris.push({
        uri: `${siteUrl}/topic/${parsed.topicId}.rss`,
        hint: composeHint('nodebb:topic'),
      })
    }

    if (parsed.kind !== 'forum' && parsed.categoryId) {
      uris.push({
        uri: `${siteUrl}/category/${parsed.categoryId}.rss`,
        hint: composeHint('nodebb:category'),
      })
    }

    uris.push({ uri: `${siteUrl}/recent.rss`, hint: composeHint('nodebb:recent') })
    uris.push({ uri: `${siteUrl}/popular.rss`, hint: composeHint('nodebb:popular') })

    return uris
  },
}
