import { getAnyOf } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, hasMetaContent } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic covers blog, post (html), partly covers author, tag.

const listingPathRegex = /^\/([^/]+)\/([^/]+)\/([^/]+)/

const listingKinds = ['author', 'tag', 'topic']

const blogContentTypes = ['BLOG_LISTING_PAGE', 'BLOG_POST', 'BLOG_AUTHOR', 'TAG']

const getBlogPath = (url: string): string | undefined => {
  const [first] = new URL(url).pathname.split('/').filter(Boolean)

  return first
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
    try {
      const isHubspot =
        (content && isHubspotHtml(content)) || (headers && isHubspotHeaders(headers))

      if (!isHubspot || (headers && isNonBlogPage(headers))) {
        return false
      }

      return Boolean(getBlogPath(url))
    } catch {}

    return false
  },

  resolve: (url) => {
    const { origin, pathname } = new URL(url)
    const blogPath = getBlogPath(url)

    if (!blogPath) {
      return []
    }

    const uris: Array<DiscoverUriEntry> = []
    const [, listingBlog, rawKind, listingName] = pathname.match(listingPathRegex) ?? []
    const kind = getAnyOf(rawKind, listingKinds)

    if (kind) {
      uris.push({
        uri: `${origin}/${listingBlog}/${kind}/${listingName}/rss.xml`,
        hint: composeHint(kind === 'author' ? 'hubspot:author' : 'hubspot:tag'),
      })
    }

    uris.push({ uri: `${origin}/${blogPath}/rss.xml`, hint: composeHint('hubspot:blog') })

    return uris
  },
}
