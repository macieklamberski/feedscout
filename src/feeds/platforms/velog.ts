import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type VelogUrl = { kind: 'user'; username: string } | { kind: 'home' }

export const hosts = ['velog.io', 'www.velog.io']
const userRegex = /^\/@([^/]+)/

export const parseVelogUrl = (url: string): VelogUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  if (parsedUrl.pathname === '/') {
    return { kind: 'home' }
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
    return parseVelogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseVelogUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'user') {
      return [
        {
          uri: `https://v2.velog.io/rss/${encodeURIComponent(parsed.username)}`,
          hint: composeHint('velog:posts'),
        },
      ]
    }

    return [
      {
        uri: 'https://v2.velog.io/rss',
        hint: composeHint('velog:trending'),
      },
    ]
  },
}
