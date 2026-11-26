import { estranky } from 'feedintel'
import { getOrigin, getSubdomain, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: comments, photos.

export type EstrankyUrl = { kind: 'site' }

export type EstrankyPage = { origin: string; sliceOrigin: string }

const domains = estranky.hosts.tenants

const estrankyAssetRegex = /^(?:https?:)?\/\/s3[a-z]\.(?:estranky\.(?:cz|sk)|eoldal\.hu)\//i

const assetTags = ['link', 'script']

const feeds = withHintLabels(estranky.feeds)

// Every template loads its stylesheet and `ui.js` from the asset hosts, on a custom domain too.
export const isEstrankyHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    const source = element.attribs.href ?? element.attribs.src ?? ''

    return assetTags.includes(element.name) && estrankyAssetRegex.test(source)
  })

  return asset !== undefined
}

// The apex and www run Estranky itself. Every other host is one site.
export const parseEstrankyUrl = (url: string): EstrankyUrl | undefined => {
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || isHostOf(parsedUrl, domains)) {
    return
  }

  if (isAnyOf(getSubdomain(parsedUrl, domains), 'www')) {
    return
  }

  return { kind: 'site' }
}

// A slice template on a custom domain links the home page slice on the Estranky subdomain.
// An eOldal slice template links its `eoldal.hu` subdomain, which no longer resolves, so its
// slices stay on the page's origin.
const getEstrankyPage = (url: string, content: string | undefined): EstrankyPage | undefined => {
  const origin = getOrigin(url)

  if (!origin) {
    return
  }

  const anchor = findElement(content, (element) => {
    const href = element.attribs.href ?? ''

    return element.name === 'a' && element.attribs.rel === 'feedurl' && isSubdomainOf(href, domains)
  })

  return { origin, sliceOrigin: getOrigin(anchor?.attribs.href) ?? origin }
}

export const estrankyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!isSubdomainOf(url, domains) && !hasMarker(content, headers, { html: isEstrankyHtml })) {
      return false
    }

    return parseEstrankyUrl(url) !== undefined
  },

  // A site serves the article feeds, the Web Slice feeds or both, by its template, and answers
  // 404 on a set it lacks. Its `photos.xml` and `comments.xml` links serve the posts feed.
  resolve: (url, content) => {
    const page = getEstrankyPage(url, content)

    if (!page) {
      return []
    }

    const siteFeeds = feeds.forUrl(page.origin)
    const sliceFeeds = feeds.forUrl(page.sliceOrigin)

    if (!siteFeeds || !sliceFeeds) {
      return []
    }

    return [
      siteFeeds.getFeedEntry('posts'),
      siteFeeds.getFeedEntry('photos'),
      siteFeeds.getFeedEntry('comments'),
      sliceFeeds.getFeedEntry('homepage-slice'),
      sliceFeeds.getFeedEntry('photos-slice'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
