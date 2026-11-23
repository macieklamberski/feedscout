import { gcsWeb } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement, isRootOfPage } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: events, news-releases, sec-filings.

export type GcsWebUrl = { kind: 'site' }

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
  if (gcsWeb.pages.read(url)?.key !== 'site') {
    return
  }

  return { kind: 'site' }
}

export const gcsWebHandler: PlatformHandler = {
  match: (url, content) => {
    if (gcsWeb.pages.read(url)) {
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
      page.getFeedEntry('news-releases'),
      page.getFeedEntry('sec-filings'),
      page.getFeedEntry('events'),
    ]
  },

  getFeedHint: feeds.getFeedHint,
}
