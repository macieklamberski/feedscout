import { noticeable } from 'feedintel'
import { isHostOrSubdomainOf, isSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: label.

export type NoticeableUrl = { kind: 'newspage' } | { kind: 'label'; label: string }

const domains = noticeable.hosts.tenants

// A page combining labels, `/labels/{a},{b}`, has no feed of its own: `/{a},{b}.rss` answers 404.
const labelPathRegex = /^\/labels\/([^/,]+)\/?$/i

const feeds = withHintLabels(noticeable.feeds)

// Every newspage template loads its styles from the Noticeable asset host, custom domains too.
export const isNoticeableHtml = (content: string): boolean => {
  return content.includes('assets.noticeable.news/templates/')
}

export const parseNoticeableUrl = (url: string): NoticeableUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  if (isHostOrSubdomainOf(parsedUrl, domains) && !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  const label = parsedUrl.pathname.match(labelPathRegex)?.[1]

  if (label) {
    return { kind: 'label', label }
  }

  return { kind: 'newspage' }
}

export const noticeableHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isSubdomainOf(url, domains) && !hasMarker(content, headers, { html: isNoticeableHtml })) {
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
