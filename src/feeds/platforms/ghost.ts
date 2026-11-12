import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GhostUrl =
  | { kind: 'tag'; blog: string; tag: string }
  | { kind: 'author'; blog: string; author: string }
  | { kind: 'blog'; blog: string }

const domains = ['ghost.io']

const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'ghost:tag', template: 'https://{blog}.ghost.io/tag/{tag}/rss/' },
  { key: 'ghost:author', template: 'https://{blog}.ghost.io/author/{author}/rss/' },
  { key: 'ghost:blog', template: 'https://{blog}.ghost.io/rss/' },
])

export const parseGhostUrl = (url: string): GhostUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', blog, tag }
  }

  const author = pathname.match(authorRegex)?.[1]

  if (author) {
    return { kind: 'author', blog, author }
  }

  return { kind: 'blog', blog }
}

export const ghostHandler: PlatformHandler = {
  match: (url) => {
    return parseGhostUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGhostUrl(url)

    if (!parsed) {
      return []
    }

    const params = { blog: parsed.blog }
    const blogFeed = feeds.getFeedEntry('ghost:blog', params)

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('ghost:tag', { ...params, tag: parsed.tag }), blogFeed]
    }

    if (parsed.kind === 'author') {
      return [feeds.getFeedEntry('ghost:author', { ...params, author: parsed.author }), blogFeed]
    }

    return [blogFeed]
  },

  getFeedHint: feeds.getFeedHint,
}
