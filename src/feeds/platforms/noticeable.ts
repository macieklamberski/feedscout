import { noticeable } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: label.

export type NoticeableUrl = { kind: 'newspage' } | { kind: 'label'; label: string }

const feeds = withHintLabels(noticeable.feeds)

// Every newspage template loads its styles from the Noticeable asset host, custom domains too.
export const isNoticeableHtml = (content: string): boolean => {
  return content.includes('assets.noticeable.news/templates/')
}

export const parseNoticeableUrl = (url: string): NoticeableUrl | undefined => {
  const page = noticeable.pages.read(url) ?? noticeable.pages.read(url, { isAnyHost: true })

  if (!page || page.key === 'platform') {
    return
  }

  if (page.key === 'label') {
    return { kind: 'label', label: page.params.label }
  }

  return { kind: 'newspage' }
}

export const noticeableHandler: PlatformHandler = {
  match: (url, content, headers) => {
    // A platform host skips the marker, which only a custom domain needs.
    if (!noticeable.pages.read(url) && !hasMarker(content, headers, { html: isNoticeableHtml })) {
      return false
    }

    return parseNoticeableUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNoticeableUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'label') {
      const labelParams = { label: parsed.label }

      return [
        page.getFeedEntry('label', labelParams, 'rss'),
        page.getFeedEntry('label', labelParams, 'atom'),
        page.getFeedEntry('label', labelParams, 'json'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('posts', {}, 'json'),
      ]
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'atom'),
      page.getFeedEntry('posts', {}, 'json'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
