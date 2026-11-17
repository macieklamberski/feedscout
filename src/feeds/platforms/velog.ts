import { velog } from 'feedintel'
import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: posts, trending.

export type VelogUrl = { kind: 'user'; username: string } | { kind: 'home' }

export const hosts = velog.hosts.exact

const userRegex = /^\/@([^/]+)/

const feeds = withHintLabels(velog.feeds)

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

    // The trending feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'user') {
      return [
        feeds.getFeedEntry('posts', { username: parsed.username }),
        feeds.getFeedEntry('trending'),
      ]
    }

    return [feeds.getFeedEntry('trending')]
  },

  getFeedHint: feeds.getFeedHint,
}
