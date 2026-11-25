import { bigCartel } from 'feedintel'
import { isAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getRootLinkUrl, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: products.

export type BigCartelUrl = { kind: 'store' }

const frameOptionsRegex = /https:\/\/my\.bigcartel\.com/i

const feeds = withHintLabels(bigCartel.feeds)

export const isBigCartelHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    const stylesheetUrl = getRootLinkUrl(element.attribs.href)

    return (
      element.name === 'link' &&
      isAnyOf(element.attribs.rel, 'stylesheet') &&
      bigCartel.pages.readUrl(stylesheetUrl, { isAnyHost: true })?.key === 'asset'
    )
  })

  return stylesheet !== undefined
}

export const isBigCartelHeaders = (headers: Headers): boolean => {
  return frameOptionsRegex.test(headers.get('x-frame-options') ?? '')
}

export const parseBigCartelUrl = (url: string): BigCartelUrl | undefined => {
  if (bigCartel.pages.readUrl(url)?.key !== 'store') {
    return
  }

  return { kind: 'store' }
}

export const bigCartelHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (bigCartel.pages.readUrl(url)) {
      return parseBigCartelUrl(url) !== undefined
    }

    return hasMarker(content, headers, { html: isBigCartelHtml, headers: isBigCartelHeaders })
  },

  resolve: (url) => {
    const page = feeds.forSite(url)

    if (!page) {
      return []
    }

    // The linked `/products.xml` is a Google Merchant feed whose items have no title or link, so it
    // parses with no items.
    return [page.getFeedEntry('products')]
  },

  getFeedHint: feeds.getFeedHint,
}
