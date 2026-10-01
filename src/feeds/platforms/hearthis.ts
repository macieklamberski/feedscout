import { getPathSegments, isAnyOf, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HearthisUrl = { kind: 'profile'; username: string }

const hosts = ['hearthis.at', 'www.hearthis.at']
const excludedPaths = [
  'about',
  'api',
  'feed',
  'login',
  'privacy',
  'search',
  'set',
  'signup',
  'terms',
]

export const parseHearthisUrl = (url: string): HearthisUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [username] = getPathSegments(url)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'profile', username }
}

export const hearthisHandler: PlatformHandler = {
  match: (url) => {
    return parseHearthisUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHearthisUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://hearthis.at/${parsed.username}/podcast/`,
        hint: composeHint('hearthis:tracks'),
      },
      { uri: 'https://hearthis.at/new_tracks.rss', hint: composeHint('hearthis:new-tracks') },
    ]
  },
}
