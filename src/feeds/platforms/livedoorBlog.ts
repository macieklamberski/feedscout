import { parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type LivedoorBlogUrl =
  | { kind: 'blog'; blog: string }
  | { kind: 'category'; blog: string; category: string }

const domains = ['blog.jp', 'doorblog.jp', 'ldblog.jp', 'livedoor.biz']

const categoryRegex = /^\/archives\/cat_(\d+)\.html$/i

const feeds = definePlatformFeeds(
  [
    {
      key: 'livedoor-blog:category',
      template: '{scheme}://{host}/archives/cat_{category}.xml',
      format: 'rdf',
    },
    { key: 'livedoor-blog:posts', template: '{scheme}://{host}/index.rdf', format: 'rdf' },
    { key: 'livedoor-blog:posts', template: '{scheme}://{host}/atom.xml', format: 'atom' },
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.kind === 'category') {
      return [
        page.getFeedEntry('livedoor-blog:category', { category: parsed.category }, 'rdf'),
        page.getFeedEntry('livedoor-blog:posts', {}, 'rdf'),
        page.getFeedEntry('livedoor-blog:posts', {}, 'atom'),
      ]
    }

    return [
      page.getFeedEntry('livedoor-blog:posts', {}, 'rdf'),
      page.getFeedEntry('livedoor-blog:posts', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
