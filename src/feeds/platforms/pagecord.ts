import { pagecord } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type PagecordUrl = { kind: 'blog' } | { kind: 'tag'; tag: string }

const feeds = withHintLabels(pagecord.feeds)

export const parsePagecordUrl = (url: string): PagecordUrl | undefined => {
  const page = pagecord.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'tag') {
    return { kind: 'tag', tag: page.params.tag }
  }

  return { kind: 'blog' }
}

export const pagecordHandler: PlatformHandler = {
  match: (url) => {
    return parsePagecordUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePagecordUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag }), page.getFeedEntry('blog')]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
