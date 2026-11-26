import { cocolog } from 'feedintel'
import { isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type CocologPage = { blog: string }

const domains = cocolog.hosts.tenants

// A first segment with a dot is an uploaded file or the `.shared` assets, never a blog.
const blogRegex = /^\/([^/.]+)(?:\/|$)/
const feedPathRegex = /^\/([^/.]+)\/(?:atom\.xml|index\.rdf|rss\.xml)$/i

const feeds = withHintLabels(cocolog.feeds)

const getCocologPage = (url: string, content: string | undefined): CocologPage | undefined => {
  // A nested label such as app.f.cocolog-nifty.com is a service host, never a blog.
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  const parsedUrl = parseUrl(url)

  if (!parsedUrl) {
    return
  }

  const { hostname, pathname } = parsedUrl
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
      pageFeeds.getFeedEntry('posts', params, 'atom'),
      pageFeeds.getFeedEntry('posts', params, 'rdf'),
      pageFeeds.getFeedEntry('posts', params, 'rss'),
      pageFeeds.getFeedEntry('comments', params, 'rdf'),
      pageFeeds.getFeedEntry('comments', params, 'rss'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
