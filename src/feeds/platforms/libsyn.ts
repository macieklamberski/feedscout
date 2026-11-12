import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LibsynUrl = { kind: 'feed'; showId: string } | { kind: 'podcast'; slug: string }

const domains = ['libsyn.com']
const feedHosts = ['feeds.libsyn.com']

const feeds = definePlatformFeeds([
  { key: 'libsyn:podcast', template: 'https://feeds.libsyn.com/{showId}/rss' },
  { key: 'libsyn:podcast', template: 'https://feeds.libsyn.com/{showId}' },
  { key: 'libsyn:podcast', template: 'https://{slug}.libsyn.com/rss' },
])

export const parseLibsynUrl = (url: string): LibsynUrl | undefined => {
  const slug = getTenantSubdomain(url, domains)

  if (!slug) {
    return
  }

  if (isHostOf(url, feedHosts)) {
    const [showId] = getPathSegments(url)

    // feeds.libsyn.com without a numeric show ID has no useful feed
    // (apex /rss returns 404).
    if (!showId || !digitsRegex.test(showId)) {
      return
    }

    return { kind: 'feed', showId }
  }

  return { kind: 'podcast', slug }
}

export const libsynHandler: PlatformHandler = {
  match: (url) => {
    return parseLibsynUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLibsynUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'feed') {
      return [feeds.getFeedEntry('libsyn:podcast', { showId: parsed.showId })]
    }

    return [feeds.getFeedEntry('libsyn:podcast', { slug: parsed.slug })]
  },

  // The table reads any subdomain as a show, so the page parser refuses feeds.libsyn.com/rss,
  // which answers 404, and a feeds host path without a numeric show ID.
  getFeedKey: (url) => {
    if (!parseLibsynUrl(url)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
