import { alloforum } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: category, latest-topics, subcategory.

export type AlloforumUrl =
  | { kind: 'forum' }
  | { kind: 'category'; slug: string; categoryId: string }
  | {
      kind: 'subcategory'
      slug: string
      categoryId: string
      subcategorySlug: string
      subcategoryId: string
    }

const feeds = withHintLabels(alloforum.feeds)

export const parseAlloforumUrl = (url: string): AlloforumUrl | undefined => {
  const page = alloforum.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'subcategory') {
    return {
      kind: 'subcategory',
      slug: page.values.slug,
      categoryId: page.values.categoryId,
      subcategorySlug: page.values.subcategorySlug,
      subcategoryId: page.values.subcategoryId,
    }
  }

  if (page.key === 'category') {
    return { kind: 'category', slug: page.values.slug, categoryId: page.values.categoryId }
  }

  return { kind: 'forum' }
}

export const alloforumHandler: PlatformHandler = {
  match: (url) => {
    return parseAlloforumUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseAlloforumUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'subcategory') {
      return [page.getFeedEntry('subcategory', parsed), page.getFeedEntry('latest-topics')]
    }

    if (parsed.kind === 'category') {
      return [page.getFeedEntry('category', parsed), page.getFeedEntry('latest-topics')]
    }

    return [page.getFeedEntry('latest-topics')]
  },

  getFeedHint: feeds.getFeedHint,
}
