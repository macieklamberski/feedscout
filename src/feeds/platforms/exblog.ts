import { exblog } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ExblogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = exblog.hosts.tenants

const categoryRegex = /^\/i(\d+)(?:\/|$)/i

const feeds = withHintLabels(exblog.feeds)

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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // Category page: /i{N}.
    if (parsed.kind === 'category') {
      const params = { category: parsed.category }

      return [
        page.getFeedEntry('category', params, 'rss'),
        page.getFeedEntry('category', params, 'atom'),
        page.getFeedEntry('posts', {}, 'rss'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'rss'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: (url) => {
    const hint = feeds.getFeedHint(url)

    // The table reads any segment after `i`, while a category id is digits only.
    if (hint?.key === 'exblog:category' && parseExblogUrl(url)?.kind !== 'category') {
      return
    }

    return hint
  },
}
