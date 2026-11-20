import { nebula } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: category, category-plus, videos, videos-plus.
// Handler needed for: channels, originals, videos-all, videos-all-plus.

export type NebulaUrl = { kind: 'channel'; slug: string } | { kind: 'explore'; category?: string }

const feeds = withHintLabels(nebula.feeds)

export const parseNebulaUrl = (url: string): NebulaUrl | undefined => {
  const page = nebula.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'explore') {
    return { kind: 'explore', category: page.params.category }
  }

  return { kind: 'channel', slug: page.params.slug }
}

export const nebulaHandler: PlatformHandler = {
  match: (url) => {
    return parseNebulaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseNebulaUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'explore') {
      const { category } = parsed

      if (category) {
        return [
          feeds.getFeedEntry('category', { category }),
          feeds.getFeedEntry('category-plus', { category }),
          feeds.getFeedEntry('videos-all'),
          feeds.getFeedEntry('videos-all-plus'),
          feeds.getFeedEntry('originals'),
          feeds.getFeedEntry('channels'),
        ]
      }

      return [
        feeds.getFeedEntry('videos-all'),
        feeds.getFeedEntry('videos-all-plus'),
        feeds.getFeedEntry('originals'),
        feeds.getFeedEntry('channels'),
      ]
    }

    const { slug } = parsed

    return [feeds.getFeedEntry('videos', { slug }), feeds.getFeedEntry('videos-plus', { slug })]
  },

  getFeedHint: feeds.getFeedHint,
}
