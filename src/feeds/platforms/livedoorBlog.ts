import { livedoorBlog } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LivedoorBlogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = livedoorBlog.hosts.tenants

const feeds = withHintLabels(livedoorBlog.feeds)

export const parseLivedoorBlogUrl = (url: string): LivedoorBlogUrl | undefined => {
  const page = livedoorBlog.pages.read(url)
  // A nested subdomain answers with a self-signed certificate and is no blog.
  const blog = getTenantSubdomain(url, domains)

  if (!page || !blog) {
    return
  }

  if (page.key === 'category') {
    return { kind: 'category', blog, category: page.params.category }
  }

  return { kind: 'blog', blog }
}

export const livedoorBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseLivedoorBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLivedoorBlogUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('category', { category: parsed.category }, 'rdf'),
        page.getFeedEntry('posts', {}, 'rdf'),
        page.getFeedEntry('posts', {}, 'atom'),
      ]
    }

    return [page.getFeedEntry('posts', {}, 'rdf'), page.getFeedEntry('posts', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
