import { pchome } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Unmeasured, bot wall.

export type PchomeUrl =
  | { kind: 'paper'; username: string }
  | { kind: 'category'; username: string; category: string }

const feeds = withHintLabels(pchome.feeds)

export const parsePchomeUrl = (url: string): PchomeUrl | undefined => {
  const page = pchome.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', username: page.values.username, category: page.values.category }
  }

  return { kind: 'paper', username: page.values.username }
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
