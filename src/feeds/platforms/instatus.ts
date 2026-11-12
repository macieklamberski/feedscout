import { getPathSegments, parseUrl } from 'trousse'
import { definePlatformFeeds, type PlatformFeedParams } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain, hasMarker, letterPairsRegex } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type InstatusUrl = { kind: 'status'; language?: string }

const pageMarkers = ['custom-html-above-header', 'custom-html-below-footer']
const domains = ['instatus.com']

// A status page on its own domain is known only by its markers, so its feeds are built here but
// not claimed. A translation's row comes first, so a page in one builds it.
const feeds = definePlatformFeeds(
  [
    {
      key: 'instatus:history',
      template: '{scheme}://{host}/{language}/history.rss',
      format: 'rss',
    },
    { key: 'instatus:history', template: '{scheme}://{host}/history.rss', format: 'rss' },
    {
      key: 'instatus:history',
      template: '{scheme}://{host}/{language}/history.atom',
      format: 'atom',
    },
    { key: 'instatus:history', template: '{scheme}://{host}/history.atom', format: 'atom' },
  ],
  { domains },
)

export const isInstatusHtml = (content: string): boolean => {
  return pageMarkers.every((marker) => content.includes(marker))
}

export const isInstatusHeaders = (headers: Headers): boolean => {
  return headers.get('x-matched-path')?.startsWith('/[lang]/[url]/[type]/[userId]') ?? false
}

// A page in a translation (`/de`, `/zh-tw`) links the history feeds translated to it.
export const parseInstatusUrl = (url: string): InstatusUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const [language] = getPathSegments(parsedUrl)

  if (language && letterPairsRegex.test(language)) {
    return { kind: 'status', language }
  }

  return { kind: 'status' }
}

export const instatusHandler: PlatformHandler = {
  match: (url, content, headers) => {
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

    const params: PlatformFeedParams = {}

    if (parsed.language) {
      params.language = parsed.language
    }

    return [
      pageFeeds.getFeedEntry('instatus:history', params, 'rss'),
      pageFeeds.getFeedEntry('instatus:history', params, 'atom'),
    ]
  },

  // The table reads any host under the domains, so only a page's own subdomain is claimed, not the
  // apex, www or a nested host. A segment before the feed is a translation only in its own form.
  getFeedHint: (url) => {
    const [language, feed] = getPathSegments(url)

    if (!getTenantSubdomain(url, domains) || (feed && !letterPairsRegex.test(language))) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
