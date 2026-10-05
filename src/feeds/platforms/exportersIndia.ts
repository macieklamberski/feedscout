import { parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, findElements, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

const templateStylesheetRegex = /^(?:https?:)?\/\/catalog\.wlimg\.com\/templates-images\//
const productsFeedPathRegex = /^\/products\.rss$/

export type ExportersIndiaPage = { feedUrl: string }

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

// Weblink.In builds its real estate, travel, jobs and services sites on the same template, and
// there `/products.rss` answers a blank HTML page, so only a page linking the feed has one.
const getExportersIndiaPage = (
  url: string,
  content: string | undefined,
): ExportersIndiaPage | undefined => {
  if (!content) {
    return
  }

  const { host } = new URL(url)
  const anchors = findElements(content, (element) => element.name === 'a')

  for (const anchor of anchors) {
    const target = parseUrl(anchor.attribs.href ?? '', url)

    if (target?.host === host && productsFeedPathRegex.test(target.pathname)) {
      return { feedUrl: target.href }
    }
  }
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

    return [{ uri: page.feedUrl, hint: composeHint('exporters-india:products') }]
  },
}
