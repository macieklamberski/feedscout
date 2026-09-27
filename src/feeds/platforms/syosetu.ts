import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers author.

const hosts = ['mypage.syosetu.com']
const writerIdRegex = /^\/(\d+)/

export const syosetuHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts) && writerIdRegex.test(new URL(url).pathname)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const writerId = pathname.match(writerIdRegex)?.[1]

    if (!writerId) {
      return []
    }

    return [
      {
        uri: `https://api.syosetu.com/writernovel/${writerId}.Atom`,
        hint: composeHint('syosetu:author'),
      },
      {
        uri: `https://api.syosetu.com/writer/${writerId}.Atom`,
        hint: composeHint('syosetu:activity'),
      },
    ]
  },
}
