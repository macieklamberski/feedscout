import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint, isHostOf } from '../../../common/utils.js'

// Discoverable without handler.

const hosts = ['spreaker.com', 'www.spreaker.com']
const podcastRegex = /^\/podcast\/[\w-]+--(\d+)/

export const spreakerHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const match = pathname.match(podcastRegex)

    if (!match?.[1]) {
      return []
    }

    return [
      {
        uri: `https://www.spreaker.com/show/${match[1]}/episodes/feed`,
        hint: composeHint('spreaker:podcast'),
      },
    ]
  },
}
