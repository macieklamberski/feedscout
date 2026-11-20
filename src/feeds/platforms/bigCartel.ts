import { bigCartel } from 'feedintel'
import { isAnyOf, isHostOrSubdomainOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: products.

export type BigCartelUrl = { kind: 'store' }

const domains = bigCartel.hosts.tenants

const frameOptionsRegex = /https:\/\/my\.bigcartel\.com/i
const themeStylesheetRegex = /^\/theme_stylesheets\/\d+\/\d+\/theme\.css$/i

const feeds = withHintLabels(bigCartel.feeds)

export const isBigCartelHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return (
      element.name === 'link' &&
      isAnyOf(element.attribs.rel, 'stylesheet') &&
      themeStylesheetRegex.test(element.attribs.href ?? '')
    )
  })

  return stylesheet !== undefined
}

export const isBigCartelHeaders = (headers: Headers): boolean => {
  return frameOptionsRegex.test(headers.get('x-frame-options') ?? '')
}

export const parseBigCartelUrl = (url: string): BigCartelUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'store' }
}

export const bigCartelHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return parseBigCartelUrl(url) !== undefined
    }

    return hasMarker(content, headers, { html: isBigCartelHtml, headers: isBigCartelHeaders })
  },

  resolve: (url) => {
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    // The linked `/products.xml` is a Google Merchant feed whose items have no title or link, so it
    // parses with no items.
    return [page.getFeedEntry('products')]
  },

  getFeedHint: feeds.getFeedHint,
}
