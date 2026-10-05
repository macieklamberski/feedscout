import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//
const propertyFeedPathRegex = /^\/property\.rss$/

export type RealEstateIndiaPage = { feedUrl: string }

// Every Weblink.In catalog site loads its template stylesheet from the shared asset host.
export const isRealEstateIndiaHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'stylesheet' &&
      templateStylesheetRegex.test(element.attribs.href ?? '')
    )
  })

  return stylesheet !== undefined
}

// Weblink.In builds its catalog, travel, jobs and services sites on the same template, and
// there `/property.rss` answers a blank HTML page, so only a page linking the feed has one.
const getRealEstateIndiaPage = (
  url: string,
  content: string | undefined,
): RealEstateIndiaPage | undefined => {
  if (!content) {
    return
  }

  const { host } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href ?? '', url)

    if (target?.host === host && propertyFeedPathRegex.test(target.pathname)) {
      return { feedUrl: target.href }
    }
  }
}

export const realEstateIndiaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isRealEstateIndiaHtml })) {
      return false
    }

    return getRealEstateIndiaPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getRealEstateIndiaPage(url, content)

    if (!page) {
      return []
    }

    return [{ uri: page.feedUrl, hint: composeHint('real-estate-india:properties') }]
  },
}
