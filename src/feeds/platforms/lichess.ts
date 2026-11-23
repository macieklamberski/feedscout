import { lichess } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type LichessUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'community'; language?: string }
  | { kind: 'officialBlog' }

const feeds = withHintLabels(lichess.feeds)

// Every other page links only the site-wide updates feed, the platform's own news.
export const parseLichessUrl = (url: string): LichessUrl | undefined => {
  const page = lichess.pages.read(url)

  if (!page || page.key === 'topic') {
    return
  }

  if (page.key === 'blog') {
    return { kind: 'blog', username: page.params.username }
  }

  if (page.key === 'community') {
    return { kind: 'community', language: page.params.language }
  }

  return { kind: 'officialBlog' }
}

export const lichessHandler: PlatformHandler = {
  match: (url) => {
    return parseLichessUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLichessUrl(url)

    if (!parsed) {
      return []
    }

    if (parsed.kind === 'blog') {
      return [feeds.getFeedEntry('blog', { username: parsed.username })]
    }

    if (parsed.kind === 'community') {
      return [feeds.getFeedEntry('community', { language: parsed.language })]
    }

    return [feeds.getFeedEntry('blog', { username: 'Lichess' })]
  },

  getFeedHint: feeds.getFeedHint,
}
