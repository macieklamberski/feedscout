import { fireside } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type FiresideUrl = { kind: 'podcast'; slug: string; tag?: string }

const feeds = withHintLabels(fireside.feeds)

export const parseFiresideUrl = (url: string): FiresideUrl | undefined => {
  const page = fireside.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'podcast', slug: page.params.slug, tag: page.params.tag }
}

export const firesideHandler: PlatformHandler = {
  match: (url) => {
    return parseFiresideUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseFiresideUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.tag) {
      return [
        page.getFeedEntry('tag', { tag: parsed.tag }),
        page.getFeedEntry('podcast', { slug: parsed.slug }, 'rss'),
        page.getFeedEntry('podcast', { slug: parsed.slug }, 'json'),
        page.getFeedEntry('blog'),
      ]
    }

    return [
      page.getFeedEntry('podcast', { slug: parsed.slug }, 'rss'),
      page.getFeedEntry('podcast', { slug: parsed.slug }, 'json'),
      page.getFeedEntry('blog'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
