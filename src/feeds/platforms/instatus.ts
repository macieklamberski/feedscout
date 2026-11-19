import { instatus } from 'feedintel'
import { isHostOrSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: history.
// Handler adds formats for: history (rss).

export type InstatusUrl = { kind: 'status' }

const pageMarkers = ['custom-html-above-header', 'custom-html-below-footer']
const domains = instatus.hosts.tenants

const feeds = withHintLabels(instatus.feeds)

export const isInstatusHtml = (content: string): boolean => {
  return pageMarkers.every((marker) => content.includes(marker))
}

export const isInstatusHeaders = (headers: Headers): boolean => {
  return headers.get('x-matched-path')?.startsWith('/[lang]/[url]/[type]/[userId]') ?? false
}

export const parseInstatusUrl = (url: string): InstatusUrl | undefined => {
  if (!parseUrl(url)) {
    return
  }

  return { kind: 'status' }
}

export const instatusHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return getTenantSubdomain(url, domains) !== undefined
    }

    if (!hasMarker(content, headers, { html: isInstatusHtml, headers: isInstatusHeaders })) {
      return false
    }

    return parseInstatusUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseInstatusUrl(url)
    const pageFeeds = feeds.forUrl(url)

    if (!parsed || !pageFeeds) {
      return []
    }

    return [
      pageFeeds.getFeedEntry('history', {}, 'rss'),
      pageFeeds.getFeedEntry('history', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
