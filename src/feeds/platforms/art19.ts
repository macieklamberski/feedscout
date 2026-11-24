import { art19 } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type Art19Url = { kind: 'show'; slug: string }

const feeds = withHintLabels(art19.feeds)

export const parseArt19Url = (url: string): Art19Url | undefined => {
  const page = art19.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'show', slug: page.params.slug }
}

export const art19Handler: PlatformHandler = {
  match: (url) => {
    return parseArt19Url(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseArt19Url(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('show', { slug: parsed.slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
