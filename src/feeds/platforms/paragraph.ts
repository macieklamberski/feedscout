import { paragraph } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type ParagraphUrl = { kind: 'blog'; username: string }

const feeds = withHintLabels(paragraph.feeds)

export const parseParagraphUrl = (url: string): ParagraphUrl | undefined => {
  const page = paragraph.pages.read(url)

  if (!page) {
    return
  }

  return { kind: 'blog', username: page.params.username }
}

export const paragraphHandler: PlatformHandler = {
  match: (url) => {
    return parseParagraphUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseParagraphUrl(url)

    if (!parsed) {
      return []
    }

    return [feeds.getFeedEntry('blog', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
