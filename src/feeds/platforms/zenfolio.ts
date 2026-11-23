import { zenfolio } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog, featured, recent.

export type ZenfolioUrl = { kind: 'site' }

const zenfolioAssetRegex = /^(?:https?:)?\/\/cdn\.zenfolio\.com\/zf\//i

const feeds = withHintLabels(zenfolio.feeds)

export const isZenfolioHtml = (content: string): boolean => {
  const stylesheet = findElement(content, (element) => {
    return element.name === 'link' && zenfolioAssetRegex.test(element.attribs.href ?? '')
  })

  return stylesheet !== undefined
}

export const isZenfolioHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('zf_5y_visitor')
}

// The apex and the service subdomains of zenfolio.com run Zenfolio itself, not a photographer's
// site. Every other host belongs to one photographer, so every page leads to the site's feeds.
export const parseZenfolioUrl = (url: string): ZenfolioUrl | undefined => {
  if (!URL.canParse(url) || zenfolio.pages.read(url)?.key === 'platform') {
    return
  }

  return { kind: 'site' }
}

export const zenfolioHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const hasZenfolioMarker = hasMarker(content, headers, {
      html: isZenfolioHtml,
      headers: isZenfolioHeaders,
    })

    if (!zenfolio.pages.read(url) && !hasZenfolioMarker) {
      return false
    }

    return parseZenfolioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseZenfolioUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [
      page.getFeedEntry('recent', {}, 'rss'),
      page.getFeedEntry('recent', {}, 'atom'),
      page.getFeedEntry('featured', {}, 'rss'),
      page.getFeedEntry('featured', {}, 'atom'),
      page.getFeedEntry('blog', {}, 'rss'),
      page.getFeedEntry('blog', {}, 'atom'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
