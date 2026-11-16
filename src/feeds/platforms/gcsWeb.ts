import { gcsWeb } from 'feedintel'
import { isHostOrSubdomainOf, parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement, getTenantSubdomain, isRootOfPage } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type GcsWebUrl = { kind: 'site' }

const domains = gcsWeb.tenantDomains

const filesPathRegex = /\/sites\/g\/files\/knoqqb\d+\//i

const feeds = withHintLabels(gcsWeb.feeds)

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
    const page = feeds.forUrl(url)

    if (!page) {
      return []
    }

    return [
      page.getFeedEntry('gcs-web:news-releases'),
      page.getFeedEntry('gcs-web:sec-filings'),
      page.getFeedEntry('gcs-web:events'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
