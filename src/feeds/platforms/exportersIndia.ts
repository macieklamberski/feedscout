import { exportersIndia } from 'feedintel'
import { isAnyOf, isHostOf, isPresent, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//i

export type ExportersIndiaPage = { productsRoot?: string; servicesRoot?: string }

const feeds = withHintLabels(exportersIndia.feeds)

// Every Weblink.In catalog site loads its template stylesheet from the shared asset host.
export const isExportersIndiaHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      element.attribs.rel === 'stylesheet' &&
      templateStylesheetRegex.test(element.attribs.href ?? '')
    )
  })

  return stylesheet !== undefined
}

// Weblink.In builds its real estate, travel and jobs sites on the same template, and every site
// answers the feed path of a catalog it lacks, such as /services.rss on a products site, with a
// blank HTML page, so only a page linking the feed has one.
const getExportersIndiaPage = (
  url: string,
  content: string | undefined,
): ExportersIndiaPage | undefined => {
  if (!content) {
    return
  }

  const { hostname } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')
  let productsRoot: string | undefined
  let servicesRoot: string | undefined

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href, url)

    if (!target || !isHostOf(target, hostname)) {
      continue
    }

    if (isAnyOf(target.pathname, '/products.rss') && productsRoot === undefined) {
      productsRoot = target.origin
    }

    if (isAnyOf(target.pathname, '/services.rss') && servicesRoot === undefined) {
      servicesRoot = target.origin
    }
  }

  if (!productsRoot && !servicesRoot) {
    return
  }

  return { productsRoot, servicesRoot }
}

export const exportersIndiaHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { html: isExportersIndiaHtml })) {
      return false
    }

    return getExportersIndiaPage(url, content) !== undefined
  },

  resolve: (url, content) => {
    const page = getExportersIndiaPage(url, content)

    if (!page) {
      return []
    }

    return [
      feeds.getFeedEntry('products', { root: page.productsRoot }),
      feeds.getFeedEntry('services', { root: page.servicesRoot }),
    ].filter(isPresent)
  },
}
