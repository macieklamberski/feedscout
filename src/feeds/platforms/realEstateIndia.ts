import { realEstateIndia } from 'feedintel'
import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type RealEstateIndiaPage = { root: string }

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//i

const feeds = withHintLabels(realEstateIndia.feeds)

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

  const { hostname } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href, url)

    if (target && isHostOf(target, hostname) && isAnyOf(target.pathname, '/property.rss')) {
      return { root: target.origin }
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

    return [feeds.getFeedEntry('properties', { root: page.root })]
  },
}
