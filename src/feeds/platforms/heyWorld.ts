import { getPathSegments, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HeyWorldUrl = { kind: 'blog'; username: string }

const hosts = ['world.hey.com']

const feeds = definePlatformFeeds([
  { key: 'hey-world:blog', template: 'https://world.hey.com/{username}/feed.atom' },
])

export const parseHeyWorldUrl = (url: string): HeyWorldUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username) {
    return
  }

  return { kind: 'blog', username }
}

export const heyWorldHandler: PlatformHandler = {
  match: (url) => {
    return parseHeyWorldUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHeyWorldUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('hey-world:blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
