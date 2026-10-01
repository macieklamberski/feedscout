import { getPathSegments, isHostOf, isSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LibsynUrl = { kind: 'feed'; showId: string } | { kind: 'podcast' }

const domains = ['libsyn.com']
const feedHosts = ['feeds.libsyn.com']
const numericRegex = /^\d+$/

export const parseLibsynUrl = (url: string): LibsynUrl | undefined => {
  if (!isSubdomainOf(url, domains)) {
    return
  }

  if (isHostOf(url, feedHosts)) {
    const [showId] = getPathSegments(url)

    // feeds.libsyn.com without a numeric show ID has no useful feed
    // (apex /rss returns 404).
    if (!showId || !numericRegex.test(showId)) {
      return
    }

    return { kind: 'feed', showId }
  }

  return { kind: 'podcast' }
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
      return [
        {
          uri: `https://feeds.libsyn.com/${parsed.showId}/rss`,
          hint: composeHint('libsyn:podcast'),
        },
      ]
    }

    const { origin } = new URL(url)

    return [{ uri: `${origin}/rss`, hint: composeHint('libsyn:podcast') }]
  },
}
