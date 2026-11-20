import { producthunt } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ProducthuntUrl =
  | { kind: 'product'; slug: string }
  | { kind: 'topic'; topic: string }
  | { kind: 'home' }

const feeds = withHintLabels(producthunt.feeds)

// Every page links the site-wide product feed, so any other page reads as the home page.
export const parseProducthuntUrl = (url: string): ProducthuntUrl | undefined => {
  const page = producthunt.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'product') {
    return { kind: 'product', slug: page.params.slug }
  }

  if (page.key === 'topic') {
    return { kind: 'topic', topic: page.params.topic }
  }

  return { kind: 'home' }
}

export const producthuntHandler: PlatformHandler = {
  match: (url) => {
    return parseProducthuntUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseProducthuntUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'topic') {
      return [
        feeds.getFeedEntry('category', { category: parsed.topic }),
        feeds.getFeedEntry('products'),
      ]
    }

    return [feeds.getFeedEntry('products')]
  },

  getFeedHint: feeds.getFeedHint,
}
