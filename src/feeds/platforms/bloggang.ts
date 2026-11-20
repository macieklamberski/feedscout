import { bloggang } from 'feedintel'
import { isHostOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type BloggangUrl =
  | { kind: 'blog'; username: string }
  | { kind: 'post'; username: string }
  | { kind: 'diary'; username: string }

const domains = bloggang.hosts.tenants
// The mobile site names a blog in the query, in a form no feed URL is built from.
const mobileHosts = ['m.bloggang.com']

const feeds = withHintLabels(bloggang.feeds)

export const parseBloggangUrl = (url: string): BloggangUrl | undefined => {
  const subdomain = getTenantSubdomain(url, domains)

  // {user}.bloggang.com answers every path with a redirect to the blog on www.
  if (subdomain && !isHostOf(url, mobileHosts)) {
    return { kind: 'blog', username: subdomain }
  }

  const page = bloggang.pages.read(url)

  if (!page) {
    return
  }

  if (page.key === 'post') {
    return { kind: 'post', username: page.params.username }
  }

  if (page.key === 'diary') {
    return { kind: 'diary', username: page.params.username }
  }

  return { kind: 'blog', username: page.params.username }
}

export const bloggangHandler: PlatformHandler = {
  match: (url) => {
    return parseBloggangUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBloggangUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    // A page on www names the blog in its query, so the feed host is built from the username.
    return [page.getFeedEntry('posts', { host: `${parsed.username}.bloggang.com` })]
  },

  getFeedHint: feeds.getFeedHint,
}
