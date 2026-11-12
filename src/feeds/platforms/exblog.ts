import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ExblogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = ['exblog.jp']

const categoryRegex = /^\/i(\d+)(?:\/|$)/i

const feeds = definePlatformFeeds([
  {
    key: 'exblog:category',
    template: 'https://{blog}.exblog.jp/i{category}/index.xml',
    format: 'rss',
  },
  {
    key: 'exblog:category',
    template: 'https://{blog}.exblog.jp/i{category}/atom.xml',
    format: 'atom',
  },
  { key: 'exblog:posts', template: 'https://{blog}.exblog.jp/index.xml', format: 'rss' },
  { key: 'exblog:posts', template: 'https://{blog}.exblog.jp/atom.xml', format: 'atom' },
])

export const parseExblogUrl = (url: string): ExblogUrl | undefined => {
  const blog = getTenantSubdomain(url, domains)

  if (!blog) {
    return
  }

  const category = parseUrl(url)?.pathname.match(categoryRegex)?.[1]

  if (category) {
    return { kind: 'category', blog, category }
  }

  return { kind: 'blog', blog }
}

export const exblogHandler: PlatformHandler = {
  match: (url) => {
    return parseExblogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseExblogUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    // Category page: /i{N}.
    if (parsed.kind === 'category') {
      const params = { blog: parsed.blog, category: parsed.category }

      uris.push(
        feeds.getFeedEntry('exblog:category', params, 'rss'),
        feeds.getFeedEntry('exblog:category', params, 'atom'),
      )
    }

    uris.push(
      feeds.getFeedEntry('exblog:posts', { blog: parsed.blog }, 'rss'),
      feeds.getFeedEntry('exblog:posts', { blog: parsed.blog }, 'atom'),
    )

    return uris
  },

  getFeedKey: (url) => {
    const key = feeds.getFeedKey(url)

    // The table reads any segment after `i`, while a category id is digits only.
    if (key === 'exblog:category' && parseExblogUrl(url)?.kind !== 'category') {
      return
    }

    return key
  },
}
