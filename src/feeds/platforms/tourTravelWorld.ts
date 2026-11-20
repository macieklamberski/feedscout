import { tourTravelWorld } from 'feedintel'
import { isAnyOf, isHostOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type TourTravelWorldPage = { root: string }

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//i

const feeds = withHintLabels(tourTravelWorld.feeds)

// Every Weblink.In catalog site loads its template stylesheet from the shared asset host.
export const isTourTravelWorldHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'stylesheet' &&
      templateStylesheetRegex.test(element.attribs.href ?? '')
    )
  })

  return stylesheet !== undefined
}

// Weblink.In builds its exporter, real estate, jobs and services sites on the same template, and
// there `/tour-packages.rss` answers a blank HTML page, so only a page linking the feed has one.
const getTourTravelWorldPage = (
  url: string,
  content: string | undefined,
): TourTravelWorldPage | undefined => {
  if (!content) {
    return
  }

  const { hostname } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href, url)

    if (target && isHostOf(target, hostname) && isAnyOf(target.pathname, '/tour-packages.rss')) {
      return { root: target.origin }
    }
  }
}

export const tourTravelWorldHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isTourTravelWorldHtml })) {
      return false
    }

    return getTourTravelWorldPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getTourTravelWorldPage(url, content)

    if (!page) {
      return []
    }

    return [feeds.getFeedEntry('tour-packages', { root: page.root })]
  },
}
