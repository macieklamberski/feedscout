import { getAnyOf, getPathSegments } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMarker, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, post (html), partly covers author, tag.

export type HubspotUrl =
  | { kind: 'author'; blog: string; name: string }
  | { kind: 'tag'; blog: string; route: string; name: string }
  | { kind: 'blog'; blog: string }

const listingPathRegex = /^\/([^/]+)\/([^/]+)\/([^/]+)/

const listingRoutes = ['author', 'tag', 'topic']

const blogContentTypes = ['BLOG_LISTING_PAGE', 'BLOG_POST', 'BLOG_AUTHOR', 'TAG']

export const parseHubspotUrl = (url: string): HubspotUrl | undefined => {
  const [blog] = getPathSegments(url)

  if (!blog) {
    return
  }

  const [, , rawRoute, name] = new URL(url).pathname.match(listingPathRegex) ?? []
  const route = getAnyOf(rawRoute, listingRoutes)

  if (route === 'author') {
    return { kind: 'author', blog, name }
  }

  if (route) {
    return { kind: 'tag', blog, route, name }
  }

  return { kind: 'blog', blog }
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

    return parseHubspotUrl(url) !== undefined
  },

  resolve: (url) => {
    const { origin } = new URL(url)
    const parsed = parseHubspotUrl(url)

    if (!parsed) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []

    if (parsed.kind === 'author') {
      uris.push({
        uri: `${origin}/${parsed.blog}/author/${parsed.name}/rss.xml`,
        hint: composeHint('hubspot:author'),
      })
    }

    if (parsed.kind === 'tag') {
      uris.push({
        uri: `${origin}/${parsed.blog}/${parsed.route}/${parsed.name}/rss.xml`,
        hint: composeHint('hubspot:tag'),
      })
    }

    uris.push({ uri: `${origin}/${parsed.blog}/rss.xml`, hint: composeHint('hubspot:blog') })

    return uris
  },
}
