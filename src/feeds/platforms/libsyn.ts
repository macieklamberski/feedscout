import { libsyn } from 'feedintel'
import { getPathSegments, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LibsynUrl =
  | { kind: 'feed'; showId: string }
  | { kind: 'site'; showId: string }
  | { kind: 'podcast'; slug: string }

const domains = libsyn.hosts.tenants
const feedHosts = ['feeds.libsyn.com']
// The sites host serves every show's site by its show id, as sites.libsyn.com/{showId}.
const siteHosts = ['sites.libsyn.com']

const feeds = withHintLabels(libsyn.feeds)

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

  getFeedHint: feeds.getFeedHint,
}
