import { fc2 } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type Fc2Url =
  | { kind: 'blog' }
  | { kind: 'category'; category: string }
  | { kind: 'tag'; tag: string }

const feeds = withHintLabels(fc2.feeds)

export const parseFc2Url = (url: string): Fc2Url | undefined => {
  const page = fc2.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', category: page.values.category }
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.values.tag }
  }

  return { kind: 'blog' }
}

export const fc2Handler: PlatformHandler = {
  match: (url) => {
    return parseFc2Url(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFc2Url(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { category: parsed.category }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('trackbacks'),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('trackbacks'),
      ]
    }

    return [
      page.getFeedEntry('posts'),
      page.getFeedEntry('comments'),
      page.getFeedEntry('trackbacks'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
