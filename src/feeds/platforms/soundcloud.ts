import { getPathSegments, isAnyOf, isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type SoundcloudUrl = { kind: 'user'; username: string }

export const hosts = ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']

const userIdRegex = /soundcloud:\/\/users:(\d+)/

const excludedPaths = ['discover', 'stream', 'search', 'upload', 'you', 'settings', 'messages']

const extractUserIdFromContent = (content: string): string | undefined => {
  const match = content.match(userIdRegex)

  return match?.[1]
}

export const parseSoundcloudUrl = (url: string): SoundcloudUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const [username] = getPathSegments(parsedUrl)

  if (!username || isAnyOf(username, excludedPaths)) {
    return
  }

  return { kind: 'user', username }
}

export const soundcloudHandler: PlatformHandler = {
  match: (url) => {
    return parseSoundcloudUrl(url) !== undefined
  },

  resolve: (_url, content) => {
    if (!content) {
      return []
    }

    const userId = extractUserIdFromContent(content)

    if (!userId) {
      return []
    }

    return [
      {
        uri: `https://feeds.soundcloud.com/users/soundcloud:users:${userId}/sounds.rss`,
        hint: composeHint('soundcloud:tracks'),
      },
    ]
  },
}
