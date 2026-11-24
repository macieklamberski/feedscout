import { viabloga } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: category, comments, wiki.

export type ViablogaUrl = { kind: 'blog' } | { kind: 'category'; category: string }

const feeds = withHintLabels(viabloga.feeds)

export const parseViablogaUrl = (url: string): ViablogaUrl | undefined => {
  const page = viabloga.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', category: page.params.category }
  }

  return { kind: 'blog' }
}

export const viablogaHandler: PlatformHandler = {
  match: (url) => {
    return parseViablogaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseViablogaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { category: parsed.category }, 'rss'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
        page.getFeedEntry('posts', {}, 'rdf'),
        page.getFeedEntry('comments', {}, 'rss'),
        page.getFeedEntry('wiki', {}, 'rdf'),
      ]
    }

    return [
      page.getFeedEntry('posts', {}, 'rss'),
      page.getFeedEntry('posts', {}, 'atom'),
      page.getFeedEntry('posts', {}, 'rdf'),
      page.getFeedEntry('comments', {}, 'rss'),
      page.getFeedEntry('wiki', {}, 'rdf'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
