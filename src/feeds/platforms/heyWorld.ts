import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HeyWorldUrl = { kind: 'blog'; username: string }

const hosts = ['world.hey.com']

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

    return [
      {
        uri: `https://world.hey.com/${parsed.username}/feed.atom`,
        hint: composeHint('hey-world:blog'),
      },
    ]
  },
}
