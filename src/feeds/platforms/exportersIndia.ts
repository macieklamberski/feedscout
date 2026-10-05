import { parseUrl } from 'trousse'
import type { DiscoverUriEntry } from '../../common/types.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//
const productsFeedPathRegex = /^\/products\.rss$/
const servicesFeedPathRegex = /^\/services\.rss$/

export type ExportersIndiaPage = { productsFeedUrl?: string; servicesFeedUrl?: string }

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

  const { host } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')
  let productsFeedUrl: string | undefined
  let servicesFeedUrl: string | undefined

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href ?? '', url)

    if (target?.host !== host) {
      continue
    }

    if (productsFeedPathRegex.test(target.pathname)) {
      productsFeedUrl ??= target.href
    }

    if (servicesFeedPathRegex.test(target.pathname)) {
      servicesFeedUrl ??= target.href
    }
  }

  if (!productsFeedUrl && !servicesFeedUrl) {
    return
  }

  return { productsFeedUrl, servicesFeedUrl }
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

    const uris: Array<DiscoverUriEntry> = []

    if (page.productsFeedUrl) {
      uris.push({ uri: page.productsFeedUrl, hint: composeHint('exporters-india:products') })
    }

    if (page.servicesFeedUrl) {
      uris.push({ uri: page.servicesFeedUrl, hint: composeHint('exporters-india:services') })
    }

    return uris
  },
}
