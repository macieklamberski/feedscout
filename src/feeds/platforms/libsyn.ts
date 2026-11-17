import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LibsynUrl =
  | { kind: 'feed'; showId: string }
  | { kind: 'site'; showId: string }
  | { kind: 'podcast'; slug: string }

const domains = ['libsyn.com']
const feedHosts = ['feeds.libsyn.com']
// The sites host serves every show's site by its show id, as sites.libsyn.com/{showId}.
const siteHosts = ['sites.libsyn.com']

const feeds = definePlatformFeeds(
  'libsyn',
  [
    {
      key: 'podcast',
      main: 'https://feeds.libsyn.com/{showId}/rss',
      aliases: ['https://feeds.libsyn.com/{showId}', '{scheme}://{host}/rss'],
    },
    // Where feeds.libsyn.com/{showId}/rss redirects. The destination id is not in the show id.
    {
      key: 'podcast',
      main: 'https://rss.libsyn.com/shows/{showId}/destinations/{destinationId}.xml',
    },
    // The sites host's feed, which on show 45546 redirects to an empty category feed, and the feed
    // cut to its last episodes, as `last100`.
    { key: 'podcast', main: 'https://sites.libsyn.com/{showId}/rss' },
    { key: 'podcast', main: 'https://feeds.libsyn.com/{showId}/last{count}' },
    { key: 'podcast', main: '{scheme}://{host}/rss/last{count}' },
    { key: 'category', main: '{scheme}://{host}/rss/category/{category}' },
    { key: 'category', main: 'https://sites.libsyn.com/{showId}/rss/category/{category}' },
  ],
  { hosts: { tenants: domains } },
)

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

  if (isHostOf(url, siteHosts)) {
    const [showId] = getPathSegments(url)

    if (!showId || !digitsRegex.test(showId)) {
      return
    }

    return { kind: 'site', showId }
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

    if (parsed.kind === 'feed' || parsed.kind === 'site') {
      return [feeds.getFeedEntry('podcast', { showId: parsed.showId })]
    }

    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('podcast')]
  },

  // The table reads any subdomain as a show, so the page parser refuses feeds.libsyn.com/rss,
  // which answers 404, and a feeds or sites host path without a numeric show ID.
  getFeedHint: (url) => {
    if (!parseLibsynUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
