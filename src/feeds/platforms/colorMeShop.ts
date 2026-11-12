import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ColorMeShopUrl = { kind: 'shop' }

const domains = ['shop-pro.jp']

// Numbered image and access-log hosts, such as img15 and acclog001.
const numberedHostRegex = /^(acclog|img)\d+$/

// A shop on its own domain is known only by its cookie, so its feeds are built but not claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'color-me-shop:products', template: '{scheme}://{host}/?mode=rss', format: 'rdf' },
    { key: 'color-me-shop:products', template: '{scheme}://{host}/?mode=atom', format: 'atom' },
  ],
  { domains },
)

// Every shop page sets the session cookie, on shop-pro.jp and on a shop's own domain alike, and
// the service hosts of shop-pro.jp set none.
export const isColorMeShopHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('colorme_PHPSESSID')
}

export const parseColorMeShopUrl = (url: string): ColorMeShopUrl | undefined => {
  // A nested subdomain like blog.{shop}.shop-pro.jp is a JUGEM blog, not a shop.
  const shop = getTenantSubdomain(url, domains)

  if (!shop || numberedHostRegex.test(shop)) {
    return
  }

  return { kind: 'shop' }
}

export const colorMeShopHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (parseColorMeShopUrl(url)) {
      return true
    }

    return hasMarker(content, headers, { headers: isColorMeShopHeaders })
  },

  resolve: (url) => {
    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }

    return [
      feeds.getFeedEntry('color-me-shop:products', params, 'rdf'),
      feeds.getFeedEntry('color-me-shop:products', params, 'atom'),
    ]
  },

  // The table reads any host under shop-pro.jp, so the page parser refuses the service hosts and a
  // JUGEM blog on a nested subdomain first.
  getFeedHint: (url) => {
    if (!parseColorMeShopUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
