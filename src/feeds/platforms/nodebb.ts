import { nodebb } from 'feedintel'
import { includesAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, topic.
// Handler needed for: popular, recent.

export type NodebbUrl =
  | { kind: 'topic'; topicId: string; categoryId?: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'forum' }
export type NodebbPage = NodebbUrl & { siteUrl: string }

// The page config prints the install's sub-path, such as `/forum`, and an empty one at the root.
const relativePathRegex = /"relative_path":"(?<relativePath>\/[^"]*)"/

const feeds = withHintLabels(nodebb.feeds)

export const isNodebbHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('x-powered-by'), 'nodebb')
}

export const parseNodebbUrl = (url: string): NodebbUrl | undefined => {
  const page = nodebb.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const { topicId, categoryId } = page.params

  if (page.key === 'topic') {
    return { kind: 'topic', topicId, categoryId }
  }

  if (page.key === 'category') {
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
        feeds.getFeedEntry('topic', { root, topicId: page.topicId }),
        feeds.getFeedEntry('category', { root, categoryId: page.categoryId }),
        feeds.getFeedEntry('recent', { root }),
        feeds.getFeedEntry('popular', { root }),
      ]
    }

    if (page.kind === 'topic') {
      return [
        feeds.getFeedEntry('topic', { root, topicId: page.topicId }),
        feeds.getFeedEntry('recent', { root }),
        feeds.getFeedEntry('popular', { root }),
      ]
    }

    if (page.kind === 'category') {
      return [
        feeds.getFeedEntry('category', { root, categoryId: page.categoryId }),
        feeds.getFeedEntry('recent', { root }),
        feeds.getFeedEntry('popular', { root }),
      ]
    }

    return [feeds.getFeedEntry('recent', { root }), feeds.getFeedEntry('popular', { root })]
  },
}
