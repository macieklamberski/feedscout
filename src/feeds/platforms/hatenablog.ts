import { hatenablog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type HatenablogUrl =
  | { kind: 'category'; category: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const feeds = withHintLabels(hatenablog.feeds)

export const parseHatenablogUrl = (url: string): HatenablogUrl | undefined => {
  const page = hatenablog.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', category: page.values.category }
  }

  if (page.key === 'author') {
    return { kind: 'author', author: page.values.author }
  }

  return { kind: 'blog' }
}

export const hatenablogHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenablogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHatenablogUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      const params = { category: parsed.category }

      return [
        page.getFeedEntry('category', params, 'rss'),
        page.getFeedEntry('category', params, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    if (parsed.kind === 'author') {
      const params = { author: parsed.author }

      return [
        page.getFeedEntry('author', params, 'rss'),
        page.getFeedEntry('author', params, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'rss'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
