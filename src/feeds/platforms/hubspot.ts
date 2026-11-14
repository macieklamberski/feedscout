import { getAnyOf, getPathSegments, isString, parseUrl, resolveUrl, stripWww } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, post (html), partly covers author, tag.

export type HubspotUrl =
  | { kind: 'author'; blog: string; name: string }
  | { kind: 'tag'; blog: string; route: string; name: string }
  | { kind: 'blog'; blog: string }

const listingPathRegex = /^\/(?<route>[^/]+)\/(?<name>[^/]+)/
const feedPathRegex = /\/rss\.xml$/i

const listingRoutes = ['author', 'tag', 'topic']

const blogContentTypes = ['BLOG', 'BLOG_LISTING_PAGE', 'BLOG_POST', 'BLOG_AUTHOR', 'TAG']

// HubSpot's site hosts: hs-sites.com, a region suffix such as hs-sites-eu1.com, and hs-sitesqa.com.
const hubspotDomainRegex = /^hs-sites(?:-[a-z]{2}\d|qa)?\.com$/
const domains = [hubspotDomainRegex]

// A blog on a custom domain is known only by its marker, so its feeds are built under the blog root
// the page links, and claimed only for a blog at the root of HubSpot's own hosts. A podcast's feed
// is only claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'hubspot:author', template: '{root}/author/{name}/rss.xml' },
    { key: 'hubspot:tag', template: '{root}/tag/{name}/rss.xml' },
    { key: 'hubspot:tag', template: '{root}/topic/{topic}/rss.xml' },
    { key: 'hubspot:blog', template: '{root}/rss.xml' },
    { key: 'hubspot:podcast', template: '{root}/podcasts/{id}/rss.xml' },
  ],
  { domains },
)

// Every blog page links its blog's feed, `{blog}/rss.xml`, which names the blog's root. A blog can
// sit at the host root or several segments deep.
const getBlogPath = (url: string, content: string | undefined): string | undefined => {
  const link = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'alternate' &&
      feedPathRegex.test(element.attribs.href ?? '')
    )
  })
  const feedUrl = parseUrl(resolveUrl(link?.attribs.href ?? '', url))
  const pageUrl = parseUrl(url)

  if (!feedUrl || !pageUrl || stripWww(feedUrl.hostname) !== stripWww(pageUrl.hostname)) {
    return
  }

  return feedUrl.pathname.replace(feedPathRegex, '')
}

// HubSpot names the page type in `x-hs-cfworker-meta`, and only blog pages have a feed.
const getContentType = (headers: Headers | undefined): string | undefined => {
  try {
    const { contentType } = JSON.parse(headers?.get('x-hs-cfworker-meta') ?? '{}')

    if (!isString(contentType)) {
      return
    }

    return contentType
  } catch {}
}

export const getHubspotPage = (
  url: string,
  content: string | undefined,
  headers?: Headers,
): HubspotUrl | undefined => {
  const [firstSegment] = getPathSegments(url)
  let blogPath = getBlogPath(url, content)
  const isBlogPage = blogContentTypes.includes(getContentType(headers) ?? '')

  // Without the page, the first path segment is the best reading of the blog's root. A page with
  // no feed link is a site page, unless its page type names a blog.
  if (blogPath === undefined && firstSegment && (!content || isBlogPage)) {
    blogPath = `/${firstSegment}`
  }

  if (blogPath === undefined) {
    return
  }

  const { pathname } = new URL(url)
  const blog = blogPath.slice(1)
  const listingPath = pathname.startsWith(`${blogPath}/`) ? pathname.slice(blogPath.length) : ''
  const listingMatch = listingPath.match(listingPathRegex)
  const route = getAnyOf(listingMatch?.groups?.route, listingRoutes)
  const name = listingMatch?.groups?.name

  if (route === 'author' && name) {
    return { kind: 'author', blog, name }
  }

  if (route && name) {
    return { kind: 'tag', blog, route, name }
  }

  return { kind: 'blog', blog }
}

export const parseHubspotUrl = (url: string): HubspotUrl | undefined => {
  return getHubspotPage(url, undefined)
}

export const isHubspotHtml = (content: string): boolean => {
  return hasMetaContent(content, 'generator', 'HubSpot')
}

export const isHubspotHeaders = (headers: Headers): boolean => {
  return headers.has('x-hs-hub-id')
}

const isNonBlogPage = (headers: Headers): boolean => {
  const contentType = getContentType(headers)

  if (!contentType) {
    return false
  }

  return !blogContentTypes.includes(contentType)
}

export const hubspotHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isHubspotHtml, headers: isHubspotHeaders })) {
      return false
    }

    if (headers && isNonBlogPage(headers)) {
      return false
    }

    return getHubspotPage(url, content, headers) !== undefined
  },

  resolve: (url, content, headers) => {
    const { origin } = new URL(url)
    const parsed = getHubspotPage(url, content, headers)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    const root = parsed.blog ? `${origin}/${parsed.blog}` : origin

    if (parsed.kind === 'author') {
      return [
        page.getFeedEntry('hubspot:author', { root, name: parsed.name }),
        page.getFeedEntry('hubspot:blog', { root }),
      ]
    }

    // A topic listing takes its own row, so the name goes under the topic placeholder.
    if (parsed.kind === 'tag' && parsed.route === 'topic') {
      return [
        page.getFeedEntry('hubspot:tag', { root, topic: parsed.name }),
        page.getFeedEntry('hubspot:blog', { root }),
      ]
    }

    if (parsed.kind === 'tag') {
      return [
        page.getFeedEntry('hubspot:tag', { root, name: parsed.name }),
        page.getFeedEntry('hubspot:blog', { root }),
      ]
    }

    return [page.getFeedEntry('hubspot:blog', { root })]
  },

  getFeedHint: feeds.getFeedHint,
}
