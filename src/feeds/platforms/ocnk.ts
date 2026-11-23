import { ocnk } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OcnkUrl = { kind: 'shop'; shop: string } | { kind: 'customDomain' }

const cartScriptRegex =
  /^(?:https?:\/\/[^/]+)?\/res\/[^/]+\/js\/(?:ocnk|pack\/ocnk-min)\.js(?:\?|$)/i

const feeds = withHintLabels(ocnk.feeds)

// Every shop template loads the cart script from its `/res/{template}/js/` folder, on a custom
// domain too: `ocnk.js` in the PC templates, `pack/ocnk-min.js` in the responsive ones.
export const isOcnkHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    return element.name === 'script' && cartScriptRegex.test(element.attribs.src ?? '')
  })

  return script !== undefined
}

export const parseOcnkUrl = (url: string): OcnkUrl | undefined => {
  const page = ocnk.pages.read(url)

  if (!page) {
    return { kind: 'customDomain' }
  }

  if (page.key === 'platform') {
    return
  }

  return { kind: 'shop', shop: page.params.shop }
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
    const page = feeds.forUrl(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('products', {}, 'rdf')]
  },

  getFeedHint: feeds.getFeedHint,
}
