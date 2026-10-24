import { isHostOrSubdomainOf, parseUrl } from 'trousse'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import {
  composeHint,
  type Element,
  findElement,
  getTenantSubdomain,
  isRootOfPage,
} from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type GcsWebUrl = { kind: 'site' }

const domains = ['gcs-web.com']

const filesPathRegex = /\/sites\/g\/files\/knoqqb\d+\//

const getAssetUrl = (element: Element): string => {
  return element.attribs.href ?? element.attribs.src ?? ''
}

export const isGcsWebPage = (url: string, content: string | undefined): boolean => {
  const asset = findElement(content, (element) => filesPathRegex.test(getAssetUrl(element)))
  const assetUrl = asset ? parseUrl(getAssetUrl(asset), url) : undefined

  if (!assetUrl) {
    return false
  }

  return isRootOfPage(assetUrl.origin, url)
}

export const parseGcsWebUrl = (url: string): GcsWebUrl | undefined => {
  if (!getTenantSubdomain(url, domains)) {
    return
  }

  return { kind: 'site' }
}

export const gcsWebHandler: PlatformHandler = {
  match: (url, content) => {
    if (isHostOrSubdomainOf(url, domains)) {
      return parseGcsWebUrl(url) !== undefined
    }

    return isGcsWebPage(url, content)
  },

  resolve: (url) => {
    const { origin } = new URL(url)

    return [
      { uri: `${origin}/rss/news-releases.xml`, hint: composeHint('gcs-web:news-releases') },
      { uri: `${origin}/rss/sec-filings.xml`, hint: composeHint('gcs-web:sec-filings') },
      { uri: `${origin}/rss/events.xml`, hint: composeHint('gcs-web:events') },
    ]
  },
}
