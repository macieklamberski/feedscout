import { gcsWeb } from 'feedintel'
import { parseUrl } from 'trousse'
import { withHintLabels } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: events, news-releases, sec-filings.

export type GcsWebUrl = { kind: 'site' }

const feeds = withHintLabels(gcsWeb.feeds)

const getAssetUrl = (element: Element): string => {
  return element.attribs.href ?? element.attribs.src ?? ''
}

// A site loads its assets from its own bucket under its own origin.
export const isGcsWebPage = (url: string, content: string | undefined): boolean => {
  const origin = parseUrl(url)?.origin

  if (!origin) {
    return false
  }

  const asset = findElement(content, (element) => {
    const assetUrl = parseUrl(getAssetUrl(element), url)?.href ?? ''

    return gcsWeb.pages.read(assetUrl, { root: origin })?.key === 'asset'
  })

  return asset !== undefined
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
