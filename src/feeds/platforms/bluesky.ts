import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BlueskyUrl = { kind: 'profile'; handle: string }

const hosts = ['bsky.app', 'www.bsky.app']

// web-cdn.bsky.app serves the same app and the same feeds under the same paths.
const feeds = definePlatformFeeds([
  { key: 'bluesky:posts', template: 'https://bsky.app/profile/{handle}/rss' },
  { key: 'bluesky:posts', template: 'https://web-cdn.bsky.app/profile/{handle}/rss' },
])

export const parseBlueskyUrl = (url: string): BlueskyUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, handle] = getPathSegments(url)

  if (!isAnyOf(section, 'profile') || !handle) {
    return
  }

  return { kind: 'profile', handle }
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return parseBlueskyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlueskyUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('bluesky:posts', { handle: parsed.handle })]
  },

  getFeedHint: feeds.getFeedHint,
}
