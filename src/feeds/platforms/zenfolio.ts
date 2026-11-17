import { isHostOrSubdomainOf, isSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Partially discoverable without handler.
// Handler needed for: blog, featured, recent.

export type ZenfolioUrl = { kind: 'site' }

const domains = ['zenfolio.com']

const zenfolioAssetRegex = /^(?:https?:)?\/\/cdn\.zenfolio\.com\/zf\//i

// A custom domain is known only by its markers, so its feeds are built here but not claimed.
const feeds = definePlatformFeeds(
  'zenfolio',
  [
    { key: 'recent', main: '{scheme}://{host}/recent.rss', format: 'rss' },
    { key: 'recent', main: '{scheme}://{host}/recent.atom', format: 'atom' },
    { key: 'featured', main: '{scheme}://{host}/featured.rss', format: 'rss' },
    { key: 'featured', main: '{scheme}://{host}/featured.atom', format: 'atom' },
    { key: 'blog', main: '{scheme}://{host}/blog.rss', format: 'rss' },
    { key: 'blog', main: '{scheme}://{host}/blog.atom', format: 'atom' },
  ],
  { hosts: { tenants: domains } },
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
