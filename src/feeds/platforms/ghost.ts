import { parseUrl } from 'trousse'
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
// A private site serves its feed under a 30-character hex token in place of a collection name.
const privateFeedRegex = /^\/[\da-f]{30}\/rss\/?$/i

const feeds = definePlatformFeeds(
  'ghost',
  [
    { key: 'tag', main: '{scheme}://{host}/tag/{tag}/rss/' },
    { key: 'author', main: '{scheme}://{host}/author/{author}/rss/' },
    { key: 'blog', main: '{scheme}://{host}/rss/' },
    // A collection a site's routes define, as `/archive/`, which a page path cannot tell apart from
    // a post, so `resolve` never builds it.
    { key: 'collection', main: '{scheme}://{host}/{collection}/rss/' },
  ],
  { hosts: { tenants: domains } },
)
// No page gives the token, so this row only claims the feed.
const privateFeeds = definePlatformFeeds(
  'ghost',
  [{ key: 'private', main: '{scheme}://{host}/{token}/rss/' }],
  { hosts: { tenants: domains } },
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag }), page.getFeedEntry('blog')]
    }

    if (parsed.kind === 'author') {
      return [page.getFeedEntry('author', { author: parsed.author }), page.getFeedEntry('blog')]
    }

    return [page.getFeedEntry('blog')]
  },

  getFeedHint: (url) => {
    const pathname = parseUrl(url)?.pathname ?? ''

    return privateFeedRegex.test(pathname) ? privateFeeds.getFeedHint(url) : feeds.getFeedHint(url)
  },
}
