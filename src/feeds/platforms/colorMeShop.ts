import { colorMeShop } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ColorMeShopUrl = { kind: 'shop' }

const domains = colorMeShop.hosts.tenants

// Numbered image and access-log hosts, such as img15 and acclog001.
const numberedHostRegex = /^(acclog|img)\d+$/

const feeds = withHintLabels(colorMeShop.feeds)

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
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('products', {}, 'rdf'), page.getFeedEntry('products', {}, 'atom')]
  },

  // The table reads a numbered host such as img15 as a shop, so the page parser refuses it first.
  getFeedHint: (url) => {
    if (!parseColorMeShopUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
