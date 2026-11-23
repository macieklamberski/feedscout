import { webtoons } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: series.

export type WebtoonsUrl = {
  kind: 'series'
  language: string
  genre: string
  name: string
  titleNo: string
}

const feeds = withHintLabels(webtoons.feeds)

export const parseWebtoonsUrl = (url: string): WebtoonsUrl | undefined => {
  const page = webtoons.pages.read(url)

  if (!page) {
    return
  }

  const { language, genre, name, titleNo } = page.params

  return { kind: 'series', language, genre, name, titleNo }
}

export const webtoonsHandler: PlatformHandler = {
  match: (url) => {
    return parseWebtoonsUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = webtoons.pages.read(url)

    if (!page) {
      return []
    }

    const { language, genre, name, titleNo } = page.params
    const variant = page.key === 'canvas' ? 'canvas' : undefined

    return [feeds.getFeedEntry('series', { language, genre, name, titleNo }, undefined, variant)]
  },

  getFeedHint: feeds.getFeedHint,
}
