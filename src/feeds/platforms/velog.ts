import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type VelogUrl = { kind: 'user'; username: string } | { kind: 'home' }

export const hosts = ['velog.io', 'www.velog.io']

const userRegex = /^\/@([^/]+)/

// v2.velog.io serves the same feed at `/rss/@{username}`, which the `{username}` row reads too.
const feeds = definePlatformFeeds([
  { key: 'velog:trending', template: 'https://v2.velog.io/rss' },
  { key: 'velog:posts', template: 'https://v2.velog.io/rss/{username}' },
])

export const parseVelogUrl = (url: string): VelogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const match = parsedUrl.pathname.match(userRegex)

  if (!match?.[1]) {
    return { kind: 'home' }
  }

  const username = decodeSegment(match[1])

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return parseVelogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseVelogUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [feeds.getFeedEntry('velog:posts', { username: parsed.username })]
    }

    return [feeds.getFeedEntry('velog:trending')]
  },

  getFeedHint: feeds.getFeedHint,
}
