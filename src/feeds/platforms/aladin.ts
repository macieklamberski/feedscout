import { aladin } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: category.

export type AladinUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'category'; username: string; categoryId: string }

const feeds = withHintLabels(aladin.feeds)

export const parseAladinUrl = (url: string): AladinUrl | undefined => {
  const page = aladin.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', username: page.values.username, categoryId: page.values.categoryId }
  }

  return { kind: 'blog', username: page.values.username }
}

export const aladinHandler: PlatformHandler = {
  match: (url) => {
    return parseAladinUrl(url) !== undefined
  },

  resolve: (url) => {
    const page = parseAladinUrl(url)

    if (!page) {
      return []
    }

    if (page.kind === 'category') {
      // Only the blog's subscribe page links a category feed, as an http url that redirects here.
      return [
        feeds.getFeedEntry('category', {
          username: page.username,
          categoryId: page.categoryId,
        }),
        feeds.getFeedEntry('posts', { username: page.username }),
      ]
    }

    return [feeds.getFeedEntry('posts', { username: page.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
