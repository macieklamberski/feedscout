import { isHostOrSubdomainOf } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getTenantSubdomain, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OcnkUrl = { kind: 'shop'; shop: string } | { kind: 'customDomain' }

const domains = ['ocnk.net']

const cartScriptRegex =
  /^(?:https?:\/\/[^/]+)?\/res\/[^/]+\/js\/(?:ocnk|pack\/ocnk-min)\.js(?:\?|$)/i

// Every shop page redirects to https and its alternate link spells the feed with https.
const shopFeeds = definePlatformFeeds([
  { key: 'ocnk:products', template: 'https://{shop}.ocnk.net/rss/rss.php', format: 'rdf' },
])

// A shop on its own domain is known only by its markers, so its feed is built but not claimed.
const customDomainFeeds = definePlatformFeeds(
  [{ key: 'ocnk:products', template: '{scheme}://{host}/rss/rss.php', format: 'rdf' }],
  { domains },
)

// Every shop template loads the cart script from its `/res/{template}/js/` folder, on a custom
// domain too: `ocnk.js` in the PC templates, `pack/ocnk-min.js` in the responsive ones.
export const isOcnkHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && cartScriptRegex.test(element.attribs.src ?? '')
  })

  return script !== undefined
}

export const parseOcnkUrl = (url: string): OcnkUrl | undefined => {
  if (!isHostOrSubdomainOf(url, domains)) {
    return { kind: 'customDomain' }
  }

  const shop = getTenantSubdomain(url, domains)

  if (!shop) {
    return
  }

  return { kind: 'shop', shop }
}

export const ocnkHandler: PlatformHandler = {
  match: (url, content, headers) => {
    const parsed = parseOcnkUrl(url)

    if (parsed?.kind === 'customDomain') {
      return hasMarker(content, headers, { html: isOcnkHtml })
    }

    return parsed !== undefined
  },

  resolve: (url) => {
    const parsed = parseOcnkUrl(url)

    if (!parsed) {
      return []
    }

    // A custom-domain shop spells its alternate link on its own origin.
    if (parsed.kind === 'customDomain') {
      const { protocol, host } = new URL(url)
      const params = { scheme: protocol.slice(0, -1), host }

      return [customDomainFeeds.getFeedEntry('ocnk:products', params, 'rdf')]
    }

    return [shopFeeds.getFeedEntry('ocnk:products', { shop: parsed.shop }, 'rdf')]
  },

  getFeedKey: shopFeeds.getFeedKey,
}
