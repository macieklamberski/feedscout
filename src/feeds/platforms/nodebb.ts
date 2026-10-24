import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getNumericId, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers category, topic.
// Handler needed for: popular, recent.

export type NodebbUrl =
  | { kind: 'topic'; topicId: string; categoryId?: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'forum' }
export type NodebbPage = NodebbUrl & { siteUrl: string }

const nodebbRegex = /nodebb/i
const categoryRegex = /\/category\/(?<id>[^/]+)/i
const topicRegex = /\/topic\/(?<id>[^/]+)/i
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
  const categoryId = getNumericId(pathname, categoryRegex)
  const topicId = getNumericId(pathname, topicRegex)

  if (topicId) {
    return { kind: 'topic', topicId, categoryId }
  }

  if (categoryId) {
    return { kind: 'category', categoryId }
  }

  return { kind: 'forum' }
}

export const getNodebbPage = (url: string, content: string | undefined): NodebbPage | undefined => {
  const parsed = parseNodebbUrl(url)

  if (!parsed) {
    return
  }

  const relativePath = content?.match(relativePathRegex)?.groups?.relativePath ?? ''

  return { ...parsed, siteUrl: `${new URL(url).origin}${relativePath}` }
}

export const nodebbHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isNodebbHeaders })) {
      return false
    }

    return parseNodebbUrl(url) !== undefined
  },

  resolve: (url, content) => {
    const page = getNodebbPage(url, content)

    if (!page) {
      return []
    }

    const { siteUrl } = page
    const uris: Array<DiscoverUriEntry> = []

    if (page.kind === 'topic') {
      uris.push({
        uri: `${siteUrl}/topic/${page.topicId}.rss`,
        hint: composeHint('nodebb:topic'),
      })
    }

    if (page.kind !== 'forum' && page.categoryId) {
      uris.push({
        uri: `${siteUrl}/category/${page.categoryId}.rss`,
        hint: composeHint('nodebb:category'),
      })
    }

    uris.push({ uri: `${siteUrl}/recent.rss`, hint: composeHint('nodebb:recent') })
    uris.push({ uri: `${siteUrl}/popular.rss`, hint: composeHint('nodebb:popular') })

    return uris
  },
}
