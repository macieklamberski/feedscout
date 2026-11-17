import { isHostOrSubdomainOf, isLocale, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: history.
// Handler adds formats for: history (rss).

export type InstatusUrl = { kind: 'status' }

const pageMarkers = ['custom-html-above-header', 'custom-html-below-footer']
const domains = ['instatus.com']

// A status page on its own domain is known only by its markers, so its feeds are built here but
// not claimed. A translation's feeds serve the same items as the bare ones.
const feeds = definePlatformFeeds(
  [
    {
      key: 'instatus:history',
      main: '{scheme}://{host}/history.rss',
      format: 'rss',
      aliases: ['{scheme}://{host}/{language}/history.rss'],
    },
    {
      key: 'instatus:history',
      main: '{scheme}://{host}/history.atom',
      format: 'atom',
      aliases: ['{scheme}://{host}/{language}/history.atom'],
    },
  ],
  { hosts: { tenants: domains }, checks: { language: isLocale } },
)

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
      pageFeeds.getFeedEntry('instatus:history', {}, 'rss'),
      pageFeeds.getFeedEntry('instatus:history', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
