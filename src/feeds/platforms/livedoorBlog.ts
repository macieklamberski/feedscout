import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LivedoorBlogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = ['blog.jp', 'doorblog.jp', 'ldblog.jp', 'livedoor.biz']

const categoryRegex = /^\/archives\/cat_(\d+)\.html$/i

// Every blog redirects http to https, and its pages link only the https feeds.
const feeds = definePlatformFeeds(
  [
    {
      key: 'livedoor-blog:category',
      template: 'https://{blog}.{domain}/archives/cat_{category}.xml',
      format: 'rdf',
    },
    { key: 'livedoor-blog:posts', template: 'https://{blog}.{domain}/index.rdf', format: 'rdf' },
    { key: 'livedoor-blog:posts', template: 'https://{blog}.{domain}/atom.xml', format: 'atom' },
  ],
  { domains },
)

export const parseLivedoorBlogUrl = (url: string): LivedoorBlogUrl | undefined => {
  // A nested subdomain answers with a self-signed certificate and is no blog.
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

export const livedoorBlogHandler: PlatformHandler = {
  match: (url) => {
    return parseLivedoorBlogUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseLivedoorBlogUrl(url)

    if (!parsed) {
      return []
    }

    const domain = new URL(url).hostname.slice(parsed.blog.length + 1)
    const params = { blog: parsed.blog, domain }
    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'category') {
      uris.push(
        feeds.getFeedEntry(
          'livedoor-blog:category',
          { ...params, category: parsed.category },
          'rdf',
        ),
      )
    }

    uris.push(
      feeds.getFeedEntry('livedoor-blog:posts', params, 'rdf'),
      feeds.getFeedEntry('livedoor-blog:posts', params, 'atom'),
    )

    return uris
  },

  getFeedKey: feeds.getFeedKey,
}
