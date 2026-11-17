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
  'hatenablog',
  [
    { key: 'posts', main: '{scheme}://{host}/rss', format: 'rss' },
    { key: 'posts', main: '{scheme}://{host}/feed', format: 'atom' },
    {
      key: 'category',
      main: '{scheme}://{host}/rss/category/{category}',
      format: 'rss',
    },
    {
      key: 'category',
      main: '{scheme}://{host}/feed/category/{category}',
      format: 'atom',
    },
    { key: 'author', main: '{scheme}://{host}/rss/author/{author}', format: 'rss' },
    { key: 'author', main: '{scheme}://{host}/feed/author/{author}', format: 'atom' },
  ],
  { hosts: { tenants: domains } },
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      const params = { category: parsed.category }

      return [
        page.getFeedEntry('category', params, 'rss'),
        page.getFeedEntry('category', params, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    if (parsed.kind === 'author') {
      const params = { author: parsed.author }

      return [
        page.getFeedEntry('author', params, 'rss'),
        page.getFeedEntry('author', params, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'rss'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
