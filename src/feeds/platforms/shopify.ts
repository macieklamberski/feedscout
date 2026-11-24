import { shopify } from 'feedintel'
import { includesAnyOf } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type ShopifyUrl = { kind: 'blog'; handle: string; tag?: string }

const feeds = withHintLabels(shopify.feeds)

export const isShopifyHeaders = (headers: Headers): boolean => {
  return includesAnyOf(headers.get('powered-by'), 'shopify')
}

export const parseShopifyUrl = (url: string): ShopifyUrl | undefined => {
  const page = shopify.pages.read(url, { isAnyHost: true })

  if (!page) {
    return
  }

  const { handle } = page.params

  if (page.key === 'blog-tag') {
    return { kind: 'blog', handle, tag: page.params.tag }
  }

  return { kind: 'blog', handle }
}

export const shopifyHandler: PlatformHandler = {
  match: (url, content, headers) => {
    if (!hasMarker(content, headers, { headers: isShopifyHeaders })) {
      return false
    }

    return parseShopifyUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseShopifyUrl(url)
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    if (parsed.tag) {
      return [
        page.getFeedEntry('blog', { handle: parsed.handle }),
        page.getFeedEntry('blog-tag', { handle: parsed.handle, tag: parsed.tag }),
      ]
    }

    return [page.getFeedEntry('blog', { handle: parsed.handle })]
  },

  getFeedHint: feeds.getFeedHint,
}
