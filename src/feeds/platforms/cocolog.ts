import { isHostOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CocologPage = { blog: string }

const domains = [
  'air-nifty.com',
  'cocolog-nifty.com',
  'cocolog-tnc.com',
  'cocolog-wbs.com',
  'moe-nifty.com',
  'tea-nifty.com',
  'txt-nifty.com',
  'way-nifty.com',
]

// A first segment with a dot is an uploaded file or the `.shared` assets, never a blog.
const blogRegex = /^\/([^/.]+)(?:\/|$)/
const feedPathRegex = /^\/([^/.]+)\/(?:atom\.xml|index\.rdf|rss\.xml)$/i

const feeds = definePlatformFeeds(
  [
    {
      key: 'cocolog:posts',
      template: '{scheme}://{host}/{blog}/atom.xml',
      format: 'atom',
    },
    {
      key: 'cocolog:posts',
      template: '{scheme}://{host}/{blog}/index.rdf',
      format: 'rdf',
    },
    {
      key: 'cocolog:posts',
      template: '{scheme}://{host}/{blog}/rss.xml',
      format: 'rss',
    },
  ],
  { domains },
)

const getCocologPage = (url: string, content: string | undefined): CocologPage | undefined => {
  // A nested label such as app.f.cocolog-nifty.com is a service host, never a blog.
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const { hostname, pathname } = new URL(url)
  const blog = pathname.match(blogRegex)?.[1]

  if (blog) {
    return { blog }
  }

  // One account hosts several blogs, each under its own path, and the home page names only one
  // of them, in its feed links.
  const link = findElement(content, (element) => {
    if (element.name !== 'link' || element.attribs.rel !== 'alternate') {
      return false
    }

    const feedUrl = parseUrl(element.attribs.href, url)

    if (!feedUrl) {
      return false
    }

    return isHostOf(feedUrl, hostname) && feedPathRegex.test(feedUrl.pathname)
  })
  const linkedBlog = parseUrl(link?.attribs.href, url)?.pathname.match(feedPathRegex)?.[1]

  if (!linkedBlog) {
    return
  }

  return { blog: linkedBlog }
}

export const cocologHandler: PlatformHandler = {
  match: (url, content) => {
    return getCocologPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getCocologPage(url, content)
    const pageFeeds = feeds.forUrl(url)

    if (!page || !pageFeeds) {
      return []
    }

    const params = { blog: page.blog }

    return [
      pageFeeds.getFeedEntry('cocolog:posts', params, 'atom'),
      pageFeeds.getFeedEntry('cocolog:posts', params, 'rdf'),
      pageFeeds.getFeedEntry('cocolog:posts', params, 'rss'),
    ]
  },

  // A first segment with a dot is an uploaded file or the `.shared` assets, which the table's
  // `{blog}` placeholder would match.
  getFeedHint: (url) => {
    if (!getCocologPage(url, undefined)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
