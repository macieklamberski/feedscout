import { includesAnyOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getNumericId, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers category, topic.
// Handler needed for: popular, recent.

export type NodebbUrl =
  | { kind: 'topic'; topicId: string; categoryId?: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'forum' }
export type NodebbPage = NodebbUrl & { siteUrl: string }

const categoryRegex = /\/category\/(?<id>[^/]+)/i
const topicRegex = /\/topic\/(?<id>[^/]+)/i
// The page config prints the install's sub-path, such as `/forum`, and an empty one at the root.
const relativePathRegex = /"relative_path":"(?<relativePath>\/[^"]*)"/

// NodeBB is self-hosted and known only by its headers, so nothing in a feed URL names it and the
// table only builds, under the install root the page config names.
const feeds = definePlatformFeeds([
  { key: 'nodebb:topic', template: '{root}/topic/{topicId}.rss' },
  { key: 'nodebb:category', template: '{root}/category/{categoryId}.rss' },
  { key: 'nodebb:recent', template: '{root}/recent.rss' },
  { key: 'nodebb:popular', template: '{root}/popular.rss' },
])

export const isNodebbHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-powered-by'), 'nodebb')
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

    const root = page.siteUrl

    if (page.kind === 'topic' && page.categoryId) {
      return [
        feeds.getFeedEntry('nodebb:topic', { root, topicId: page.topicId }),
        feeds.getFeedEntry('nodebb:category', { root, categoryId: page.categoryId }),
        feeds.getFeedEntry('nodebb:recent', { root }),
        feeds.getFeedEntry('nodebb:popular', { root }),
      ]
    }

    if (page.kind === 'topic') {
      return [
        feeds.getFeedEntry('nodebb:topic', { root, topicId: page.topicId }),
        feeds.getFeedEntry('nodebb:recent', { root }),
        feeds.getFeedEntry('nodebb:popular', { root }),
      ]
    }

    if (page.kind === 'category') {
      return [
        feeds.getFeedEntry('nodebb:category', { root, categoryId: page.categoryId }),
        feeds.getFeedEntry('nodebb:recent', { root }),
        feeds.getFeedEntry('nodebb:popular', { root }),
      ]
    }

    return [
      feeds.getFeedEntry('nodebb:recent', { root }),
      feeds.getFeedEntry('nodebb:popular', { root }),
    ]
  },
}
