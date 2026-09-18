import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Syosetu serves an Atom feed per author at
// `api.syosetu.com/writernovel/{writerId}.Atom`, with a capital A in the
// extension.
//
// There is no per-work feed, and a novel URL carries an ncode rather than the
// numeric writer id, so only an author page resolves.

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
