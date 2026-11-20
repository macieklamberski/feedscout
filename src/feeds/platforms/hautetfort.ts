import { hautetfort } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type HautetfortUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

// Business blogs sit under blog.blogspirit-business.com, which comes before its parent so their
// name reads as one label.
const domains = hautetfort.hosts.tenants

const feeds = withHintLabels(hautetfort.feeds)

export const parseHautetfortUrl = (url: string): HautetfortUrl | undefined => {
  const page = hautetfort.pages.read(url)
  const blog = getTenantSubdomain(url, domains)

  if (!page || !blog) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', blog, category: page.params.category }
  }

  return { kind: 'blog', blog }
}

export const hautetfortHandler: PlatformHandler = {
  match: (url) => {
    return parseHautetfortUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseHautetfortUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // Blog subdomains serve no certificate for their own name, so the feeds stay on http.
    const params = { scheme: 'http' }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { ...params, category: parsed.category }),
        page.getFeedEntry('posts', params, 'atom'),
        page.getFeedEntry('posts', params, 'rss'),
      ]
    }

    return [page.getFeedEntry('posts', params, 'atom'), page.getFeedEntry('posts', params, 'rss')]
  },

  getFeedHint: feeds.getFeedHint,
}
