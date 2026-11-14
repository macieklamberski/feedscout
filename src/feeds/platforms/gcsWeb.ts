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
// The news releases narrowed to a category and the SEC filings narrowed to a filing group are
// claimed only, since no page URL names the category or the group. An `items` count stays under
// the feed it sizes.
const feeds = definePlatformFeeds(
  [
    { key: 'gcs-web:news-releases', template: '{scheme}://{host}/rss/news-releases.xml' },
    {
      key: 'gcs-web:news-releases-category',
      template: '{scheme}://{host}/rss/news-releases.xml?category={category}',
    },
    { key: 'gcs-web:sec-filings', template: '{scheme}://{host}/rss/sec-filings.xml' },
    {
      key: 'gcs-web:sec-filings-group',
      template: '{scheme}://{host}/rss/sec-filings.xml?sub_group={group}',
    },
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

  // The table reads `www.{site}` as the site, while that host has no DNS record, so the page parser
  // refuses it.
  getFeedHint: (url) => {
    if (!parseGcsWebUrl(url)) {
      return
    }

    return feeds.getFeedHint(url)
  },
}
