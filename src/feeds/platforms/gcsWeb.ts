import { isHostOrSubdomainOf, parseUrl } from 'trousse'
import { definePlatformFeeds } from '../../common/uris/platform/feeds.js'
import type { PlatformHandler } from '../../common/uris/platform/types.js'
import { type Element, findElement, getTenantSubdomain, isRootOfPage } from '../../common/utils.js'

// Discoverability: Not discoverable without handler.
// Handler needed for: all shapes.

export type GcsWebUrl = { kind: 'site' }

const domains = ['gcs-web.com']

const filesPathRegex = /\/sites\/g\/files\/knoqqb\d+\//i

// A site on its own domain is known only by its markup, so its feeds are built but not claimed.
const feeds = definePlatformFeeds(
  [
    { key: 'gcs-web:news-releases', template: '{scheme}://{host}/rss/news-releases.xml' },
    { key: 'gcs-web:sec-filings', template: '{scheme}://{host}/rss/sec-filings.xml' },
    { key: 'gcs-web:events', template: '{scheme}://{host}/rss/events.xml' },
  ],
  { domains },
)

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
    const { protocol, host } = new URL(url)
    const params = { scheme: protocol.slice(0, -1), host }

    return [
      feeds.getFeedEntry('gcs-web:news-releases', params),
      feeds.getFeedEntry('gcs-web:sec-filings', params),
      feeds.getFeedEntry('gcs-web:events', params),
    ]
  },

  // The table reads any host under gcs-web.com, so the page parser refuses the apex, which does not
  // answer, and a nested subdomain, which has no DNS record.
  getFeedHint: (url) => {
    if (!parseGcsWebUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
