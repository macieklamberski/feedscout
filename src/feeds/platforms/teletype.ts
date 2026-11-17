import { decodeSegment, isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: posts.

export type TeletypeUrl = { kind: 'blog'; username: string }

const hosts = ['teletype.in']

const blogRegex = /^\/@([^/]+)/

const feeds = definePlatformFeeds('teletype', [
  { key: 'posts', main: 'https://teletype.in/rss/{username}', format: 'rss' },
  { key: 'posts', main: 'https://teletype.in/atom/{username}', format: 'atom' },
])

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

    const params = { username: teletypeUrl.username }

    return [feeds.getFeedEntry('posts', params, 'rss'), feeds.getFeedEntry('posts', params, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
