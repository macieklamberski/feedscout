import { ocnk } from 'feedintel'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { findElement, getMarkerLinkUrl, hasMarker } from '../../common/utils.js'

// Discoverability: Discoverable without handler.

export type OcnkUrl = { kind: 'shop'; shop: string } | { kind: 'customDomain' }

const feeds = withHintLabels(ocnk.feeds)

export const isOcnkHtml = (content: string): boolean => {
  const script = findElement(content, (element) => {
    const scriptUrl = getMarkerLinkUrl(element.attribs.src)

    return (
      element.name === 'script' &&
      ocnk.pages.readUrl(scriptUrl, { isAnyHost: true })?.key === 'asset'
    )
  })

  return script !== undefined
}

export const parseOcnkUrl = (url: string): OcnkUrl | undefined => {
  const page = ocnk.pages.readUrl(url)

  if (!page) {
    return { kind: 'customDomain' }
  }

  if (page.key !== 'shop') {
    return
  }

  return { kind: 'shop', shop: page.values.shop }
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
    const page = feeds.forSite(url)

    if (!parsed || !page) {
      return []
    }

    return [page.getFeedEntry('products', {}, 'rdf')]
  },

  getFeedHint: feeds.getFeedHint,
}
