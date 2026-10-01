import { isHostOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type XimalayaUrl = { kind: 'album'; albumId: string }

const hosts = ['www.ximalaya.com', 'ximalaya.com']

// Match /album/{id} (canonical) or /{userid}/album/{id} (legacy form).
const albumRegex = /(?:^|\/)album\/(\d+)/i

export const parseXimalayaUrl = (url: string): XimalayaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const albumId = parsedUrl.pathname.match(albumRegex)?.[1]

  if (!albumId) {
    return
  }

  return { kind: 'album', albumId }
}

export const ximalayaHandler: PlatformHandler = {
  match: (url) => {
    return parseXimalayaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseXimalayaUrl(url)

    if (!parsed) {
      return []
    }

    return [
      {
        uri: `https://www.ximalaya.com/album/${parsed.albumId}.xml`,
        hint: composeHint('ximalaya:album'),
      },
    ]
  },
}
