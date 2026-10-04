import { getSubdomain, isAnyOf, isHostOf, isSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, site.

export type ZenfolioUrl = { kind: 'site' }

const domains = ['zenfolio.com']

const zenfolioAssetRegex = /^(?:https?:)?\/\/cdn\.zenfolio\.com\/zf\//

const excludedSubdomains = ['app', 'support', 'www']

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
  const parsedUrl = parseUrl(url)

  if (!parsedUrl || isHostOf(parsedUrl, domains)) {
    return
  }

  if (isAnyOf(getSubdomain(parsedUrl, domains), excludedSubdomains)) {
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

    if (!isSubdomainOf(url, domains) && !hasZenfolioMarker) {
      return false
    }

    return parseZenfolioUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseZenfolioUrl(url)

    if (!parsed) {
      return []
    }

    const { origin } = new URL(url)

    return [
      { uri: `${origin}/recent.rss`, hint: composeHint('zenfolio:recent', 'rss') },
      { uri: `${origin}/recent.atom`, hint: composeHint('zenfolio:recent', 'atom') },
      { uri: `${origin}/featured.rss`, hint: composeHint('zenfolio:featured', 'rss') },
      { uri: `${origin}/featured.atom`, hint: composeHint('zenfolio:featured', 'atom') },
      { uri: `${origin}/blog.rss`, hint: composeHint('zenfolio:blog', 'rss') },
      { uri: `${origin}/blog.atom`, hint: composeHint('zenfolio:blog', 'atom') },
    ]
  },
}
