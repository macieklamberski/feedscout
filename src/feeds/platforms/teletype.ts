import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, isDotSegment } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html).
// Handler needed for: post.

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

    // The username sits inside the `@{username}` segment, so it can be a whole `..`.
    if (isDotSegment(teletypeUrl.username)) {
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
