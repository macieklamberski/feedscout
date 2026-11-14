import { getSubdomain } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type BlogaliaUrl = { kind: 'blog' }

const domains = ['blogalia.com']

// `{host}` also takes the apex and nested subdomains, which `parseBlogaliaUrl` refuses, so
// `getFeedHint` reads a URL only once the parser accepts its host. `www` is a tenant, as
// `www.blogalia.com` is Blogalia's own news blog.
const feeds = definePlatformFeeds(
  [
    { key: 'blogalia:posts', template: '{scheme}://{host}/rdf.xml', format: 'rdf' },
    { key: 'blogalia:posts', template: '{scheme}://{host}/rss20.xml', format: 'rss' },
  ],
  { domains, isWwwTenant: true },
)

export const parseBlogaliaUrl = (url: string): BlogaliaUrl | undefined => {
  const blog = getSubdomain(url, domains)

  // `www.blogalia.com` is Blogalia's own news blog and serves `rdf.xml`, which its page never
  // links, so `getTenantSubdomain` would drop that feed by refusing `www`.
  if (!blog || blog.includes('.')) {
    return
  }

  return { kind: 'blog' }
}

export const blogaliaHandler: PlatformHandler = {
  match: (url) => {
    return parseBlogaliaUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseBlogaliaUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [
      page.getFeedEntry('blogalia:posts', {}, 'rdf'),
      page.getFeedEntry('blogalia:posts', {}, 'rss'),
    ]
  },

  getFeedHint: (url) => {
    if (!parseBlogaliaUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
