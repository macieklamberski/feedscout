import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

// Match /album/{id} (canonical) or /{userid}/album/{id} (legacy form).
const albumRegex = /(?:^|\/)album\/(\d+)/

const hosts = ['www.ximalaya.com', 'ximalaya.com']

export const ximalayaHandler: PlatformHandler = {
  match: (url) => {
    return isHostOf(url, hosts)
  },

  resolve: (url) => {
    const { pathname } = new URL(url)
    const albumMatch = pathname.match(albumRegex)
    const id = albumMatch?.[1]

    if (!id) {
      return []
    }

    return [
      {
        uri: `https://www.ximalaya.com/album/${id}.xml`,
        hint: composeHint('ximalaya:album'),
      },
    ]
  },
}
