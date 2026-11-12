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

const feeds = definePlatformFeeds(
  [
    { key: 'ghost:tag', template: '{scheme}://{host}/tag/{tag}/rss/' },
    { key: 'ghost:author', template: '{scheme}://{host}/author/{author}/rss/' },
    { key: 'ghost:blog', template: '{scheme}://{host}/rss/' },
  ],
  { domains },
)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('ghost:tag', { tag: parsed.tag }), page.getFeedEntry('ghost:blog')]
    }

    if (parsed.kind === 'author') {
      return [
        page.getFeedEntry('ghost:author', { author: parsed.author }),
        page.getFeedEntry('ghost:blog'),
      ]
    }

    return [page.getFeedEntry('ghost:blog')]
  },

  getFeedHint: feeds.getFeedHint,
}
