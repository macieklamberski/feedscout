import { ximalaya } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: album.

export type XimalayaUrl = { kind: 'album'; albumId: string }

const feeds = withHintLabels(ximalaya.feeds)

export const parseXimalayaUrl = (url: string): XimalayaUrl | undefined => {
  const page = ximalaya.pages.readUrl(url)

  if (!page) {
    return
  }

  return { kind: 'album', albumId: page.values.albumId }
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
