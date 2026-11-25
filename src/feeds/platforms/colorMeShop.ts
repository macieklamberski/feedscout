import { colorMeShop } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { getCookieNames, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ColorMeShopUrl = { kind: 'shop' }

const feeds = withHintLabels(colorMeShop.feeds)

// Every shop page sets the session cookie, on shop-pro.jp and on a shop's own domain alike, and
// the service hosts of shop-pro.jp set none.
export const isColorMeShopHeaders = (headers: Headers): boolean => {
  return getCookieNames(headers).includes('colorme_PHPSESSID')
}

export const parseColorMeShopUrl = (url: string): ColorMeShopUrl | undefined => {
  if (!colorMeShop.pages.readUrl(url)) {
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
    const page = feeds.forSite(url)

    if (!page) {
      return []
    }

    return [page.getFeedEntry('products', {}, 'rdf'), page.getFeedEntry('products', {}, 'atom')]
  },

  getFeedHint: feeds.getFeedHint,
}
