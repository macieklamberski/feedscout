import { isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ListedUrl = { kind: 'blog'; username: string }

const hosts = ['listed.to', 'www.listed.to']

const userRegex = /^\/@([^/]+)/

// Listed serves the same feed at `/feed` and, by numeric author id, at `/authors/{id}/feed`.
const feeds = definePlatformFeeds([
  { key: 'listed:blog', template: 'https://listed.to/@{username}/feed.rss' },
  { key: 'listed:blog', template: 'https://listed.to/@{username}/feed' },
  { key: 'listed:blog', template: 'https://listed.to/authors/{id}/feed' },
])

export const parseListedUrl = (url: string): ListedUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const username = new URL(url).pathname.match(userRegex)?.[1]

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const listedHandler: PlatformHandler = {
  match: (url) => {
    return parseListedUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseListedUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('listed:blog', { username: parsed.username })]
  },

  getFeedKey: feeds.getFeedKey,
}
