import { ghost } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type GhostUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const feeds = withHintLabels(ghost.feeds)

export const parseGhostUrl = (url: string): GhostUrl | undefined => {
  const page = ghost.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.values.tag }
  }

  if (page.key === 'author') {
    return { kind: 'author', author: page.values.author }
  }

  return { kind: 'blog' }
}

export const ghostHandler: PlatformHandler = {
  match: (url) => {
    return parseGhostUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGhostUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag }), page.getFeedEntry('blog')]
    }

    if (parsed.kind === 'author') {
      return [page.getFeedEntry('author', { author: parsed.author }), page.getFeedEntry('blog')]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
