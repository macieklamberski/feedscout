import { getRegistrableDomain } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HatenablogUrl =
  | { kind: 'category'; category: string }
  | { kind: 'author'; author: string }
  | { kind: 'blog' }

const domains = [
  'hatenablog.com',
  'hatenablog.jp',
  'hateblo.jp',
  'hatenadiary.com',
  'hatenadiary.jp',
  'hatenadiary.org',
]

const categoryRegex = /^\/archive\/category\/([^/]+)/i
const authorRegex = /^\/archive\/author\/([^/]+)/i

const feeds = definePlatformFeeds(
  [
    { key: 'hatenablog:posts', template: 'https://{blog}.{domain}/rss', format: 'rss' },
    { key: 'hatenablog:posts', template: 'https://{blog}.{domain}/feed', format: 'atom' },
    {
      key: 'hatenablog:category',
      template: 'https://{blog}.{domain}/rss/category/{category}',
      format: 'rss',
    },
    {
      key: 'hatenablog:category',
      template: 'https://{blog}.{domain}/feed/category/{category}',
      format: 'atom',
    },
    {
      key: 'hatenablog:author',
      template: 'https://{blog}.{domain}/rss/author/{author}',
      format: 'rss',
    },
    {
      key: 'hatenablog:author',
      template: 'https://{blog}.{domain}/feed/author/{author}',
      format: 'atom',
    },
  ],
  { domains },
)

export const parseHatenablogUrl = (url: string): HatenablogUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const { pathname } = new URL(url)
  const category = pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', category }
  }

  const author = pathname.match(authorRegex)?.[1]

  if (author) {
    return { kind: 'author', author }
  }

  return { kind: 'blog' }
}

export const hatenablogHandler: PlatformHandler = {
  match: (url) => {
    return parseHatenablogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHatenablogUrl(url)
    const blog = getTenantSubdomain(url, domains)
    const domain = getRegistrableDomain(url)

    if (!parsed || !blog || !domain) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      const params = { blog, domain, category: parsed.category }

      uris.push(
        feeds.getFeedEntry('hatenablog:category', params, 'rss'),
        feeds.getFeedEntry('hatenablog:category', params, 'atom'),
      )
    }

    if (parsed.kind === 'author') {
      const params = { blog, domain, author: parsed.author }

      uris.push(
        feeds.getFeedEntry('hatenablog:author', params, 'rss'),
        feeds.getFeedEntry('hatenablog:author', params, 'atom'),
      )
    }

    uris.push(
      feeds.getFeedEntry('hatenablog:posts', { blog, domain }, 'rss'),
      feeds.getFeedEntry('hatenablog:posts', { blog, domain }, 'atom'),
    )

    return uris
  },

  getFeedHint: feeds.getFeedHint,
}
