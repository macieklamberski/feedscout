import { spreaker } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SpreakerUrl = { kind: 'show'; showId: string }

const hosts = spreaker.hosts.exact

const podcastRegex = /^\/podcast\/[\w-]+--(\d+)(?:\/|$)/i
// /show/{id} bare numeric form 301-redirects to the slug-suffixed canonical.
const showRegex = /^\/show\/(\d+)(?:\/|$)/i

const feeds = withHintLabels(spreaker.feeds)

export const parseSpreakerUrl = (url: string): SpreakerUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const { pathname } = parsedUrl
  const showId = pathname.match(podcastRegex)?.[1] ?? pathname.match(showRegex)?.[1]

  if (!showId) {
    return
  }

  return { kind: 'show', showId }
}

export const spreakerHandler: PlatformHandler = {
  match: (url) => {
    return parseSpreakerUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSpreakerUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('podcast', { showId: parsed.showId })]
  },

  getFeedHint: feeds.getFeedHint,
}
