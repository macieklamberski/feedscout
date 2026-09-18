import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

const hosts = ['mypage.syosetu.com']
const writerIdRegex = /^\/(\d+)/

export const syosetuHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && writerIdRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    try {
      const writerId = new URL(url).pathname.match(writerIdRegex)?.[1]

      if (!writerId) {
        return []
      }

      return [
        {
          uri: `https://api.syosetu.com/writernovel/${writerId}.Atom`,
          hint: composeHint('syosetu:author'),
        },
      ]
    } catch {}

    return []
  },
}
