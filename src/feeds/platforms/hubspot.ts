import { getAnyOf, getPathSegments, parseUrl, resolveUrl, stripWww } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, post (guess, html), partly covers author, tag.

export type HubspotUrl =
  | { kind: 'author'; blog: string; name: string }
  | { kind: 'tag'; blog: string; route: string; name: string }
  | { kind: 'blog'; blog: string }

const listingPathRegex = /^\/(?<route>[^/]+)\/(?<name>[^/]+)/
const feedPathRegex = /\/rss\.xml$/i

const listingRoutes = ['author', 'tag', 'topic']

const blogContentTypes = ['BLOG', 'BLOG_LISTING_PAGE', 'BLOG_POST', 'BLOG_AUTHOR', 'TAG']

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
  const feedUrl = parseUrl(resolveUrl(link?.attribs.href ?? '', url) ?? '')
  const pageUrl = parseUrl(url)

  if (!feedUrl || !pageUrl || stripWww(feedUrl.hostname) !== stripWww(pageUrl.hostname)) {
    return
  }

  return feedUrl.pathname.replace(feedPathRegex, '')
}

export const getHubspotPage = (
  url: string,
  content: string | undefined,
): HubspotUrl | undefined => {
  const [firstSegment] = getPathSegments(url)
  let blogPath = getBlogPath(url, content)

  // Without the page, the first path segment is the best reading of the blog's root.
  if (blogPath === undefined && firstSegment) {
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

// HubSpot names the page type in `x-hs-cfworker-meta`, and only blog pages have a feed.
const isNonBlogPage = (headers: Headers): boolean => {
  try {
    const { contentType } = JSON.parse(headers.get('x-hs-cfworker-meta') ?? '{}')

    return Boolean(contentType) && !blogContentTypes.includes(contentType)
  } catch {}

  return false
}

export const hubspotHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isHubspotHtml, headers: isHubspotHeaders })) {
      return false
    }

    if (headers && isNonBlogPage(headers)) {
      return false
    }

    return getHubspotPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const { origin } = new URL(url)
    const parsed = getHubspotPage(url, content)

    if (!parsed) {
      return []
    }

    const blogUrl = parsed.blog ? `${origin}/${parsed.blog}` : origin

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'author') {
      uris.push({
        uri: `${blogUrl}/author/${parsed.name}/rss.xml`,
        hint: composeHint('hubspot:author'),
      })
    }

    if (parsed.kind === 'tag') {
      uris.push({
        uri: `${blogUrl}/${parsed.route}/${parsed.name}/rss.xml`,
        hint: composeHint('hubspot:tag'),
      })
    }

    uris.push({ uri: `${blogUrl}/rss.xml`, hint: composeHint('hubspot:blog') })

    return uris
  },
}
