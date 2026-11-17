import { wikidot } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: forum-posts, forum-threads, site-changes.

export type WikidotUrl =
  | { kind: 'thread'; threadId: string }
  | { kind: 'category'; categoryId: string }
  | { kind: 'site' }

const threadPathRegex = /^\/forum\/t-(\d+)(?:\/|$)/i
const categoryPathRegex = /^\/forum\/c-(\d+)(?:\/|$)/i

const feeds = withHintLabels(wikidot.feeds)

export const isWikidotHtml = (content: string): boolean => {
  return content.includes('WIKIDOT.page.listeners.editClick()')
}

// A thread page names its thread and a forum category page its category, after any title slug.
export const parseWikidotUrl = (url: string): WikidotUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const threadId = parsedUrl.pathname.match(threadPathRegex)?.[1]

  if (threadId) {
    return { kind: 'thread', threadId }
  }

  const categoryId = parsedUrl.pathname.match(categoryPathRegex)?.[1]

  if (categoryId) {
    return { kind: 'category', categoryId }
  }

  return { kind: 'site' }
}

export const wikidotHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isWikidotHtml })
  },

  resolve: (url) => {
    const parsed = parseWikidotUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'thread') {
      return [
        page.getFeedEntry('forum-thread', { threadId: parsed.threadId }),
        page.getFeedEntry('site-changes'),
        page.getFeedEntry('forum-threads'),
        page.getFeedEntry('forum-posts'),
      ]
    }

    if (parsed.kind === 'category') {
      const params = { categoryId: parsed.categoryId }

      return [
        page.getFeedEntry('forum-category-threads', params),
        page.getFeedEntry('forum-category-posts', params),
        page.getFeedEntry('site-changes'),
        page.getFeedEntry('forum-threads'),
        page.getFeedEntry('forum-posts'),
      ]
    }

    return [
      page.getFeedEntry('site-changes'),
      page.getFeedEntry('forum-threads'),
      page.getFeedEntry('forum-posts'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
