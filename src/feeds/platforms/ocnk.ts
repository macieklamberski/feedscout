import { getSubdomain, isAnyOf, isHostOrSubdomainOf } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { composeHint, findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OcnkUrl = { kind: 'shop'; shop: string } | { kind: 'customDomain' }

const domains = ['ocnk.net']

const cartScriptRegex =
  /^(?:https?:\/\/[^/]+)?\/res\/[^/]+\/js\/(?:ocnk|pack\/ocnk-min)\.js(?:\?|$)/

const excludedSubdomains = ['admin', 'api', 'app', 'auth', 'blog', 'www']

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

  const shop = getSubdomain(url, domains)

  if (!shop || shop.includes('.') || isAnyOf(shop, excludedSubdomains)) {
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
      return [
        {
          uri: `${new URL(url).origin}/rss/rss.php`,
          hint: composeHint('ocnk:products', 'rdf'),
        },
      ]
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
