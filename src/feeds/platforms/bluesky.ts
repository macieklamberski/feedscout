import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BlueskyUrl = { kind: 'profile'; handle: string }

const hosts = ['bsky.app', 'deer.social', 'main.bsky.dev']

// web-cdn.bsky.app and main.bsky.dev serve the same app and the same feeds under the same paths.
// main.bsky.dev links each post on main.bsky.dev.
const feeds = definePlatformFeeds([
  {
    key: 'bluesky:posts',
    main: 'https://bsky.app/profile/{handle}/rss',
    aliases: ['https://web-cdn.bsky.app/profile/{handle}/rss'],
  },
  { key: 'bluesky:posts', main: 'https://main.bsky.dev/profile/{handle}/rss' },
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
