import { bloggang } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Discoverable without handler.

export type BloggangUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'post'; username: string }
  | { kind: 'diary'; username: string }

const feeds = withHintLabels(bloggang.feeds)

export const parseBloggangUrl = (url: string): BloggangUrl | undefined => {
  const page = bloggang.pages.readUrl(url)

  if (!page) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', username: page.values.username }
  }

  if (page.key === 'diary') {
    return { kind: 'diary', username: page.values.username }
  }

  return { kind: 'blog', username: page.values.username }
}

export const bloggangHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggangUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggangUrl(url)
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
