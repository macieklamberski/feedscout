import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { isHostOf } from '../../../common/utils.js'

const hosts = ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']

const extractUserIdFromContent = (content: string): string | undefined => {
  const match = content.match(/soundcloud:\/\/users:(\d+)/)

  return match?.[1]
}

export const soundcloudHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    // Match user profile pages: soundcloud.com/{user}
    // Exclude system paths like /discover, /stream, /search, etc.
    const excludedPaths = ['discover', 'stream', 'search', 'upload', 'you', 'settings', 'messages']

    return pathSegments.length >= 1 && !excludedPaths.includes(pathSegments[0])
  },

  resolve: (url, content) => {
    if (!content) {
      return []
    }

    const userId = extractUserIdFromContent(content)

    if (!userId) {
      return []
    }

    return [`https://feeds.soundcloud.com/users/soundcloud:users:${userId}/sounds.rss`]
  },
}
