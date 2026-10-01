import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Unmeasured, teletype.in answered Cloudflare 522 from two networks on 2026-09-27.

export type TeletypeUrl = { kind: 'blog'; username: string }

const hosts = ['teletype.in']

const blogRegex = /^\/@([^/]+)/

export const parseTeletypeUrl = (url: string): TeletypeUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const match = parsedUrl.pathname.match(blogRegex)
  const username = decodeSegment(match?.[1])

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const teletypeHandler: PlatformHandler = {
  match: (url) => {
    return parseTeletypeUrl(url) !== undefined
  },

  resolve: (url) => {
    const teletypeUrl = parseTeletypeUrl(url)

    if (!teletypeUrl) {
      return []
    }

    const username = encodeURIComponent(teletypeUrl.username)

    return [
      {
        uri: `https://teletype.in/rss/${username}`,
        hint: composeHint('teletype:posts', 'rss'),
      },
      {
        uri: `https://teletype.in/atom/${username}`,
        hint: composeHint('teletype:posts', 'atom'),
      },
    ]
  },
}
