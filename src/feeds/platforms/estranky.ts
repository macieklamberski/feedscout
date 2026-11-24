import { estranky } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: comments, photos.

export type EstrankyUrl = { kind: 'site' }

export type EstrankyPage = { origin: string; sliceOrigin: string }

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
  if (!parseUrl(url) || estranky.pages.read(url)?.key === 'platform') {
    return
  }

  return { kind: 'site' }
}

// A slice template on a custom domain links the home page slice on the Estranky subdomain.
// An eOldal slice template links its `eoldal.hu` subdomain, which no longer resolves, so its
// slices stay on the page's origin.
const getEstrankyPage = (url: string, content: string | undefined): EstrankyPage => {
  const { origin } = new URL(url)
  const anchor = findElement(content, (element) => {
    const href = element.attribs.href ?? ''

    return (
      element.name === 'a' &&
      element.attribs.rel === 'feedurl' &&
      estranky.pages.read(href)?.key === 'site'
    )
  })

  if (!anchor?.attribs.href) {
    return { origin, sliceOrigin: origin }
  }

  return { origin, sliceOrigin: new URL(anchor.attribs.href).origin }
}

export const estrankyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!estranky.pages.read(url) && !hasMarker(content, headers, { html: isEstrankyHtml })) {
      return false
    }

    return parseEstrankyUrl(url) !== undefined
  },

  // A site serves the article feeds, the Web Slice feeds or both, by its template, and answers
  // 404 on a set it lacks. Its `photos.xml` and `comments.xml` links serve the posts feed.
  resolve: (url, content) => {
    const { origin, sliceOrigin } = getEstrankyPage(url, content)
    const siteFeeds = feeds.forUrl(origin)
    const sliceFeeds = feeds.forUrl(sliceOrigin)

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
