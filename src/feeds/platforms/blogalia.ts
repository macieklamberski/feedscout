import { getSubdomain } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog.

export type BlogaliaUrl = { kind: 'blog' }

const domains = ['blogalia.com']

// `{host}` also takes the apex and nested subdomains, which `parseBlogaliaUrl` refuses, so
// `getFeedHint` reads a URL only once the parser accepts its host.
const feeds = definePlatformFeeds(
  [
    { key: 'blogalia:posts', template: '{scheme}://{host}/rdf.xml', format: 'rdf' },
    { key: 'blogalia:posts', template: '{scheme}://{host}/rss20.xml', format: 'rss' },
  ],
  { domains },
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

    if (!parsed) {
      return []
    }

    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }

    return [
      feeds.getFeedEntry('blogalia:posts', params, 'rdf'),
      feeds.getFeedEntry('blogalia:posts', params, 'rss'),
    ]
  },

  getFeedHint: (url) => {
    if (!parseBlogaliaUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
