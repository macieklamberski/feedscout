import { isHostOf } from 'trousse'
import type { PlatformHandler } from '../../../common/uris/platform/types.js'
import { composeHint } from '../../../common/utils.js'

// Discoverability: Not discoverable without handler.
//
// Ximalaya exposes RSS 2.0 only for podcast albums, at
// `www.ximalaya.com/album/{id}.xml` (with iTunes namespace and m4a
// enclosures); album HTML pages are SPA shells that do not advertise the
// feed via `<link rel="alternate">`, and no user/category/sound-level feed
// exists. The handler extracts the numeric album id from both the canonical
// `/album/{id}` form and the legacy `/{userid}/album/{id}` shape.

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
