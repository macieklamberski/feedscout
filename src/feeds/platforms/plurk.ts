import { plurk } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: plurks, responses.

export type PlurkUrl = { kind: 'post'; postId: string } | { kind: 'user'; username: string }

const hosts = plurk.hosts.exact

const feeds = withHintLabels(plurk.feeds)

export const parsePlurkUrl = (url: string): PlurkUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const segments = getPathSegments(url)
  const [mobileOrRoute] = segments
  const isMobile = isAnyOf(mobileOrRoute, 'm')
  const [route, value] = isMobile ? segments.slice(1) : segments

  if (isAnyOf(route, 'p')) {
    if (!value) {
      return
    }

    return { kind: 'post', postId: value }
  }

  const username = isAnyOf(route, 'u') ? value : route

  // Plurk names carry no dots, so a dotted segment such as robots.txt is a file of the site.
  if (!username || username.includes('.')) {
    return
  }

  return { kind: 'user', username }
}

export const plurkHandler: PlatformHandler = {
  match: (url) => {
    return parsePlurkUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePlurkUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'post') {
      return [feeds.getFeedEntry('responses', { postId: parsed.postId })]
    }

    return [feeds.getFeedEntry('plurks', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
