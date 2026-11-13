import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type XimalayaUrl = { kind: 'album'; albumId: string }

const hosts = ['www.ximalaya.com', 'ximalaya.com']

// Match /album/{id} (canonical) or /{userid}/album/{id} (legacy form).
const albumRegex = /(?:^|\/)album\/(?<albumId>[^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'ximalaya:album', template: 'https://www.ximalaya.com/album/{albumId}.xml' },
])

export const parseXimalayaUrl = (url: string): XimalayaUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !isHostOf(parsedUrl, hosts)) {
    return
  }

  const albumId = parsedUrl.pathname.match(albumRegex)?.groups?.albumId

  if (!albumId || !digitsRegex.test(albumId)) {
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

    return [feeds.getFeedEntry('ximalaya:album', { albumId: parsed.albumId })]
  },

  getFeedHint: feeds.getFeedHint,
}
