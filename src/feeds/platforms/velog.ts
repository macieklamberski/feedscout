import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type VelogUrl = { kind: 'user'; username: string }

export const hosts = ['velog.io', 'www.velog.io']
const userRegex = /^\/@([^/]+)/

export const parseVelogUrl = (url: string): VelogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const match = parsedUrl.pathname.match(userRegex)

  if (!match?.[1]) {
    return
  }

  const username = decodeSegment(match[1])

  if (!username) {
    return
  }

  return { kind: 'user', username }
}

export const velogHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const username = parseVelogUrl(url)?.username

    if (username) {
      return [
        {
          uri: `https://v2.velog.io/rss/${encodeURIComponent(username)}`,
          hint: composeHint('velog:posts'),
        },
      ]
    }

    // Homepage: trending posts feed.
    if (pathname === '/') {
      return [
        {
          uri: 'https://v2.velog.io/rss',
          hint: composeHint('velog:trending'),
        },
      ]
    }

    return []
  },
}
