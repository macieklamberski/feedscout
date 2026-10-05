import { getSubdomain, isAnyOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OcnkUrl = { kind: 'shop'; shop: string }

const domains = ['ocnk.net']

const excludedSubdomains = ['admin', 'api', 'app', 'auth', 'blog', 'www']

export const parseOcnkUrl = (url: string): OcnkUrl | undefined => {
  const shop = getSubdomain(url, domains)

  if (!shop || shop.includes('.') || isAnyOf(shop, excludedSubdomains)) {
    return
  }

  return { kind: 'shop', shop }
}

export const ocnkHandler: PlatformHandler = {
  match: (url) => {
    return parseOcnkUrl(url) !== undefined
  },

  resolve: (url) => {
    const parsed = parseOcnkUrl(url)

    if (!parsed) {
      return []
    }

    // Every shop page redirects to https and its alternate link spells the feed with https.
    return [
      {
        uri: `https://${parsed.shop}.ocnk.net/rss/rss.php`,
        hint: composeHint('ocnk:products', 'rdf'),
      },
    ]
  },
}
