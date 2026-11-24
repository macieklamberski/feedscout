import { arena } from 'feedintel'
import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: channel, profile.
// Handler needed for: editorial.

export type ArenaUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'channel'; username: string; channel: string }
  | { kind: 'editorial' }

const hosts = arena.hosts.exact

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

const feeds = withHintLabels(arena.feeds)

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

    // The editorial feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'editorial') {
      return [feeds.getFeedEntry('editorial')]
    }

    if (parsed.kind === 'channel') {
      const params = { username: parsed.username, channel: parsed.channel }

      return [feeds.getFeedEntry('channel', params), feeds.getFeedEntry('editorial')]
    }

    return [
      feeds.getFeedEntry('profile', { username: parsed.username }),
      feeds.getFeedEntry('editorial'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
