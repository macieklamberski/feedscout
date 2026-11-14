import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ArenaUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'channel'; username: string; channel: string }
  | { kind: 'editorial' }

const hosts = ['are.na', 'www.are.na']

// Views of a profile. The profile feed sits at /{username}/feed/rss, so `feed` names no channel.
const profilePaths = [
  'all',
  'blocks',
  'channels',
  'feed',
  'followers',
  'following',
  'groups',
  'index',
  'table',
]

// `/editorial/feed/rss` reads before `/{username}/feed/rss`, so it reads as the editorial feed.
const feeds = definePlatformFeeds([
  { key: 'arena:editorial', template: 'https://www.are.na/editorial/feed/rss' },
  { key: 'arena:profile', template: 'https://www.are.na/{username}/feed/rss' },
  { key: 'arena:channel', template: 'https://www.are.na/{username}/{channel}/feed/rss' },
])

export const parseArenaUrl = (url: string): ArenaUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username, channel] = getPathSegments(url)

  // Article pages under /editorial have no feed of their own.
  if (isAnyOf(username, 'editorial')) {
    return { kind: 'editorial' }
  }

  if (!username) {
    return
  }

  if (channel && !isAnyOf(channel, profilePaths)) {
    return { kind: 'channel', username, channel }
  }

  return { kind: 'profile', username }
}

export const arenaHandler: PlatformHandler = {
  match: (url) => {
    return parseArenaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArenaUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'editorial') {
      return [feeds.getFeedEntry('arena:editorial')]
    }

    if (parsed.kind === 'channel') {
      const params = { username: parsed.username, channel: parsed.channel }

      return [feeds.getFeedEntry('arena:channel', params)]
    }

    return [feeds.getFeedEntry('arena:profile', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
