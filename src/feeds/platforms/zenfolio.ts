import { isHostOrSubdomainOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Generic partly covers blog, site.

export type ZenfolioUrl = { kind: 'site' }

const domains = ['zenfolio.com']

const zenfolioAssetRegex = /^(?:https?:)?\/\/cdn\.zenfolio\.com\/zf\//i

// A custom domain is known only by its markers, so its feeds are built here but not claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'zenfolio:recent', template: '{scheme}://{host}/recent.rss', format: 'rss' },
    { key: 'zenfolio:recent', template: '{scheme}://{host}/recent.atom', format: 'atom' },
    { key: 'zenfolio:featured', template: '{scheme}://{host}/featured.rss', format: 'rss' },
    { key: 'zenfolio:featured', template: '{scheme}://{host}/featured.atom', format: 'atom' },
    { key: 'zenfolio:blog', template: '{scheme}://{host}/blog.rss', format: 'rss' },
    { key: 'zenfolio:blog', template: '{scheme}://{host}/blog.atom', format: 'atom' },
  ],
  { domains },
)

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

  if (!parsedUrl) {
    return
  }

  if (isHostOrSubdomainOf(parsedUrl, domains) && !getTenantSubdomain(parsedUrl, domains)) {
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

    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }

    return [
      feeds.getFeedEntry('zenfolio:recent', params, 'rss'),
      feeds.getFeedEntry('zenfolio:recent', params, 'atom'),
      feeds.getFeedEntry('zenfolio:featured', params, 'rss'),
      feeds.getFeedEntry('zenfolio:featured', params, 'atom'),
      feeds.getFeedEntry('zenfolio:blog', params, 'rss'),
      feeds.getFeedEntry('zenfolio:blog', params, 'atom'),
    ]
  },

  // The table reads any host under zenfolio.com, so the page parser first refuses the apex, www
  // and a nested subdomain, which are not one photographer's site.
  getFeedKey: (url) => {
    if (!parseZenfolioUrl(url)) {
      return
    }

    return feeds.getFeedKey(url)
  },
}
