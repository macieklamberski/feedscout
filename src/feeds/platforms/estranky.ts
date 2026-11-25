import { estranky } from 'feedintel'
import { isAnyOf, parseUrl, startsWithAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic finds: posts.
// Handler needed for: comments, photos.

export type EstrankyUrl = { kind: 'site' }

const assetTags = ['link', 'script']

const feeds = withHintLabels(estranky.feeds)

// A source is absolute or protocol-relative. One with neither is a path, as in a saved copy.
const isAssetUrl = (source: string): boolean => {
  const assetUrl = startsWithAnyOf(source, '//') ? `https:${source}` : source

  return estranky.pages.readUrl(assetUrl)?.key === 'asset'
}

// Every template loads its stylesheet and `ui.js` from the asset hosts, on a custom domain too.
export const isEstrankyHtml = (content: string): boolean => {
  const asset = findElement(content, (element) => {
    const source = element.attribs.href ?? element.attribs.src ?? ''

    return assetTags.includes(element.name) && isAssetUrl(source)
  })

  return asset !== undefined
}

// The apex and www run Estranky itself. Every other host is one site.
export const parseEstrankyUrl = (url: string): EstrankyUrl | undefined => {
  const key = estranky.pages.readUrl(url)?.key

  if (!parseUrl(url) || isAnyOf(key, ['platform', 'asset'])) {
    return
  }

  return { kind: 'site' }
}

// A slice template on a custom domain links the home page slice on the Estranky subdomain.
// An eOldal slice template links its `eoldal.hu` subdomain, which no longer resolves, so its
// slices stay on the page's host.
const getSliceUrl = (url: string, content: string | undefined): string => {
  const anchor = findElement(content, (element) => {
    const href = element.attribs.href ?? ''

    return (
      element.name === 'a' &&
      element.attribs.rel === 'feedurl' &&
      estranky.pages.readUrl(href)?.key === 'site'
    )
  })

  return anchor?.attribs.href ?? url
}

export const estrankyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!estranky.pages.readUrl(url) && !hasMarker(content, headers, { html: isEstrankyHtml })) {
      return false
    }

    return parseEstrankyUrl(url) !== undefined
  },

  // A site serves the article feeds, the Web Slice feeds or both, by its template, and answers
  // 404 on a set it lacks. Its `photos.xml` and `comments.xml` links serve the posts feed.
  resolve: (url, content) => {
    const siteFeeds = feeds.forSite(url)
    const sliceFeeds = feeds.forSite(getSliceUrl(url, content))

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
