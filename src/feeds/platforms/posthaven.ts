import { posthaven } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: tag.

export type PosthavenUrl = { kind: 'tag'; tag: string } | { kind: 'blog' }

const feeds = withHintLabels(posthaven.feeds)

export const parsePosthavenUrl = (url: string): PosthavenUrl | undefined => {
  const page = posthaven.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.params.tag }
  }

  return { kind: 'blog' }
}

export const posthavenHandler: PlatformHandler = {
  match: (url) => {
    return parsePosthavenUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePosthavenUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag }), page.getFeedEntry('posts')]
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
