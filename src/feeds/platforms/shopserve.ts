import { startsWithAnyOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

// A shop is known only by its marker, so its feed is built here but not claimed.
const feeds = definePlatformFeeds([{ key: 'shopserve:news', template: '{root}/hpgen/HPB/rss.xml' }])

const isGeneratedPath = (value: string | undefined): boolean => {
  return startsWithAnyOf(value, '/hpgen/HPB/')
}

// Every desktop page Shopserve generates links its news entries, categories and theme images
// under /hpgen/HPB/ by root-relative paths, on a shop's own domain too. The /smp/ pages do not.
export const isShopserveHtml = (content: string): boolean => {
  const element = findElement(content, (element) => {
    return isGeneratedPath(element.attribs.href) || isGeneratedPath(element.attribs.src)
  })

  return element !== undefined
}

export const shopserveHandler: PlatformHandler = {
  match: (_url, content, headers) => {
    return hasMarker(content, headers, { html: isShopserveHtml })
  },

  resolve: (url) => {
    const pageFeeds = feeds.forUrl(url)

    if (!pageFeeds) {
      return []
    }

    return [pageFeeds.getFeedEntry('shopserve:news')]
  },
}
