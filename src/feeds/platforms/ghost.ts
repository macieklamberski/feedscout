import { getRegistrableDomain } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type GhostUrl =
  | { kind: 'tag'; tag: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const domains = ['ghost.io']

const tagRegex = /^\/tag\/([^/]+)/i
const authorRegex = /^\/author\/([^/]+)/i

const feeds = definePlatformFeeds(
  [
    { key: 'ghost:tag', template: 'https://{blog}.{domain}/tag/{tag}/rss/' },
    { key: 'ghost:author', template: 'https://{blog}.{domain}/author/{author}/rss/' },
    { key: 'ghost:blog', template: 'https://{blog}.{domain}/rss/' },
  ],
  { domains },
)

export const parseGhostUrl = (url: string): GhostUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const tag = pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  const author = pathname.match(authorRegex)?.[1]

  if (author) {
    return { kind: 'author', author }
  }

  return { kind: 'blog' }
}

export const ghostHandler: PlatformHandler = {
  match: (url) => {
    return parseGhostUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseGhostUrl(url)
    const blog = getTenantSubdomain(url, domains)
    const domain = getRegistrableDomain(url)

    if (!parsed || !blog || !domain) {
      return []
    }

    const params = { blog, domain }
    const blogFeed = feeds.getFeedEntry('ghost:blog', params)

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('ghost:tag', { ...params, tag: parsed.tag }), blogFeed]
    }

    if (parsed.kind === 'author') {
      return [feeds.getFeedEntry('ghost:author', { ...params, author: parsed.author }), blogFeed]
    }

    return [blogFeed]
  },

  getFeedKey: feeds.getFeedKey,
}
