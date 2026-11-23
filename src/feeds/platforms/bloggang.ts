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
  const page = bloggang.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', username: page.params.username }
  }

  if (page.key === 'diary') {
    return { kind: 'diary', username: page.params.username }
  }

  return { kind: 'blog', username: page.params.username }
}

export const bloggangHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggangUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggangUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('posts', { username: parsed.username })]
  },

  getFeedHint: feeds.getFeedHint,
}
