import { smeBlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type SmeBlogUrl = { kind: 'blog'; username: string } | { kind: 'home' }

const feeds = withHintLabels(smeBlog.feeds)

export const parseSmeBlogUrl = (url: string): SmeBlogUrl | undefined => {
  const page = smeBlog.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'home') {
    return { kind: 'home' }
  }

  return { kind: 'blog', username: page.values.username }
}

export const smeBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseSmeBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseSmeBlogUrl(url)

    if (!parsed) {
      return []
    }

    // The site feed needs no value from the page, so every page builds it after its own feeds.
    if (parsed.kind === 'blog') {
      return [
        feeds.getFeedEntry('posts', { username: parsed.username }),
        feeds.getFeedEntry('site'),
      ]
    }

    return [feeds.getFeedEntry('site')]
  },

  getFeedHint: feeds.getFeedHint,
}
