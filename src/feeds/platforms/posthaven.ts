import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog (html), partly covers tag.

export type PosthavenUrl = { kind: 'tag'; tag: string } | { kind: 'blog' }

const domains = ['posthaven.com']

const tagRegex = /^\/tag\/([^/]+)/i

const feeds = definePlatformFeeds([
  { key: 'posthaven:posts', template: 'https://{blog}.posthaven.com/posts.atom' },
  // Posthaven serves an undocumented per-tag Atom feed.
  { key: 'posthaven:tag', template: 'https://{blog}.posthaven.com/tag/{tag}.atom' },
])

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
    const blog = getTenantSubdomain(url, domains)

    if (!parsed || !blog) {
      return []
    }

    const posts = feeds.getFeedEntry('posthaven:posts', { blog })

    if (parsed.kind === 'tag') {
      return [feeds.getFeedEntry('posthaven:tag', { blog, tag: parsed.tag }), posts]
    }

    return [posts]
  },

  getFeedHint: feeds.getFeedHint,
}
