import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: tag.

export type PosthavenUrl = { kind: 'tag'; tag: string } | { kind: 'blog' }

const domains = ['posthaven.com']

const tagRegex = /^\/tag\/([^/]+)/i

const feeds = definePlatformFeeds(
  'posthaven',
  [
    { key: 'posts', main: '{scheme}://{host}/posts.atom' },
    // Posthaven serves an undocumented per-tag Atom feed.
    { key: 'tag', main: '{scheme}://{host}/tag/{tag}.atom' },
  ],
  { hosts: { tenants: domains } },
)

export const parsePosthavenUrl = (url: string): PosthavenUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || !getTenantSubdomain(parsedUrl, domains)) {
    return
  }

  const tag = parsedUrl.pathname.match(tagRegex)?.[1]

  if (tag) {
    return { kind: 'tag', tag }
  }

  return { kind: 'blog' }
}

export const posthavenHandler: PlatformHandler = {
  match: (url) => {
    return parsePosthavenUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parsePosthavenUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'tag') {
      return [page.getFeedEntry('tag', { tag: parsed.tag }), page.getFeedEntry('posts')]
    }

    return [page.getFeedEntry('posts')]
  },

  getFeedHint: feeds.getFeedHint,
}
