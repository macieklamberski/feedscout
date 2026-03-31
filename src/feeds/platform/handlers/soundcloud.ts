import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isAnyOf, isHostOf } from '../../../common/utils.js'

const userIdRegex = /soundcloud:\/\/users:(\d+)/

const hosts = ['soundcloud.com', 'www.soundcloud.com', 'm.soundcloud.com']
const excludedPaths = ['discover', 'stream', 'search', 'upload', 'you', 'settings', 'messages']

const extractUserIdFromContent = (content: string): string | undefined => {
  const match = content.match(userIdRegex)

  return match?.[1]
}

export const soundcloudHandler: PlatformHandler = {
  match: (url) => {
    if (!isHostOf(url, hosts)) {
      return false
    }

    const { pathname } = new URL(url)
    const pathSegments = pathname.split('/').filter(Boolean)

    return pathSegments.length >= 1 && !isAnyOf(pathSegments[0], excludedPaths)
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
