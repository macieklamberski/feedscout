import { pchome } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, bot wall.

export type PchomeUrl =
  | { kind: 'paper'; username: string }
  | { kind: 'category'; username: string; category: string }

const feeds = withHintLabels(pchome.feeds)

export const parsePchomeUrl = (url: string): PchomeUrl | undefined => {
  const page = pchome.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', username: page.params.username, category: page.params.category }
  }

  return { kind: 'paper', username: page.params.username }
}

export const pchomeHandler: PlatformHandler = {
  match: (url) => {
    return parsePchomeUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePchomeUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        feeds.getFeedEntry('category', {
          username: parsed.username,
          category: parsed.category,
        }),
        feeds.getFeedEntry('posts', { username: parsed.username }),
      ]
    }

    return [feeds.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
