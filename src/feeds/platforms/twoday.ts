import { twoday } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts, topic.
// Handler needed for: commented, summary.

export type TwodayUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'topic'; blog: string; topic: string }

const feeds = withHintLabels(twoday.feeds)

export const parseTwodayUrl = (url: string): TwodayUrl | undefined => {
  const page = twoday.pages.read(url)

  if (!page) {
    return
  }

  const { blog } = page.params

  if (page.key === 'topic') {
    return { kind: 'topic', blog, topic: page.params.topic }
  }

  return { kind: 'blog', blog }
}

export const twodayHandler: PlatformHandler = {
  match: (url) => {
    return parseTwodayUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseTwodayUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'topic') {
      return [
        page.getFeedEntry('topic', { topic: parsed.topic }),
        page.getFeedEntry('posts'),
        page.getFeedEntry('summary'),
        page.getFeedEntry('comments'),
        page.getFeedEntry('commented'),
      ]
    }

    return [
      page.getFeedEntry('posts'),
      page.getFeedEntry('summary'),
      page.getFeedEntry('comments'),
      page.getFeedEntry('commented'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
