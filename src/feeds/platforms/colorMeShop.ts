import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ColorMeShopUrl = { kind: 'shop' }

const domains = ['shop-pro.jp']

const excludedSubdomains = [
  'admin',
  'api',
  'app',
  'developer',
  'developer-docs',
  'err',
  'help',
  'imageproxy',
  'img',
  'page',
  'secure',
  'static-www-front',
  'www',
]

// Numbered image and access-log hosts, such as img15 and acclog001.
const excludedSubdomainRegex = /^(acclog|img)\d+$/

// Every shop page sets the session cookie, on shop-pro.jp and on a shop's own domain alike, and
// the service hosts of shop-pro.jp set none.
export const isColorMeShopHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('colorme_PHPSESSID')
}

export const parseColorMeShopUrl = (url: string): ColorMeShopUrl | undefined => {
  const shop = getSubdomain(url, domains)

  // A nested subdomain like blog.{shop}.shop-pro.jp is a JUGEM blog, not a shop.
  if (
    !shop ||
    shop.includes('.') ||
    isAnyOf(shop, excludedSubdomains) ||
    excludedSubdomainRegex.test(shop)
  ) {
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
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/?mode=rss`, hint: composeHint('color-me-shop:products', 'rdf') },
      { uri: `${origin}/?mode=atom`, hint: composeHint('color-me-shop:products', 'atom') },
    ]
  },
}
