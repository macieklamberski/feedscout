import { ximalaya } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { digitsRegex } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: album.

export type XimalayaUrl = { kind: 'album'; albumId: string }

const hosts = ximalaya.hosts.exact

// Match /album/{id} (canonical) or /{userid}/album/{id} (legacy form).
const albumRegex = /(?:^|\/)album\/(?<albumId>[^/]+)/i

const feeds = withHintLabels(ximalaya.feeds)

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

    return [feeds.getFeedEntry('album', { albumId: parsed.albumId })]
  },

  getFeedHint: feeds.getFeedHint,
}
