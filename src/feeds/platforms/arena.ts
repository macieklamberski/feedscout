import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ArenaUrl =
  | { kind: 'profile'; username: string }
  | { kind: 'channel'; username: string; channel: string }
  | { kind: 'editorial' }

const hosts = ['are.na', 'www.are.na']
const excludedPaths = [
  'about',
  'api',
  'explore',
  'login',
  'premium',
  'privacy',
  'search',
  'settings',
  'signup',
  'support',
  'terms',
]

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

  if (isAnyOf(username, excludedPaths)) {
    return
  }

  // The profile feed itself sits at /{username}/feed/rss, so `feed` names no channel.
  if (channel && !isAnyOf(channel, 'feed')) {
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
      return [
        {
          uri: 'https://www.are.na/editorial/feed/rss',
          hint: composeHint('arena:editorial'),
        },
      ]
    }

    if (parsed.kind === 'channel') {
      return [
        {
          uri: `https://www.are.na/${parsed.username}/${parsed.channel}/feed/rss`,
          hint: composeHint('arena:channel'),
        },
      ]
    }

    return [
      {
        uri: `https://www.are.na/${parsed.username}/feed/rss`,
        hint: composeHint('arena:profile'),
      },
    ]
  },
}
