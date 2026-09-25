import { getPathSegments, isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BlueskyUrl = { kind: 'profile'; handle: string }

const hosts = ['bsky.app', 'www.bsky.app']

export const parseBlueskyUrl = (url: string): BlueskyUrl | undefined => {
  if (!isHostOf(url, hosts)) {
    return
  }

  const [section, handle] = getPathSegments(url)

  if (section !== 'profile' || !handle) {
    return
  }

  return { kind: 'profile', handle }
}

export const blueskyHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const handle = parseBlueskyUrl(url)?.handle

    if (!handle) {
      return []
    }

    return [
      {
        uri: `https://bsky.app/profile/${handle}/rss`,
        hint: composeHint('bluesky:posts'),
      },
    ]
  },
}
